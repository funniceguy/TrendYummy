import { NextRequest, NextResponse } from 'next/server';
import { julesApi } from '@/lib/api/jules-client';

interface RouteParams {
  params: Promise<{ sessionId: string }>;
}

/**
 * GET /api/sessions/[sessionId]/activities - List activities for a session
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { sessionId } = await params;
    const { searchParams } = new URL(request.url);

    const pageSize = Number(searchParams.get('pageSize') || '50');
    const pageToken = searchParams.get('pageToken') || undefined;

    const result = await julesApi.listActivities(sessionId, {
      pageSize,
      pageToken,
    });

    return NextResponse.json({
      activities: result.activities,
      nextPageToken: result.nextPageToken,
    });
  } catch (error) {
    console.error('Failed to list activities:', error);
    return NextResponse.json(
      { error: 'Failed to list activities', message: String(error) },
      { status: 500 }
    );
  }
}
