import { NextResponse } from "next/server";
import * as fs from "fs";
import * as path from "path";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await req.json();
    if (body.password !== "admin123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobId = decodeURIComponent(resolvedParams.id);
    const jobsPath = path.join(process.cwd(), "data", "jobs.json");

    if (!fs.existsSync(jobsPath)) {
      return NextResponse.json({ error: "Jobs file not found" }, { status: 404 });
    }

    const data = fs.readFileSync(jobsPath, "utf-8");
    let jobs = JSON.parse(data);
    const initialLength = jobs.length;

    // Filter out the job by id or sourceHash
    jobs = jobs.filter((j: any) => j.id !== jobId && j.sourceHash !== jobId);

    if (jobs.length === initialLength) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    fs.writeFileSync(jobsPath, JSON.stringify(jobs, null, 2));

    return NextResponse.json({ success: true, remaining: jobs.length });
  } catch (error: any) {
    console.error("Failed to delete job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete job" },
      { status: 500 }
    );
  }
}
