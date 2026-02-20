import { NextResponse } from "next/server";
import { getVerificationCard } from "@/lib/jules-verification-store";
import { refreshVerificationCard } from "@/lib/jules-verification";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

function sanitizeTextForTts(text: string): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  if (normalized.length <= 240) {
    return normalized;
  }
  return `${normalized.slice(0, 237)}...`;
}

export async function GET(
  _request: Request,
  { params }: RouteParams,
): Promise<Response> {
  const { sessionId } = await params;
  const existingCard = getVerificationCard(sessionId);

  if (!existingCard) {
    return NextResponse.json(
      { error: "Verification card not found" },
      { status: 404 },
    );
  }

  const card = await refreshVerificationCard(existingCard);
  const ttsText = sanitizeTextForTts(card.audioText || card.reportSummary || "");

  if (!ttsText) {
    return NextResponse.json(
      { error: "No text available for TTS" },
      { status: 400 },
    );
  }

  const ttsUrl = `https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=ko&q=${encodeURIComponent(
    ttsText,
  )}`;

  const ttsResponse = await fetch(ttsUrl, {
    method: "GET",
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "audio/mpeg,*/*",
    },
    cache: "no-store",
  });

  if (!ttsResponse.ok) {
    const errorText = await ttsResponse.text();
    return NextResponse.json(
      {
        error: "Failed to generate audio",
        message: `TTS provider returned ${ttsResponse.status}: ${errorText}`,
      },
      { status: 502 },
    );
  }

  const audioBuffer = await ttsResponse.arrayBuffer();
  return new Response(audioBuffer, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
      "Content-Disposition": `inline; filename="${sessionId}.mp3"`,
    },
  });
}
