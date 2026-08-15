import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import fs from "fs";
import path from "path";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== "admin123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only allow this to run locally
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Scraping is disabled in production." }, { status: 403 });
    }

    console.log("Starting scraper...");
    
    // Spawn the scraper script
    const { stdout, stderr } = await execAsync("npx tsx scraper/engine.ts");
    
    console.log(stdout);
    if (stderr) console.error(stderr);

    // Read the output to get the count
    const outputPath = path.join(process.cwd(), 'public', 'data', 'jobs.json');
    let total = 0;
    if (fs.existsSync(outputPath)) {
      const data = JSON.parse(fs.readFileSync(outputPath, 'utf-8'));
      total = data.length;
    }

    return NextResponse.json({ success: true, total });
  } catch (error: any) {
    console.error("Scraper failed:", error);
    return NextResponse.json({ error: error.message || "Failed to run scraper" }, { status: 500 });
  }
}
