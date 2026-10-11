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

      const defaultExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const isEmployer = metadata.type === 'employer';

      const computeExpiresAt = () => {
        if (payloadData?.next_billing_date) {
          const nextDate = new Date(payloadData.next_billing_date);
          if (nextDate > new Date()) {
            return nextDate.toISOString();
          }
        }
        return defaultExpiresAt;
      };

      switch (payload.type) {
        case "payment.succeeded": {
          console.log("Payment succeeded:", payload.data);
          // Update user access for successful payment
          await db.collection('users').doc(uid).set({
            isPremium: true,
            isSubscribed: true,
            isEmployer: isEmployer,
            ...(isEmployer && { role: 'employer' }),
            ...(payloadData.subscription_id && { dodoSubscriptionId: payloadData.subscription_id }),
            paymentGateway: 'dodo',
            subscriptionPaymentStatus: 'succeeded',
            subscriptionExpiresAt: computeExpiresAt(),
            cancel_at_period_end: false,
            updatedAt: new Date()
          }, { merge: true });

          // Log the transaction
          await db.collection('dodo_transactions').doc(payloadData.payment_id || `pmt_${Date.now()}`).set({
            uid,
            status: 'succeeded',
            amount: payloadData.total_amount,
            currency: payloadData.currency,
            subscriptionId: payloadData.subscription_id || null,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });
          break;
        }

        case "payment.failed":
        case "payment.cancelled": {
          const pmtStatus = payload.type.split('.')[1]; // 'failed' or 'cancelled'
          console.log(`Payment ${pmtStatus}:`, payload.data);

          // Log the failed transaction
          await db.collection('dodo_transactions').doc(payloadData.payment_id || `pmt_${pmtStatus}_${Date.now()}`).set({
            uid,
            status: pmtStatus,
            amount: payloadData.total_amount,
            currency: payloadData.currency,
            subscriptionId: payloadData.subscription_id || null,
            errorCode: payloadData.error_code || null,
            errorMessage: payloadData.error_message || null,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });

          const userDoc = await db.collection('users').doc(uid).get();
          const userData = userDoc.data();

          const matchesCurrentSub = payloadData.subscription_id && userData?.dodoSubscriptionId === payloadData.subscription_id;

          // If this payment is associated with the user's active Dodo subscription or they have no active subscription:
          if (matchesCurrentSub || (!userData?.dodoSubscriptionId && !userData?.paypalSubscriptionId && !userData?.payuSubscriptionId)) {
            const now = new Date();
            const hasValidExpiry = userData?.subscriptionExpiresAt && new Date(userData.subscriptionExpiresAt) > now;

            if (!hasValidExpiry || userData?.subscriptionPaymentStatus === 'failed') {
              console.log(`Revoking Pro access for user ${uid} due to ${payload.type}`);
              await db.collection('users').doc(uid).set({
                isPremium: false,
                isSubscribed: false,
                subscriptionExpiresAt: null,
                subscriptionPaymentStatus: pmtStatus,
                updatedAt: new Date()
              }, { merge: true });
            } else {
              await db.collection('users').doc(uid).set({
                subscriptionPaymentStatus: 'failed',
                updatedAt: new Date()
              }, { merge: true });
            }
          }
          break;
        }

        case "subscription.active":
        case "subscription.renewed": {
          console.log(`Subscription ${payload.type}:`, payload.data);

          // CRITICAL: ONLY grant Pro access if subscription status is actually 'active'
          if (payloadData.status === 'active') {
            await db.collection('users').doc(uid).set({
              isPremium: true,
              isSubscribed: true,
              isEmployer: isEmployer,
              ...(isEmployer && { role: 'employer' }),
              dodoSubscriptionId: payloadData.subscription_id,
              paymentGateway: 'dodo',
              subscriptionPaymentStatus: 'active',
              subscriptionExpiresAt: computeExpiresAt(),
              cancel_at_period_end: false,
              updatedAt: new Date()
            }, { merge: true });
            
            await db.collection('dodo_transactions').doc(payloadData.subscription_id).set({
              uid,
              status: 'active',
              subscriptionId: payloadData.subscription_id,
              createdAt: new Date(),
              eventType: payload.type
            }, { merge: true });
          } else {
            console.warn(`Ignoring ${payload.type} for ${payloadData.subscription_id} because status is '${payloadData.status}' (not 'active')`);
          }
          break;
        }

        case "subscription.updated": {
          const subStatus = payloadData.status;
          console.log(`Subscription updated (status: ${subStatus}):`, payload.data);

          await db.collection('dodo_transactions').doc(`${payloadData.subscription_id}_updated_${Date.now()}`).set({
            uid,
            status: subStatus || 'updated',
            subscriptionId: payloadData.subscription_id,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });

          const userDoc = await db.collection('users').doc(uid).get();
          const userData = userDoc.data();

          if (subStatus === 'active') {
            // ONLY grant or maintain access when status is explicitly active
            await db.collection('users').doc(uid).set({
              isPremium: true,
              isSubscribed: true,
              isEmployer: isEmployer,
              ...(isEmployer && { role: 'employer' }),
              dodoSubscriptionId: payloadData.subscription_id,
              paymentGateway: 'dodo',
              subscriptionPaymentStatus: 'active',
              subscriptionExpiresAt: computeExpiresAt(),
              cancel_at_period_end: false,
              updatedAt: new Date()
            }, { merge: true });
          } else if (subStatus === 'failed') {
            // If subscription failed, never keep Pro access!
            const isCurrentSub = !userData?.dodoSubscriptionId || userData.dodoSubscriptionId === payloadData.subscription_id;
            if (isCurrentSub) {
              console.log(`Revoking Pro access for user ${uid} because subscription ${payloadData.subscription_id} updated to failed`);
              await db.collection('users').doc(uid).set({
                isPremium: false,
                isSubscribed: false,
                subscriptionExpiresAt: null,
                subscriptionPaymentStatus: 'failed',
                updatedAt: new Date()
              }, { merge: true });
            }
          } else if (subStatus === 'expired') {
            const isCurrentSub = !userData?.dodoSubscriptionId || userData.dodoSubscriptionId === payloadData.subscription_id;
            if (isCurrentSub) {
              await db.collection('users').doc(uid).set({
                isPremium: false,
                isSubscribed: false,
                subscriptionExpiresAt: null,
                subscriptionPaymentStatus: 'expired',
                updatedAt: new Date()
              }, { merge: true });
            }
          } else if (subStatus === 'cancelled') {
            if (userData?.dodoSubscriptionId === payloadData.subscription_id) {
              const now = new Date();
              const hasValidExpiry = userData?.subscriptionExpiresAt && new Date(userData.subscriptionExpiresAt) > now;
              if (hasValidExpiry && payloadData.cancel_at_next_billing_date) {
                await db.collection('users').doc(uid).set({
                  cancel_at_period_end: true,
                  updatedAt: new Date()
                }, { merge: true });
              } else {
                await db.collection('users').doc(uid).set({
                  isPremium: false,
                  isSubscribed: false,
                  cancel_at_period_end: false,
                  subscriptionExpiresAt: null,
                  updatedAt: new Date()
                }, { merge: true });
              }
            }
          }
          break;
        }

        case "subscription.cancelled":
        case "subscription.failed":
        case "subscription.expired": {
          console.log(`Subscription ${payload.type}:`, payload.data);
          
          await db.collection('dodo_transactions').doc(`${payloadData.subscription_id}_${payload.type}`).set({
            uid,
            status: payload.type.split('.')[1],
            subscriptionId: payloadData.subscription_id,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });

          const userDoc = await db.collection('users').doc(uid).get();
          const userData = userDoc.data();

          // Only ignore if the user currently has a different active Dodo subscription
          if (userData?.dodoSubscriptionId && userData.dodoSubscriptionId !== payloadData.subscription_id) {
            console.log(`Ignoring ${payload.type} for subscription ${payloadData.subscription_id} as it is not user ${uid}'s active subscription (${userData.dodoSubscriptionId}).`);
            break;
          }

          const now = new Date();
          const hasValidExpiry = userData?.subscriptionExpiresAt && new Date(userData.subscriptionExpiresAt) > now;

          if (payload.type === 'subscription.cancelled') {
             if (hasValidExpiry && payloadData.cancel_at_next_billing_date) {
               await db.collection('users').doc(uid).set({
                  cancel_at_period_end: true,
                  updatedAt: new Date()
               }, { merge: true });
             } else {
               await db.collection('users').doc(uid).set({
                  isPremium: false,
                  isSubscribed: false,
                  cancel_at_period_end: false,
                  subscriptionExpiresAt: null,
                  updatedAt: new Date()
               }, { merge: true });
             }
          } else if (payload.type === 'subscription.expired') {
             await db.collection('users').doc(uid).set({
                isPremium: false,
                isSubscribed: false,
                subscriptionExpiresAt: null,
                subscriptionPaymentStatus: 'expired',
                updatedAt: new Date()
             }, { merge: true });
          } else if (payload.type === 'subscription.failed') {
             // Payment for subscription failed! The user must NEVER receive or keep Pro access.
             console.log(`Revoking Pro access for user ${uid} due to subscription.failed`);
             await db.collection('users').doc(uid).set({
                isPremium: false,
                isSubscribed: false,
                subscriptionExpiresAt: null,
                subscriptionPaymentStatus: 'failed',
                updatedAt: new Date()
             }, { merge: true });
          }
          break;
        }

        case "subscription.on_hold":
        case "subscription.paused":
        case "subscription.past_due": {
          const subState = payload.type.split('.')[1];
          console.log(`Subscription ${subState}:`, payload.data);

          await db.collection('dodo_transactions').doc(`${payloadData.subscription_id}_${payload.type}`).set({
            uid,
            status: subState,
            subscriptionId: payloadData.subscription_id,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });

          const userDoc = await db.collection('users').doc(uid).get();
          const userData = userDoc.data();

          if (userData?.dodoSubscriptionId === payloadData.subscription_id) {
            const now = new Date();
            const hasValidExpiry = userData?.subscriptionExpiresAt && new Date(userData.subscriptionExpiresAt) > now;

            // If subscription is paused or past due without valid prepaid time:
            if (!hasValidExpiry || subState === 'paused') {
              await db.collection('users').doc(uid).set({
                isPremium: false,
                isSubscribed: false,
                subscriptionPaymentStatus: subState,
                updatedAt: new Date()
              }, { merge: true });
            } else {
              await db.collection('users').doc(uid).set({
                subscriptionPaymentStatus: subState,
                updatedAt: new Date()
              }, { merge: true });
            }
          }
          break;
        }

        case "subscription.unpaused":
        case "subscription.plan_changed": {
          console.log(`Subscription ${payload.type}:`, payload.data);

          await db.collection('dodo_transactions').doc(`${payloadData.subscription_id}_${payload.type}`).set({
            uid,
            status: payload.type.split('.')[1],
            subscriptionId: payloadData.subscription_id,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });

          if (payloadData.status === 'active') {
            await db.collection('users').doc(uid).set({
              isPremium: true,
              isSubscribed: true,
              isEmployer: isEmployer,
              ...(isEmployer && { role: 'employer' }),
              dodoSubscriptionId: payloadData.subscription_id,
              paymentGateway: 'dodo',
              subscriptionPaymentStatus: 'active',
              subscriptionExpiresAt: computeExpiresAt(),
              cancel_at_period_end: false,
              updatedAt: new Date()
            }, { merge: true });
          }
          break;
        }

        case "refund.succeeded": {
          console.log("Refund succeeded:", payload.data);

          await db.collection('dodo_transactions').doc(payloadData.refund_id || `ref_${Date.now()}`).set({
            uid,
            status: 'refunded',
            amount: payloadData.amount,
            currency: payloadData.currency,
            paymentId: payloadData.payment_id,
            reason: payloadData.reason || null,
            isPartial: payloadData.is_partial || false,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });

          // If a full refund was issued, revoke Pro access immediately
          if (!payloadData.is_partial) {
            console.log(`Revoking Pro access for user ${uid} due to full refund.`);
            await db.collection('users').doc(uid).set({
              isPremium: false,
              isSubscribed: false,
              subscriptionExpiresAt: null,
              subscriptionPaymentStatus: 'refunded',
              updatedAt: new Date()
            }, { merge: true });
          }
          break;
        }

        case "dispute.opened":
        case "dispute.lost":
        case "dispute.accepted": {
          console.log(`Dispute event (${payload.type}):`, payload.data);

          await db.collection('dodo_transactions').doc(payloadData.dispute_id || `disp_${Date.now()}`).set({
            uid,
            status: payload.type.split('.')[1],
            amount: payloadData.amount,
            currency: payloadData.currency,
            paymentId: payloadData.payment_id,
            remarks: payloadData.remarks || null,
            createdAt: new Date(),
            eventType: payload.type
          }, { merge: true });

          // Revoke access on dispute / chargeback
          console.log(`Revoking Pro access for user ${uid} due to ${payload.type}`);
          await db.collection('users').doc(uid).set({
            isPremium: false,
            isSubscribed: false,
            subscriptionExpiresAt: null,
            subscriptionPaymentStatus: 'disputed',
            updatedAt: new Date()
          }, { merge: true });
          break;
        }

        case "payment.processing":
        case "abandoned_checkout.detected":
        case "abandoned_checkout.recovered":
        case "dunning.started":
        case "dunning.recovered": {
          console.log(`Audit event (${payload.type}):`, payload.data);
          const entityId = payloadData.payment_id || payloadData.subscription_id || payloadData.checkout_session_id || `audit_${Date.now()}`;
          await db.collection('dodo_transactions').doc(`${entityId}_${payload.type}`).set({
            uid,
            status: payload.type.split('.')[1] || payload.type,
            eventType: payload.type,
            createdAt: new Date()
          }, { merge: true });
          break;
        }

        default:
          console.log(`Unhandled event type: ${payload.type}`);
      }
    } catch (error) {
      console.error("Error processing Dodo webhook event", error);
    }
  },
});
