import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { loadJobsFromFile } from "@/lib/jobs.server";

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    let isPremium = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
        
        // Check Firestore for premium status on the top-level user doc
        const db = getAdminDb();
        const userDoc = await db.collection("users").doc(uid).get();

        if (userDoc.exists) {
          const data = userDoc.data();
          if (data?.isPremium === true) {
            const expiresAt = data.subscriptionExpiresAt;
            if (expiresAt) {
              isPremium = new Date(expiresAt) > new Date();
            } else {
              isPremium = true;
            }
          }
        }
      } catch (e) {
        console.error("Invalid token:", e);
      }
    }

    // Use shared utility to load, filter, and enrich jobs
    let jobs = loadJobsFromFile();

    // Fetch employer-posted jobs from Firestore
    try {
      const db = getAdminDb();
      const firestoreJobsSnapshot = await db.collection("jobs").orderBy("postedAt", "desc").get();
      const firestoreJobs: any[] = [];
      firestoreJobsSnapshot.forEach(doc => {
        firestoreJobs.push(doc.data());
      });
      // Prepend Firestore jobs to the top of the list
      jobs = [...firestoreJobs, ...jobs];
    } catch (dbError) {
      console.error("Failed to fetch employer jobs from Firestore", dbError);
    }

    if (jobs.length === 0) {
      return NextResponse.json([]);
    }

    // EARLY ACCESS MODEL:
    // - Premium users see ALL jobs (including fresh ones posted within the last 7 days).
    // - Free users only see jobs older than 7 days. All jobs are fully visible (no masking).
    if (!isPremium) {
      const publicJobs = jobs.filter((job) => !job.isEarlyAccess);
      return NextResponse.json(publicJobs);
    }

    return NextResponse.json(jobs);

  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
