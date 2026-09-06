import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { maskJobForTeaser } from "@/lib/jobs";
import { loadJobsFromFile, isTopTierJob } from "@/lib/jobs.server";

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
    const jobs = loadJobsFromFile();

    if (jobs.length === 0) {
      return NextResponse.json([]);
    }

    // MASKING: non-premium users get ALL jobs, but every single job has its applyUrl removed.
    if (!isPremium) {
      const maskedJobs = jobs.map((job) => {
        if (job.isFree) return job;
        return maskJobForTeaser(job);
      });
      return NextResponse.json(maskedJobs);
    }

    return NextResponse.json(jobs);

  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
