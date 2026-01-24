import { NextRequest, NextResponse } from "next/server";
import { julesApi } from "@/lib/api/jules-client";

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/sessions/[sessionId] - Get a specific session
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    const session = await julesApi.getSession(sessionId);

    return NextResponse.json(session);
  } catch (error) {
    console.error("Failed to get session:", error);
    return NextResponse.json(
      { error: "Failed to get session", message: String(error) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sessions/[sessionId]/approve - Approve a session plan
 */
export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;

    await julesApi.approvePlan(sessionId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to approve plan:", error);
    return NextResponse.json(
      { error: "Failed to approve plan", message: String(error) },
      { status: 500 },
    );
  }
}

/**
 * POST /api/sessions/[sessionId]/message - Send a message to a session
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { sessionId } = await params;
    const body = await request.json();

    await julesApi.sendMessage(sessionId, body.message);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to send message:", error);
    return NextResponse.json(
      { error: "Failed to send message", message: String(error) },
      { status: 500 },
    );
  }
}
