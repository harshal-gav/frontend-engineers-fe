import { NextResponse } from 'next/server';
import crypto from 'crypto';

// Initialize firebase admin getter for dynamic usage if needed
import { getAdminAuth, getAdminDb } from '@/lib/firebase-admin';

const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY;
const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;
const PAYU_ENV = process.env.PAYU_ENV || 'test'; // 'test' or 'live'

const PAYU_BASE_URL = PAYU_ENV === 'live' 
  ? 'https://secure.payu.in/_payment' 
  : 'https://test.payu.in/_payment';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const token = authHeader.split('Bearer ')[1];
    const auth = getAdminAuth();
    const db = getAdminDb();
    const decodedToken = await auth.verifyIdToken(token);
    const uid = decodedToken.uid;

    if (!PAYU_MERCHANT_KEY || !PAYU_MERCHANT_SALT) {
      return NextResponse.json({ error: 'PayU credentials not configured' }, { status: 500 });
    }

    // Generate unique transaction ID
    const txnid = `txn_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Fetch live USD to INR exchange rate
    let inrRate = 83.50; // Fallback rate
    try {
      const rateRes = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 3600 } }); // Cache for 1 hour
      if (rateRes.ok) {
        const rateData = await rateRes.json();
        if (rateData.rates && rateData.rates.INR) {
          inrRate = rateData.rates.INR;
        }
      }
    } catch (e) {
      console.warn("Failed to fetch live exchange rate, using fallback.", e);
    }

    // Calculate exact INR amount equivalent to $9 USD
    const exactInrAmount = 9 * inrRate;
    const amount = exactInrAmount.toFixed(2);
    
    const productinfo = "Pro Membership";
    const firstname = decodedToken.email?.split('@')[0] || "User";
    const email = decodedToken.email || "";
    const phone = "9999999999"; // Placeholder, PayU often requires a phone number

    // Return URLs (Point to backend API so we can handle PayU's POST request and redirect gracefully)
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    const surl = `${baseUrl}/api/payu/callback`;
    const furl = `${baseUrl}/api/payu/callback`;

    // Subscription (SI) details
    const si = "1";
    // For a monthly subscription dynamically priced in INR
    const si_details = JSON.stringify({
      billingAmount: amount,
      billingCurrency: "INR",
      billingCycle: "MONTHLY",
      billingInterval: "1",
      paymentStartDate: new Date().toISOString().split('T')[0],
      paymentEndDate: "2099-12-31" // Or calculate 10 years from now
    });

    // Save transaction intent in Firestore
    await db.collection('payu_transactions').doc(txnid).set({
      uid,
      status: 'pending',
      amount,
      createdAt: new Date(),
    });

    // Generate Hash
    // Standard sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT
    const hashString = `${PAYU_MERCHANT_KEY}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${PAYU_MERCHANT_SALT}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    return NextResponse.json({
      action: PAYU_BASE_URL,
      params: {
        key: PAYU_MERCHANT_KEY,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        phone,
        surl,
        furl,
        hash,
        si,
        si_details
      }
    });

  } catch (error) {
    console.error('Error creating PayU subscription:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
