import { NextResponse } from 'next/server';

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
    const { custom_id, plan_id } = await req.json();
    
    if (!custom_id || !plan_id) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }
    
    const accessToken = await generateAccessToken();
    
    const response = await fetch(`${PAYPAL_API_URL}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        plan_id: plan_id,
        custom_id: custom_id,
        application_context: {
          shipping_preference: 'NO_SHIPPING',
          user_action: 'SUBSCRIBE_NOW',
        }
      })
    });
    
    const data = await response.json();
    
    if (data.id) {
      return NextResponse.json({ id: data.id });
    } else {
      console.error('[PayPal API Error]', data);
      return NextResponse.json({ error: 'Failed to create subscription', details: data }, { status: 500 });
    }
  } catch (error) {
    console.error('Error in create-subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
