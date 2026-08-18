import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    const formData = await req.formData();
    
    // Convert FormData to a standard object for easier logging/handling
    const payload: Record<string, any> = {};
    formData.forEach((value, key) => {
      payload[key] = value;
    });

    const resourceName = payload.resource_name;
    const email = payload.email;
    const subscriptionId = payload.subscription_id;

    console.log(`[Gumroad Webhook] 📩 Event: ${resourceName} | Sub: ${subscriptionId} | Email: ${email || "UNKNOWN"}`);

    if (!email) {
      console.warn("[Gumroad Webhook] ⚠️ No email found in payload — acknowledging to prevent retries");
      return NextResponse.json({ success: true });
    }

    const adminDb = getAdminDb();
    
    // Find the user by email
    const usersSnapshot = await adminDb.collection("users").where("email", "==", email).limit(1).get();
    
    if (usersSnapshot.empty) {
      console.warn(`[Gumroad Webhook] ⚠️ User with email ${email} not found in Firebase. Acknowledging.`);
      return NextResponse.json({ success: true });
    }

    const userDoc = usersSnapshot.docs[0];
    const userId = userDoc.id;
    const userRef = adminDb.collection("users").doc(userId);
    const subscriptionRef = userRef.collection("subscriptions").doc(subscriptionId || `gumroad_${Date.now()}`);

    switch (resourceName) {
      case "sale": {
        // Gumroad 'sale' event triggers on initial purchase and renewals
        // Give 35 days of access (1 month + grace period)
        const expiresAt = new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString();

        await userRef.set({
          isPremium: true,
          subscriptionExpiresAt: expiresAt,
          gumroadSubscriptionId: subscriptionId || null,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        await subscriptionRef.set({
          status: "active",
          email: email,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          raw_payload: payload,
        }, { merge: true });

        console.log(`[Gumroad Webhook] ✅ ${resourceName} — User ${userId} is now premium (expires: ${expiresAt})`);
        break;
      }

      case "cancellation":
      case "subscription_cancelled":
      case "subscription_ended": {
        // For cancellations, we don't immediately revoke access unless explicitly told to.
        // The user keeps access until their current period expires.
        await subscriptionRef.set({
          status: "cancelled",
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });

        console.log(`[Gumroad Webhook] ⚠️ ${resourceName} — User ${userId} cancelled their subscription.`);
        break;
      }

      default:
        console.log(`[Gumroad Webhook] ℹ️ Unhandled event: ${resourceName} — acknowledging`);
    }

    const duration = Date.now() - startTime;
    console.log(`[Gumroad Webhook] ⏱️ Processed ${resourceName} in ${duration}ms`);

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error(`[Gumroad Webhook] 💥 Processing error: ${message}`, error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
