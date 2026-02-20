import { NextRequest, NextResponse } from "next/server";
import {
  createVerificationCard,
  getVerificationCards,
  getVerificationStats,
  MAX_VERIFICATION_SESSIONS,
  trimCardsToMax,
  upsertVerificationCard,
} from "@/lib/jules-verification-store";
import {
  createVerificationSession,
  hydrateInitialCard,
  refreshVerificationCards,
  runCrawlerHealthChecks,
} from "@/lib/jules-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 60;

interface CreateVerificationBody {
  query?: string;
  category?: string;
}

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function canCreateNewCard(): boolean {
  const stats = getVerificationStats();
  if (stats.active >= MAX_VERIFICATION_SESSIONS) {
    return false;
  }
  const cards = getVerificationCards();
  return cards.length < MAX_VERIFICATION_SESSIONS || stats.completed + stats.failed > 0;
}

/**
 * GET /api/jules-verification
 * Returns verification cards and refreshes latest state from Jules.
 */
export async function GET(): Promise<NextResponse> {
  trimCardsToMax(MAX_VERIFICATION_SESSIONS);
  const cards = getVerificationCards();
  const refreshedCards = await refreshVerificationCards(cards);

  return NextResponse.json({
    cards: refreshedCards,
    stats: getVerificationStats(),
  });
}

/**
 * POST /api/jules-verification
 * Creates a new Jules verification session and card.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: CreateVerificationBody = {};
  try {
    body = (await request.json()) as CreateVerificationBody;
  } catch {
    body = {};
  }

  const query = (body.query || "").trim();
  const category = (body.category || "기타").trim();

  if (!query) {
    return jsonError("query is required", 400);
  }

  trimCardsToMax(MAX_VERIFICATION_SESSIONS);
  if (!canCreateNewCard()) {
    return jsonError(
      `최대 동시 세션 수(${MAX_VERIFICATION_SESSIONS})에 도달했습니다.`,
      409,
    );
  }

  try {
    const { checks, summary } = await runCrawlerHealthChecks(request);
    const session = await createVerificationSession({
      request,
      query,
      category,
      crawlChecks: checks,
    });

    const createdCard = createVerificationCard({
      session,
      query,
      category,
      crawlChecks: checks,
      crawlSummary: summary,
    });

    const hydratedCard = hydrateInitialCard(createdCard);
    upsertVerificationCard(hydratedCard);

    const [refreshedCard] = await refreshVerificationCards([hydratedCard]);

    return NextResponse.json(
      {
        card: refreshedCard,
        stats: getVerificationStats(),
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create Jules verification session:", error);
    return jsonError(
      error instanceof Error
        ? error.message
        : "Failed to create Jules verification session",
      500,
    );
  }
}
