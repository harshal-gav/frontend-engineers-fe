import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  try {
    // 1. Verify the LemonSqueezy webhook signature
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
    const hmac = crypto.createHmac("sha256", secret);
    
    // We must read the raw body to verify the signature
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
    const signatureBuffer = Buffer.from(signature, "utf8");

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse the payload
    const payload = JSON.parse(rawBody);
    const eventName = payload.meta.event_name;
    const customData = payload.meta.custom_data;
    const subscriptionId = payload.data.id;
    const attributes = payload.data.attributes;

    // We must have the Firebase UID passed in custom_data from the frontend
    const userId = customData?.user_id;
    
    if (!userId) {
      console.warn("Webhook received without user_id in custom_data");
      return NextResponse.json({ success: true }); // Acknowledge receipt to avoid retries
    }

    // 3. Handle the events
    const adminDb = getAdminDb();
    const subscriptionRef = adminDb
      .collection("users")
      .doc(userId)
      .collection("subscriptions")
      .doc(subscriptionId);

    if (eventName === "subscription_created" || eventName === "subscription_updated") {
      // Map LemonSqueezy status to the format our frontend expects ("active", "trialing", etc.)
      const status = attributes.status; // e.g., 'active', 'past_due', 'unpaid', 'cancelled', 'expired'
      
      await subscriptionRef.set({
        status: status,
        product_id: attributes.product_id,
        variant_id: attributes.variant_id,
        renews_at: attributes.renews_at,
        ends_at: attributes.ends_at,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      
    } else if (eventName === "subscription_cancelled" || eventName === "subscription_expired") {
      await subscriptionRef.set({
        status: "cancelled", // Our frontend checks for "active" or "trialing", so this revokes access
        ends_at: attributes.ends_at,
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
