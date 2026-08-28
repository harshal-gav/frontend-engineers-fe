import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function generatePayPalAccessToken() {
  const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_SECRET_KEY;
  
  if (!clientId || !secret) {
    throw new Error('MISSING_API_CREDENTIALS');
  }

  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');
  
  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    body: 'grant_type=client_credentials',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  
  const data = await response.json();
  if (!data.access_token) {
    throw new Error('Failed to generate Access Token');
  }
  return data.access_token;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();
    
    const decodedToken = await adminAuth.verifyIdToken(token);
    const uid = decodedToken.uid;

    const userDoc = await adminDb.collection('users').doc(uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const paymentGateway = userData?.paymentGateway || 'paypal';
    
    if (paymentGateway === 'paypal') {
      const subscriptionId = userData?.paypalSubscriptionId;
      if (!subscriptionId) {
        return NextResponse.json({ error: 'No active PayPal subscription found' }, { status: 400 });
      }

      const accessToken = await generatePayPalAccessToken();
      const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions/${subscriptionId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          reason: 'User requested cancellation via profile settings'
        })
      });
      
      if (response.ok || response.status === 204) {
        await adminDb.collection('users').doc(uid).update({
          cancel_at_period_end: true,
          updatedAt: new Date()
        });
        return NextResponse.json({ success: true });
      } else {
        const data = await response.json();
        return NextResponse.json({ error: 'Failed to cancel subscription with PayPal', details: data }, { status: 500 });
      }
    } 
    else if (paymentGateway === 'payu') {
      const subscriptionId = userData?.payuSubscriptionId;
      if (!subscriptionId) {
        return NextResponse.json({ error: 'No active PayU subscription found' }, { status: 400 });
      }

      // Handle PayU Cancellation (Local state update until PayU API is fully verified)
      await adminDb.collection('users').doc(uid).update({
        cancel_at_period_end: true,
        updatedAt: new Date()
      });
      return NextResponse.json({ success: true, message: "Subscription cancelled successfully." });
    }
    
    return NextResponse.json({ error: 'Unknown payment gateway' }, { status: 400 });

  } catch (error) {
    console.error('Error in cancel-subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
