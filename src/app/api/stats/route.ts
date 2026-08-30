import { NextResponse } from "next/server";
import { loadJobsFromFile } from "@/lib/jobs.server";

export async function GET() {
  try {
    const jobs = loadJobsFromFile();

    const uniqueCompanies = new Set(
      jobs
        .map((j) => j.company?.name)
        .filter(Boolean)
    );

    return NextResponse.json(
      {
        jobCount: jobs.length,
        companyCount: uniqueCompanies.size,
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
      { jobCount: 0, companyCount: 0 },
      { status: 500 }
    );
  }
}
