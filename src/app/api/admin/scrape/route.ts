import { NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(req: Request) {
  try {
    const { password, mode = "api-only" } = await req.json();

    if (password !== "admin123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Scraping is disabled in production to prevent timeouts." }, { status: 403 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', message: `Starting scraper process in ${mode} mode...` })}\n\n`));

        // Determine args
        const args = ["tsx", "scraper/run-all.ts"];
        if (mode === "api-only") args.push("--api-only");
        if (mode === "dry-run") args.push("--dry-run");

        // Spawn the scraper process (force colors so we get ANSI codes in stdout)
        const child = spawn("npx", args, {
          cwd: process.cwd(),
          env: { ...process.env, FORCE_COLOR: "1" },
        });

        child.stdout.on("data", (data) => {
          // Send raw data chunk with ANSI codes directly to the client
          const text = data.toString();
          // We can split by newline, but ANSI codes might span across chunks.
          // For simplicity in SSE, sending the whole chunk is often better.
          const lines = text.split('\n');
          for (const line of lines) {
            // Include empty lines as they are important for formatting
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', message: line })}\n\n`));
          }
        });

        child.stderr.on("data", (data) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: line })}\n\n`));
            }
          }
        });

        child.on("close", (code) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', message: '\nScraper process finished. Reloading jobs...' })}\n\n`));
          controller.close();
        });

        child.on("error", (error) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: `Spawn error: ${error.message}` })}\n\n`));
          controller.close();
        });
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error: any) {
    console.error("Scraper failed:", error);
    return NextResponse.json({ error: error.message || "Failed to run scraper" }, { status: 500 });
  }
}
