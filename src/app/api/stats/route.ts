import { NextResponse } from "next/server";
import { getJobInventoryStats } from "@/lib/jobs.server";

export async function GET() {
  try {
    const stats = await getJobInventoryStats({ includeFirestore: true });

    return NextResponse.json(stats, {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { jobCount: 0, companyCount: 0, freshJobCount: 0, newTodayCount: 0 },
      { status: 500 }
    );
  }
}
