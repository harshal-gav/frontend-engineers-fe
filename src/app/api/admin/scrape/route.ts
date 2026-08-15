import { NextResponse } from "next/server";
import { spawn } from "child_process";

export async function POST(req: Request) {
  try {
    const { password } = await req.json();

    if (password !== "admin123") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (process.env.NODE_ENV === "production") {
      return NextResponse.json({ error: "Scraping is disabled in production." }, { status: 403 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', message: 'Starting scraper process...' })}\n\n`));

        // Spawn the scraper process
        const child = spawn("npx", ["tsx", "scraper/engine.ts"], {
          cwd: process.cwd(),
          env: process.env,
        });

        child.stdout.on("data", (data) => {
          const lines = data.toString().split('\n');
          for (const line of lines) {
            if (line.trim()) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', message: line })}\n\n`));
            }
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
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', message: 'Scraper process finished.' })}\n\n`));
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
