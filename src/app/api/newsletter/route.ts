import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, source = "footer" } = body;

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return NextResponse.json(
        { error: "Valid email address is required" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
      const db = getAdminDb();
      const subscriberRef = db.collection("newsletter_subscribers").doc(encodeURIComponent(normalizedEmail));
      await subscriberRef.set(
        {
          email: normalizedEmail,
          source,
          createdAt: new Date().toISOString(),
          active: true,
        },
        { merge: true }
      );
    } catch (dbError) {
      console.warn("Could not save subscriber to Firestore, logging:", dbError);
    }

    return NextResponse.json({
      success: true,
      message: "You're subscribed! You'll receive remote frontend job alerts.",
    });
  } catch (error) {
    console.error("Newsletter error:", error);
    return NextResponse.json(
      { error: "Failed to subscribe" },
      { status: 500 }
    );
  }
}
