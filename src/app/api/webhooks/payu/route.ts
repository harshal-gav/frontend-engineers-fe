import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

const PAYU_MERCHANT_SALT = process.env.PAYU_MERCHANT_SALT;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const data: Record<string, string> = {};
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const { status, txnid, amount, productinfo, firstname, email, hash, mihpayid } = data;

    if (!PAYU_MERCHANT_SALT) {
      return NextResponse.json({ error: 'PayU credentials not configured' }, { status: 500 });
    }

    // Verify Hash (Reverse order for response: salt|status||||||udf5|udf4|udf3|udf2|udf1|email|firstname|productinfo|amount|txnid|key)
    const udf1 = data.udf1 || "";
    const udf2 = data.udf2 || "";
    const udf3 = data.udf3 || "";
    const udf4 = data.udf4 || "";
    const udf5 = data.udf5 || "";
    const key = data.key || "";

    const hashString = `${PAYU_MERCHANT_SALT}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
    const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

    if (hash !== expectedHash) {
      console.error('PayU Webhook: Invalid hash', { txnid, hash, expectedHash });
      return NextResponse.json({ error: 'Invalid Hash' }, { status: 400 });
    }

    const db = getAdminDb();
    
    // Find the original transaction
    const txnDoc = await db.collection('payu_transactions').doc(txnid).get();
    
    if (!txnDoc.exists) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    const uid = txnDoc.data()?.uid;

    if (status === 'success') {
      // Mark transaction as successful
      await txnDoc.ref.update({
        status: 'success',
        payuId: mihpayid,
        updatedAt: new Date()
      });

      // Update user subscription
      await db.collection('users').doc(uid).set({
        isSubscribed: true,
        payuSubscriptionId: mihpayid, // Using mihpayid as subscription reference
        paymentGateway: 'payu',
        updatedAt: new Date()
      }, { merge: true });

    } else {
      await txnDoc.ref.update({
        status: 'failed',
        updatedAt: new Date()
      });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing PayU webhook:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
