import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password !== "admin123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const jobsPath = path.join(process.cwd(), "data", "jobs.json");
    if (!fs.existsSync(jobsPath)) {
      return NextResponse.json([]);
    }

    const raw = fs.readFileSync(jobsPath, "utf-8");
    const jobs = JSON.parse(raw);

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("Admin jobs API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
