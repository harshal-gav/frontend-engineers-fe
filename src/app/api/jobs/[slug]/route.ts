import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { loadJobsFromFile } from "@/lib/jobs.server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
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

    const jobs = loadJobsFromFile();
    let job = jobs.find((j) => j.slug === slug || j.id === slug);

    if (!job) {
      try {
        const db = getAdminDb();
        const doc = await db.collection("jobs").doc(slug).get();
        if (doc.exists) {
          job = doc.data() as any;
        }
      } catch (e) {
        // Ignore firestore lookup errors
      }
    }

    if (!job) {
      return NextResponse.json({ error: "Not Found" }, { status: 404 });
    }

    // Free users are not allowed to fetch this endpoint for full details
    if (!isPremium) {
      return NextResponse.json({ error: "Forbidden. Pro subscription required." }, { status: 403 });
    }

    // If premium, return the full job object (with salary and applyUrl intact)
    return NextResponse.json(job);
  } catch (error) {
    console.error("Jobs API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
