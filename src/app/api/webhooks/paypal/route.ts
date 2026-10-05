import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

// In a real production app, you should verify the PayPal webhook signature.
// For now, this handles the BILLING.SUBSCRIPTION.ACTIVATED event.

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { event_type, resource } = body;

    if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' || event_type === 'BILLING.SUBSCRIPTION.UPDATED') {
      const planId = resource.plan_id;
      const customId = resource.custom_id; // we passed user.uid in custom_id

      if (customId) {
        const db = getAdminDb();
        const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
        
        const isEmployer = planId === process.env.NEXT_PUBLIC_PAYPAL_EMPLOYER_PLAN_ID;

        await db.collection('users').doc(customId).set({
          isPremium: true,
          isSubscribed: true,
          isEmployer: isEmployer,
          ...(isEmployer && { role: 'employer' }),
          paypalSubscriptionId: resource.id,
          paymentGateway: 'paypal',
          subscriptionExpiresAt: expiresAt,
          updatedAt: new Date()
        }, { merge: true });
      }
    } else if (event_type === 'PAYMENT.SALE.COMPLETED') {
      // This event fires when a recurring payment is successfully charged
      const subscriptionId = resource.billing_agreement_id;
      
      if (subscriptionId) {
        const db = getAdminDb();
        // Find the user with this subscription ID
        const usersSnapshot = await db.collection('users').where('paypalSubscriptionId', '==', subscriptionId).get();
        
        if (!usersSnapshot.empty) {
          const userDoc = usersSnapshot.docs[0];
          // Extend the subscription by 30 days from now
          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          
          await userDoc.ref.set({
            isPremium: true,
            isSubscribed: true,
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date()
          }, { merge: true });
        }
      }
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error in PayPal webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
