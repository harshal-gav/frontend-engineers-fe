import { NextResponse } from "next/server";
import { loadJobsFromFile } from "@/lib/jobs.server";

export async function GET() {
  try {
    const allJobs = loadJobsFromFile();

    // Active jobs exclude dead listings
    const activeJobs = allJobs.filter((j) => !j.isDead);

    const uniqueCompanies = new Set(
      activeJobs
        .map((j) => j.company?.name)
        .filter(Boolean)
    );

    // Jobs posted in last 7 days
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const freshJobs = activeJobs.filter(
      (j) => j.postedAt && new Date(j.postedAt).getTime() > sevenDaysAgo
    );

    // Jobs posted in last 24 hours
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const newToday = activeJobs.filter(
      (j) => j.postedAt && new Date(j.postedAt).getTime() > oneDayAgo
    );

    return NextResponse.json(
      {
        jobCount: activeJobs.length,
        companyCount: uniqueCompanies.size,
        freshJobCount: freshJobs.length,
        newTodayCount: newToday.length,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Stats API error:", error);
    return NextResponse.json(
      { jobCount: 0, companyCount: 0, freshJobCount: 0, newTodayCount: 0 },
      { status: 500 }
    );
  }
}
