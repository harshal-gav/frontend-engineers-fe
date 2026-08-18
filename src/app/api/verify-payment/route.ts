import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      user_id,
    } = body;

    // Validate required fields
    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json(
        { error: "Missing required payment fields" },
        { status: 400 }
      );
    }

    if (!user_id) {
      return NextResponse.json(
        { error: "Missing user_id" },
        { status: 400 }
      );
    }

    // Verify signature: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      console.error("[Razorpay] ❌ Signature verification failed");
      return NextResponse.json(
        { error: "Payment verification failed — signature mismatch" },
        { status: 400 }
      );
    }

    // Signature verified — activate premium for the user
    console.log(
      `[Razorpay] ✅ Payment verified | Order: ${razorpay_order_id} | Payment: ${razorpay_payment_id} | User: ${user_id}`
    );

    const adminDb = getAdminDb();
    const userRef = adminDb.collection("users").doc(user_id);

    // Set premium: 30 days from now
    const expiresAt = new Date(
      Date.now() + 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Update user doc for fast premium gating
    await userRef.set(
      {
        isPremium: true,
        subscriptionExpiresAt: expiresAt,
        razorpayCustomerId: razorpay_payment_id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // Audit trail in subcollection
    await userRef
      .collection("payments")
      .doc(razorpay_payment_id)
      .set({
        order_id: razorpay_order_id,
        payment_id: razorpay_payment_id,
        status: "captured",
        amount: null, // Will be filled by webhook if configured
        created_at: admin.firestore.FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      message: "Payment verified and premium activated",
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[Razorpay] 💥 Verification error:", message);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}
