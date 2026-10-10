import { Webhooks } from "@dodopayments/nextjs";
import { getAdminDb } from '@/lib/firebase-admin';

export const POST = Webhooks({
  webhookKey: process.env.DODO_PAYMENTS_WEBHOOK_SECRET || "dummy_key_for_build",
  onPayload: async (payload) => {
    try {
      const db = getAdminDb();
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payloadData = payload.data as any;
      const metadata = payloadData?.metadata || {};
      let uid = metadata.uid;

      if (!uid && payloadData?.customer?.email) {
        const { getAdminAuth } = await import('@/lib/firebase-admin');
        const auth = getAdminAuth();
        try {
          const userRecord = await auth.getUserByEmail(payloadData.customer.email);
          uid = userRecord.uid;
          console.log(`Found UID ${uid} by email ${payloadData.customer.email}`);
        } catch (err) {
          console.warn(`Could not find Firebase user by email: ${payloadData.customer.email}`);
        }
      }

      if (!uid) {
        console.warn("Dodo Webhook received, but no UID found in metadata or customer", payloadData);
        return;
      }

      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

      const isEmployer = metadata.type === 'employer';

      switch (payload.type) {
        case "payment.succeeded":
          console.log("Payment succeeded:", payload.data);
          // Update user access just in case this was a one-time payment product
          await db.collection('users').doc(uid).set({
            isPremium: true,
            isSubscribed: true,
            isEmployer: isEmployer,
            ...(isEmployer && { role: 'employer' }),
            paymentGateway: 'dodo',
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date()
          }, { merge: true });

          // Log the transaction
          await db.collection('dodo_transactions').doc(payloadData.payment_id || "unknown").set({
            uid,
            status: 'succeeded',
            amount: payloadData.total_amount,
            currency: payloadData.currency,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });
          break;

        case "subscription.active":
        case "subscription.updated":
        case "subscription.renewed":
          console.log(`Subscription ${payload.type}:`, payload.data);
          // Update the user document to Premium
          await db.collection('users').doc(uid).set({
            isPremium: true,
            isSubscribed: true,
            isEmployer: isEmployer,
            ...(isEmployer && { role: 'employer' }),
            dodoSubscriptionId: payloadData.subscription_id,
            paymentGateway: 'dodo',
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date()
          }, { merge: true });
          
          await db.collection('dodo_transactions').doc(payloadData.subscription_id).set({
            uid,
            status: 'active',
            subscriptionId: payloadData.subscription_id,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });
          break;

        case "subscription.cancelled":
        case "subscription.failed":
        case "subscription.expired":
          console.log(`Subscription ${payload.type}:`, payload.data);
          // Do not immediately revoke access if it's just cancelled, wait for expiry.
          if (payload.type === 'subscription.cancelled') {
             await db.collection('users').doc(uid).set({
                cancel_at_period_end: true,
                updatedAt: new Date()
             }, { merge: true });
          } else {
             // For failed or expired
             await db.collection('users').doc(uid).set({
                isPremium: false,
                isSubscribed: false,
                updatedAt: new Date()
             }, { merge: true });
          }
          
          await db.collection('dodo_transactions').doc(`${payloadData.subscription_id}_${payload.type}`).set({
            uid,
            status: payload.type.split('.')[1],
            subscriptionId: payloadData.subscription_id,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });
          break;

        default:
          console.log(`Unhandled event type: ${payload.type}`);
      }
    } catch (error) {
      console.error("Error processing Dodo webhook event", error);
    }
  },
});
