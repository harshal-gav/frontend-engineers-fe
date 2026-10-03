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
        const data = doc.data();
        if (data.postedAt && data.postedAt.toDate) {
          data.postedAt = data.postedAt.toDate().toISOString();
        }
        firestoreJobs.push(data);
      });
      // Prepend Firestore jobs to the top of the list
      jobs = [...firestoreJobs, ...jobs];
    } catch (dbError) {
      console.error("Failed to fetch employer jobs from Firestore", dbError);
    }

    if (jobs.length === 0) {
      return NextResponse.json([]);
    }

    // Sort ALL jobs strictly by date (newest first) before processing
    jobs.sort((a, b) => {
      const timeA = a.postedAt ? new Date(a.postedAt).getTime() : 0;
      const timeB = b.postedAt ? new Date(b.postedAt).getTime() : 0;
      return timeB - timeA;
    });

    // Optimize bandwidth: Truncate descriptions for the listing API
    // We only need the first ~500 chars for client-side search and preview.
    // The full description is available on the individual static /jobs/[slug] page.
    const lightweightJobs = jobs.map((job) => {
      const optimized = { ...job };
      if (optimized.description && optimized.description.length > 500) {
        optimized.description = optimized.description.substring(0, 500) + "...";
      }
      return optimized;
    });

    // NEW BUSINESS MODEL:
    // - ALL users see ALL jobs with company name & logo visible.
    // - Premium users see full job details (description, location, apply links).
    // - Free users see job title + company name/logo only - everything else is locked.
    const responseHeaders = new Headers();
    // Vary by Authorization so the CDN knows to cache authenticated vs unauthenticated separately
    responseHeaders.set("Vary", "Authorization");

    if (!isPremium) {
      const lockedJobs = lightweightJobs.map((job) => ({
        id: job.id,
        title: job.title,
        slug: job.slug,
        postedAt: job.postedAt,
        remoteType: job.remoteType,
        isLocked: true,
        company: {
          id: job.company?.id || "",
          name: job.company?.name || "Company",
          logoUrl: job.company?.logoUrl || null,
          industry: job.company?.industry || null,
          website: null,
        },
        description: null,
        location: null,
        country: null,
        applyUrl: null,
        sourceHash: job.sourceHash,
      }));

      // Cache heavily at the Edge for non-authenticated (public) visitors to save Fast Origin Transfer & CPU
      if (!authHeader) {
        responseHeaders.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");
      } else {
        responseHeaders.set("Cache-Control", "private, max-age=60");
      }
      return NextResponse.json(lockedJobs, { headers: responseHeaders });
    }

    responseHeaders.set("Cache-Control", "private, max-age=60");
    return NextResponse.json(lightweightJobs, { headers: responseHeaders });

  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
