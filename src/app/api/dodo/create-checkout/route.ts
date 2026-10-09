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
    const name = decodedToken.email?.split('@')[0] || "User";
    const uid = decodedToken.uid;

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    
    const session = await client.checkoutSessions.create({
      product_cart: [
        {
          product_id: process.env.DODO_PAYMENTS_PRODUCT_ID as string,
          quantity: 1,
        },
      ],
      customer: {
        email: email,
        name: name,
      },
      metadata: {
        uid: uid,
      },
      return_url: `${baseUrl}/pricing/success?gateway=dodo`,
      cancel_url: `${baseUrl}/pricing`,
    });

    return NextResponse.json({ checkout_url: session.checkout_url });

  } catch (error: any) {
    console.error('Error creating Dodo checkout session:', error);
    return NextResponse.json({ error: error?.message || 'Internal Server Error', details: error }, { status: 500 });
  }
}
