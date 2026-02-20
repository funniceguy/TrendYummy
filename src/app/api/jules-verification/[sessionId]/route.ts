import { NextResponse } from "next/server";
import {
  getVerificationCard,
  getVerificationStats,
} from "@/lib/jules-verification-store";
import { refreshVerificationCard } from "@/lib/jules-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<NextResponse> {
  const { sessionId } = await params;
  const card = getVerificationCard(sessionId);

  if (!card) {
    return NextResponse.json(
      { error: "Verification card not found" },
      { status: 404 },
    );
  }

  const refreshed = await refreshVerificationCard(card);
  return NextResponse.json({
    card: refreshed,
    stats: getVerificationStats(),
  });
}
