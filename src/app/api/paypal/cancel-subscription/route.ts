import { NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const PAYPAL_API_URL = process.env.PAYPAL_MODE === 'live' 
  ? 'https://api-m.paypal.com' 
  : 'https://api-m.sandbox.paypal.com';

async function generateAccessToken() {
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
    const subscriptionId = userData?.paypalSubscriptionId;

    if (!subscriptionId) {
      return NextResponse.json({ error: 'No active subscription found' }, { status: 400 });
    }

    const accessToken = await generateAccessToken();
    
    // Call PayPal API to cancel the subscription
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
      // Successfully cancelled in PayPal. 
      // Update our database so they are no longer marked as active after this billing cycle.
      // We rely on the webhooks to actually revoke access at the end of the period, but we can set cancel_at_period_end here.
      await adminDb.collection('users').doc(uid).update({
        cancel_at_period_end: true,
        updatedAt: new Date()
      });

      return NextResponse.json({ success: true });
    } else {
      const data = await response.json();
      console.error('[PayPal Cancel API Error]', data);
      return NextResponse.json({ error: 'Failed to cancel subscription with PayPal', details: data }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in cancel-subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
