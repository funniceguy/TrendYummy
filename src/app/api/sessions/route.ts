import { NextRequest, NextResponse } from "next/server";
import { julesApi } from "@/lib/api/jules-client";

/**
 * GET /api/sessions - List all Jules sessions
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pageSize = Number(searchParams.get("pageSize") || "30");
    const pageToken = searchParams.get("pageToken") || undefined;

    const result = await julesApi.listSessions({
      pageSize,
      pageToken,
    });

    return NextResponse.json({
      sessions: result.sessions,
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    console.error("Failed to list sessions:", error);
    return NextResponse.json(
      { error: "Failed to list sessions", message: String(error) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sessions - Create a new Jules session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const session = await julesApi.createSession({
      prompt: body.prompt,
      title: body.title,
      sourceContext: body.sourceContext,
      requirePlanApproval: body.requirePlanApproval ?? false,
      automationMode: body.automationMode ?? "AUTO_CREATE_PR",
    });

    return NextResponse.json(session, { status: 201 });
  } catch (error) {
    console.error("Failed to create session:", error);
    return NextResponse.json(
      { error: "Failed to create session", message: String(error) },
      { status: 500 },
    );
  }
}
