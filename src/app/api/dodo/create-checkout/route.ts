import { NextResponse } from 'next/server';
import DodoPayments from 'dodopayments';
import { getAdminAuth } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const client = new DodoPayments({
      bearerToken: process.env.DODO_PAYMENTS_API_KEY,
      environment: 'live_mode',
    });

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    const decodedToken = await auth.verifyIdToken(token);

    const email = decodedToken.email || "";
    const name = decodedToken.name || decodedToken.email?.split('@')[0] || "User";
    const uid = decodedToken.uid;

    let reqBody: { type?: string } = {};
    try {
      reqBody = await req.json();
    } catch {
      // ignore empty body
    }

    const isEmployer = reqBody.type === 'employer';
    const productId = isEmployer 
      ? (process.env.DODO_PAYMENTS_EMPLOYER_PRODUCT_ID || process.env.DODO_PAYMENTS_PRODUCT_ID) 
      : process.env.DODO_PAYMENTS_PRODUCT_ID;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: productId as string,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
        name: name,
      },
      metadata: {
        uid: uid,
        type: isEmployer ? 'employer' : 'user'
      },
      feature_flags: {
        allow_customer_editing_name: false,
        allow_customer_editing_email: false,
        allow_phone_number_collection: false,
      },
      minimal_address: true,
      return_url: `${baseUrl}/`,
      cancel_url: `${baseUrl}/${isEmployer ? 'employers/pricing' : 'pricing'}`,
    });

    return NextResponse.json({ checkout_url: session.checkout_url });

  } catch (error: unknown) {
    console.error('Error creating Dodo checkout session:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
