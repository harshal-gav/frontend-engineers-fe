import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { jobId, jobTitle, companyName, reason, details } = body;

    if (!jobId || !reason) {
      return NextResponse.json(
        { error: "jobId and reason are required" },
        { status: 400 }
      );
    }

    try {
      const db = getAdminDb();
      await db.collection("job_reports").add({
        jobId: String(jobId),
        jobTitle: jobTitle || "",
        companyName: companyName || "",
        reason: String(reason),
        details: details || "",
        createdAt: new Date().toISOString(),
        status: "pending",
      });
    } catch (dbError) {
      console.warn("Could not write report to Firestore, logging instead:", dbError);
    }

    return NextResponse.json({
      success: true,
      message: "Report received. Thank you for keeping our job board accurate!",
    });
  } catch (error) {
    console.error("Job report error:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
