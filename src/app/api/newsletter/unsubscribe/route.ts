import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

async function handleUnsubscribe(email: string) {
  const normalized = email.trim().toLowerCase();
  const db = getAdminDb();

  // 1. Deactivate in newsletter_subscribers
  const subDoc = db.collection("newsletter_subscribers").doc(encodeURIComponent(normalized));
  await subDoc.set(
    {
      active: false,
      unsubscribedAt: new Date().toISOString(),
    },
    { merge: true }
  );

  // 2. Also deactivate in job_alerts if present
  const alertDoc = db.collection("job_alerts").doc(encodeURIComponent(normalized));
  await alertDoc.set(
    {
      active: false,
      unsubscribedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email || !EMAIL_REGEX.test(email)) {
      return new NextResponse(
        `<!DOCTYPE html><html><body style="font-family: sans-serif; text-align: center; padding: 40px;">
          <h2>Invalid Request</h2>
          <p>Please provide a valid email address to unsubscribe.</p>
          <a href="/" style="color: #2563eb;">Return to FrontendEngineers.com</a>
        </body></html>`,
        { headers: { "Content-Type": "text/html" }, status: 400 }
      );
    }

    try {
      await handleUnsubscribe(email);
    } catch (e) {
      console.warn("Unsubscribe DB update warning:", e);
    }

    return new NextResponse(
      `<!DOCTYPE html>
      <html>
        <head><title>Unsubscribed - FrontendEngineers.com</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; display: flex; align-items: center; justify-content: center; min-height: 80vh; margin: 0;">
          <div style="background: white; border: 1px solid #e5e7eb; border-radius: 16px; padding: 40px; max-width: 480px; text-align: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="font-size: 40px; margin-bottom: 16px;">✉️</div>
            <h1 style="font-size: 20px; font-weight: bold; color: #111827; margin: 0 0 8px 0;">You're Unsubscribed</h1>
            <p style="color: #4b5563; font-size: 14px; line-height: 1.5; margin: 0 0 24px 0;">
              <strong>${email}</strong> will no longer receive daily job alerts from FrontendEngineers.com.
            </p>
            <a href="/" style="display: inline-block; background: #2563eb; color: white; text-decoration: none; padding: 10px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
              Back to Job Board
            </a>
          </div>
        </body>
      </html>`,
      { headers: { "Content-Type": "text/html" }, status: 200 }
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return new NextResponse("Failed to process unsubscribe request", { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = body?.email;

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "Valid email address is required" }, { status: 400 });
    }

    try {
      await handleUnsubscribe(email);
    } catch (e) {
      console.warn("Unsubscribe DB update warning:", e);
    }

    return NextResponse.json({ success: true, message: "Successfully unsubscribed" });
  } catch (error) {
    console.error("Unsubscribe error:", error);
    return NextResponse.json({ error: "Failed to process unsubscribe" }, { status: 500 });
  }
}
