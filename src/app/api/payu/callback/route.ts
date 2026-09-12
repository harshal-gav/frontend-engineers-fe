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

    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    if (status === 'success') {
      // Verify Hash (Reverse order for response)
      const udf1 = data.udf1 || "";
      const udf2 = data.udf2 || "";
      const udf3 = data.udf3 || "";
      const udf4 = data.udf4 || "";
      const udf5 = data.udf5 || "";
      const key = data.key || "";

      const hashString = `${PAYU_MERCHANT_SALT}|${status}||||||${udf5}|${udf4}|${udf3}|${udf2}|${udf1}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
      const expectedHash = crypto.createHash('sha512').update(hashString).digest('hex');

      if (hash === expectedHash) {
        // Hash matches, secure to upgrade user!
        const db = getAdminDb();
        const txnDoc = await db.collection('payu_transactions').doc(txnid).get();
        
        if (txnDoc.exists) {
          const uid = txnDoc.data()?.uid;
          
          // Mark transaction as successful
          await txnDoc.ref.update({
            status: 'success',
            payuId: mihpayid,
            updatedAt: new Date()
          });

          const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
          
          const isEmployer = productinfo === "Employer Unlimited Jobs";

          // Upgrade user to Pro (and Employer if applicable)
          await db.collection('users').doc(uid).set({
            isPremium: true,
            isSubscribed: true,
            isEmployer: isEmployer,
            ...(isEmployer && { role: 'employer' }),
            payuSubscriptionId: mihpayid,
            paymentGateway: 'payu',
            subscriptionExpiresAt: expiresAt,
            updatedAt: new Date()
          }, { merge: true });
        }
      } else {
        console.warn("PayU Callback Hash Mismatch!", { txnid, hash, expectedHash });
      }

      return NextResponse.redirect(`${baseUrl}/pricing/success?gateway=payu`, 303);
    } else {
      return NextResponse.redirect(`${baseUrl}/pricing?error=payu_failed`, 303);
    }

  } catch (error) {
    console.error('Error processing PayU callback:', error);
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
    return NextResponse.redirect(`${baseUrl}/pricing?error=internal_error`, 303);
  }
}
