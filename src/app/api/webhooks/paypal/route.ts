import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const rawBody = await req.text();
    const payload = JSON.parse(rawBody);

    const eventName = payload.event_type;
    const resource = payload.resource;
    
    // In PayPal, the custom field is passed inside the subscriber or custom_id field
    const userId = resource.custom_id || (resource.subscriber && resource.subscriber.custom_id);
    const subscriptionId = resource.id;

    console.log(`[PayPal Webhook] 📩 Event: ${eventName} | Sub: ${subscriptionId} | User: ${userId || "UNKNOWN"}`);

    if (!userId) {
      console.warn("[PayPal Webhook] ⚠️ No custom_id (user_id) found — acknowledging to prevent retries");
      return NextResponse.json({ success: true });
    }

    const adminDb = getAdminDb();
    const userRef = adminDb.collection("users").doc(userId);
    const subscriptionRef = userRef.collection("subscriptions").doc(subscriptionId);

    switch (eventName) {
      case "BILLING.SUBSCRIPTION.ACTIVATED":
      case "BILLING.SUBSCRIPTION.RENEWED": {
        // PayPal sends the next billing date
        const nextBillingTime = resource.billing_info?.next_billing_time;
        // Fallback to 30 days from now if not present
        const expiresAt = nextBillingTime 
          ? new Date(nextBillingTime).toISOString() 
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        await userRef.set({
          isPremium: true,
          subscriptionExpiresAt: expiresAt,
          paypalSubscriptionId: subscriptionId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        await subscriptionRef.set({
          status: resource.status,
          plan_id: resource.plan_id,
          created_time: resource.create_time,
          next_billing_time: nextBillingTime,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`[PayPal Webhook] ✅ ${eventName} — User ${userId} is now premium (expires: ${expiresAt})`);
        break;
      }

      case "BILLING.SUBSCRIPTION.CANCELLED":
      case "BILLING.SUBSCRIPTION.SUSPENDED":
      case "BILLING.SUBSCRIPTION.EXPIRED": {
        // Check if there is still time left in the current billing cycle
        const nextBillingTime = resource.billing_info?.next_billing_time;
        const stillActive = nextBillingTime && new Date(nextBillingTime) > new Date();

        await userRef.set({
          isPremium: stillActive ? true : false,
          subscriptionExpiresAt: nextBillingTime || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        await subscriptionRef.set({
          status: resource.status,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`[PayPal Webhook] ⚠️ ${eventName} — User ${userId} (access until: ${nextBillingTime || "immediately revoked"})`);
        break;
      }

      default:
        console.log(`[PayPal Webhook] ℹ️ Unhandled event: ${eventName} — acknowledging`);
    }

    const duration = Date.now() - startTime;
    console.log(`[PayPal Webhook] ⏱️ Processed ${eventName} in ${duration}ms`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[PayPal Webhook] 💥 Processing error: ${message}`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
