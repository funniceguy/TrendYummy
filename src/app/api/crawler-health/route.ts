import { NextResponse } from "next/server";
import { runCrawlerHealthChecks } from "@/lib/jules-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

export async function GET(request: Request): Promise<NextResponse> {
  try {
    const snapshot = await runCrawlerHealthChecks(request);
    return NextResponse.json(snapshot);
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to run crawler health checks",
        message: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
