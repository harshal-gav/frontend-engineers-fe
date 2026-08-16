import { NextResponse } from "next/server";
import crypto from "crypto";
import { getAdminDb } from "@/lib/firebase-admin";
import * as admin from "firebase-admin";

// ─── Helpers ─────────────────────────────────────────────

/**
 * Verify the HMAC-SHA256 signature sent by LemonSqueezy.
 * Returns true if the signature matches the expected digest.
 *
 * Uses timing-safe comparison to prevent timing attacks.
 * Handles the edge case where buffer lengths differ (timingSafeEqual
 * throws on length mismatch instead of returning false).
 */
function verifySignature(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "utf8");
  const signatureBuffer = Buffer.from(signature, "utf8");

  // timingSafeEqual throws if lengths differ — catch that case explicitly
  if (digest.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(digest, signatureBuffer);
}

/**
 * Compute the subscription expiry date.
 *
 * For active/renewed subscriptions we use `renews_at`.
 * For cancelled subscriptions we use `ends_at` (the end of the billing period).
 * Falls back to 30 days from now if neither is present.
 */
function computeExpiresAt(attributes: Record<string, any>): string {
  if (attributes.ends_at) return attributes.ends_at;
  if (attributes.renews_at) return attributes.renews_at;
  // Fallback: 30 days from now
  return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
}

// ─── Webhook Handler ─────────────────────────────────────

export async function POST(req: Request) {
  const startTime = Date.now();

  try {
    // 1. Verify the LemonSqueezy webhook signature
    const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "";
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";

    if (!verifySignature(rawBody, signature, secret)) {
      console.error("[LemonSqueezy Webhook] ❌ Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // 2. Parse the payload
    const payload = JSON.parse(rawBody);
    const eventName: string = payload.meta?.event_name;
    const customData = payload.meta?.custom_data;
    const subscriptionId: string = String(payload.data?.id);
    const attributes = payload.data?.attributes || {};

    // We must have the Firebase UID passed in custom_data from the checkout URL
    const userId: string | undefined = customData?.user_id;

    console.log(
      `[LemonSqueezy Webhook] 📩 Event: ${eventName} | Sub: ${subscriptionId} | User: ${userId || "UNKNOWN"}`
    );

    if (!userId) {
      console.warn(
        "[LemonSqueezy Webhook] ⚠️ No user_id in custom_data — acknowledging to prevent retries"
      );
      return NextResponse.json({ success: true });
    }

    // 3. Handle subscription lifecycle events
    const adminDb = getAdminDb();
    const userRef = adminDb.collection("users").doc(userId);
    const subscriptionRef = userRef
      .collection("subscriptions")
      .doc(subscriptionId);

    switch (eventName) {
      // ── Subscription Created ────────────────────────
      case "subscription_created": {
        const expiresAt = computeExpiresAt(attributes);

        // Top-level user doc: fast reads for premium gating
        await userRef.set(
          {
            isPremium: true,
            subscriptionExpiresAt: expiresAt,
            lemonSqueezyCustomerId:
              String(attributes.customer_id) || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // Subcollection: audit trail
        await subscriptionRef.set(
          {
            status: attributes.status, // "active", "on_trial", etc.
            product_id: attributes.product_id,
            variant_id: attributes.variant_id,
            renews_at: attributes.renews_at,
            ends_at: attributes.ends_at,
            created_at: attributes.created_at,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(
          `[LemonSqueezy Webhook] ✅ subscription_created — User ${userId} is now premium (expires: ${expiresAt})`
        );
        break;
      }

      // ── Payment Success (renewal) ──────────────────
      case "subscription_payment_success": {
        const expiresAt = computeExpiresAt(attributes);

        await userRef.set(
          {
            isPremium: true,
            subscriptionExpiresAt: expiresAt,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        // Update audit trail with latest renewal info
        // subscription_payment_success may not have a subscription doc ID in the same format,
        // so we use the subscription_id from attributes if available
        const subIdForPayment = attributes.subscription_id
          ? String(attributes.subscription_id)
          : subscriptionId;

        await userRef
          .collection("subscriptions")
          .doc(subIdForPayment)
          .set(
            {
              status: "active",
              renews_at: attributes.renews_at || null,
              ends_at: attributes.ends_at || null,
              last_payment_at:
                admin.firestore.FieldValue.serverTimestamp(),
              updated_at: admin.firestore.FieldValue.serverTimestamp(),
            },
            { merge: true }
          );

        console.log(
          `[LemonSqueezy Webhook] ✅ subscription_payment_success — User ${userId} renewed (expires: ${expiresAt})`
        );
        break;
      }

      // ── Subscription Cancelled ─────────────────────
      // User cancelled but may still have access until end of billing period
      case "subscription_cancelled": {
        const endsAt = attributes.ends_at;

        // Keep premium active if there's remaining time on the billing period
        const stillActive = endsAt && new Date(endsAt) > new Date();

        await userRef.set(
          {
            isPremium: stillActive ? true : false,
            subscriptionExpiresAt: endsAt || null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        await subscriptionRef.set(
          {
            status: "cancelled",
            ends_at: endsAt,
            cancelled_at:
              attributes.cancelled_at ||
              new Date().toISOString(),
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(
          `[LemonSqueezy Webhook] ⚠️ subscription_cancelled — User ${userId} (access until: ${endsAt || "immediately revoked"})`
        );
        break;
      }

      // ── Subscription Expired ───────────────────────
      // Billing period has ended — fully revoke access
      case "subscription_expired": {
        await userRef.set(
          {
            isPremium: false,
            subscriptionExpiresAt: null,
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        await subscriptionRef.set(
          {
            status: "expired",
            ends_at: attributes.ends_at,
            updated_at: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );

        console.log(
          `[LemonSqueezy Webhook] 🔒 subscription_expired — User ${userId} access revoked`
        );
        break;
      }

      default:
        console.log(
          `[LemonSqueezy Webhook] ℹ️ Unhandled event: ${eventName} — acknowledging`
        );
    }

    const duration = Date.now() - startTime;
    console.log(
      `[LemonSqueezy Webhook] ⏱️ Processed ${eventName} in ${duration}ms`
    );

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error(
      `[LemonSqueezy Webhook] 💥 Processing error: ${message}`,
      error
    );
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 500 }
    );
  }
}
