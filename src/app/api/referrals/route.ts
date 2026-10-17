import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      companyName,
      roleTitle,
      referralLink,
      posterName,
      posterEmail,
      description,
      techStack,
    } = body;

    // Validate required fields
    if (!companyName || !roleTitle || !referralLink || !posterName || !posterEmail) {
      return NextResponse.json(
        { error: "Missing required fields: companyName, roleTitle, referralLink, posterName, posterEmail" },
        { status: 400 }
      );
    }

    // Basic email validation
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(posterEmail)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(referralLink);
    } catch {
      return NextResponse.json(
        { error: "Invalid referral link URL" },
        { status: 400 }
      );
    }

    // Sanitize tech stack - accept comma-separated string or array
    let techStackArray: string[] = [];
    if (techStack) {
      if (Array.isArray(techStack)) {
        techStackArray = techStack
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
          .slice(0, 10);
      } else if (typeof techStack === "string") {
        techStackArray = techStack
          .split(",")
          .map((t: string) => t.trim())
          .filter((t: string) => t.length > 0)
          .slice(0, 10);
      }
    }

    const db = getAdminDb();
    const referralData = {
      companyName: companyName.trim().slice(0, 100),
      roleTitle: roleTitle.trim().slice(0, 150),
      referralLink: referralLink.trim(),
      posterName: posterName.trim().slice(0, 100),
      posterEmail: posterEmail.trim().toLowerCase(),
      description: (description || "").trim().slice(0, 1000),
      techStack: techStackArray,
      createdAt: new Date().toISOString(),
      status: "active", // For future moderation
    };

    const docRef = await db.collection("referrals").add(referralData);

    return NextResponse.json(
      { id: docRef.id, message: "Referral posted successfully!" },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating referral:", error);
    return NextResponse.json(
      { error: "Failed to post referral. Please try again." },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    let isPremium = false;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const idToken = authHeader.split("Bearer ")[1];
      try {
        const decodedToken = await getAdminAuth().verifyIdToken(idToken);
        const uid = decodedToken.uid;
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
        console.error("Invalid token in referrals GET:", e);
      }
    }

    const db = getAdminDb();
    let snapshot;
    try {
      snapshot = await db
        .collection("referrals")
        .orderBy("createdAt", "desc")
        .limit(100)
        .get();
    } catch (orderError) {
      console.warn("orderBy createdAt failed, falling back to unordered get:", orderError);
      snapshot = await db.collection("referrals").limit(100).get();
    }

    const isLocked = !isPremium;

    const referrals = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        let createdAt = data.createdAt;
        if (createdAt && typeof createdAt.toDate === "function") {
          createdAt = createdAt.toDate().toISOString();
        }

        return {
          id: doc.id,
          companyName: data.companyName,
          roleTitle: data.roleTitle,
          description: data.description || "",
          techStack: Array.isArray(data.techStack) ? data.techStack : [],
          posterName: isLocked ? "Pro Member" : (data.posterName || "Anonymous"),
          posterEmail: isLocked ? null : (data.posterEmail || null),
          referralLink: isLocked ? null : (data.referralLink || null),
          createdAt: createdAt || new Date().toISOString(),
          status: data.status,
          isLocked,
        };
      })
      .filter((ref: any) => ref.status !== "inactive" && ref.status !== "archived");

    // In case fallback was used, ensure ordered by createdAt desc
    referrals.sort((a: any, b: any) => {
      const timeA = new Date(a.createdAt).getTime() || 0;
      const timeB = new Date(b.createdAt).getTime() || 0;
      return timeB - timeA;
    });

    const responseHeaders = new Headers();
    responseHeaders.set("Vary", "Authorization");

    return NextResponse.json(referrals, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Error fetching referrals:", error);
    return NextResponse.json(
      { error: "Failed to fetch referrals" },
      { status: 500 }
    );
  }
}


