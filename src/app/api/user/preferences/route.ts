import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const db = getAdminDb();
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ job_alerts: null, saved_jobs: [], lastLoginAt: null });
    }

    const data = userDoc.data();
    return NextResponse.json({
      job_alerts: data?.job_alerts || null,
      saved_jobs: data?.saved_jobs || [],
      lastLoginAt: data?.lastLoginAt || null
    });
  } catch (e) {
    console.error("Error fetching user preferences:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idToken = authHeader.split("Bearer ")[1];
    const decodedToken = await getAdminAuth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    const body = await request.json();
    const db = getAdminDb();

    // Support updating either job_alerts or saved_jobs or lastLoginAt
    const updateData: any = { updatedAt: new Date() };
    if (body.job_alerts !== undefined) {
      updateData.job_alerts = body.job_alerts;
    }
    if (body.saved_jobs !== undefined) {
      updateData.saved_jobs = body.saved_jobs;
    }
    if (body.lastLoginAt !== undefined) {
      updateData.lastLoginAt = body.lastLoginAt;
    }

    await db.collection("users").doc(uid).set(updateData, { merge: true });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("Error updating user preferences:", e);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
