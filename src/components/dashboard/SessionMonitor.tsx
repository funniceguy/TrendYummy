"use client";

import { useState } from "react";
import type { Session, SessionState } from "@/types/jules";

interface SessionMonitorProps {
  sessions: Session[];
  onRefresh: () => void;
  isLoading: boolean;
}

const STATE_CONFIG: Record<
  SessionState,
  { color: string; text: string; icon: string }
> = {
  QUEUED: { color: "bg-yellow-500", text: "대기", icon: "⏳" },
  PLANNING: { color: "bg-blue-500", text: "계획 중", icon: "📋" },
  PLAN_REVIEW: { color: "bg-purple-500", text: "플랜 검토", icon: "👀" },
  IN_PROGRESS: {
    color: "bg-green-500 animate-pulse",
    text: "실행 중",
    icon: "🚀",
  },
  COMPLETED: { color: "bg-green-600", text: "완료", icon: "✅" },
  FAILED: { color: "bg-red-500", text: "실패", icon: "❌" },
};

export function SessionMonitor({
  sessions,
  onRefresh,
  isLoading,
}: SessionMonitorProps) {
  const activeSessions = sessions.filter((s) =>
    ["QUEUED", "PLANNING", "PLAN_REVIEW", "IN_PROGRESS"].includes(s.state),
  );
  const completedSessions = sessions.filter((s) => s.state === "COMPLETED");
  const failedSessions = sessions.filter((s) => s.state === "FAILED");

  return (
    <div className="bg-card text-card-foreground rounded-lg border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">Jules 세션 모니터</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
            <span>{activeSessions.length}/15 활성</span>
          </div>
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoading ? "새로고침 중..." : "새로고침"}
          </button>
        </div>
      </div>

      {/* 상태 요약 */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-green-500">
            {activeSessions.length}
          </div>
          <div className="text-sm text-muted-foreground">활성 세션</div>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-blue-500">
            {completedSessions.length}
          </div>
          <div className="text-sm text-muted-foreground">완료</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
          <div className="text-3xl font-bold text-red-500">
            {failedSessions.length}
          </div>
          <div className="text-sm text-muted-foreground">실패</div>
        </div>
      </div>

      {/* 세션 목록 */}
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>활성 세션이 없습니다</p>
            <p className="text-sm mt-2">
              아래 폼에서 운세 콘텐츠를 생성해보세요!
            </p>
          </div>
        ) : (
          sessions.map((session) => (
            <SessionItem key={session.id} session={session} />
          ))
        )}
      </div>
    </div>
  );
}

function SessionItem({ session }: { session: Session }) {
  const config = STATE_CONFIG[session.state] || STATE_CONFIG.QUEUED;
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="border rounded-lg p-4 hover:border-primary/50 transition-colors cursor-pointer"
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">{config.icon}</span>
            <h3 className="font-semibold">{session.title || "제목 없음"}</h3>
          </div>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
            {session.prompt?.substring(0, 80)}...
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium text-white ${config.color}`}
          >
            {config.text}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(session.createTime).toLocaleString("ko-KR")}
          </span>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 pt-4 border-t space-y-2">
          <div className="text-sm">
            <span className="text-muted-foreground">세션 ID: </span>
            <span className="font-mono">{session.id}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">프롬프트: </span>
            <span>{session.prompt}</span>
          </div>
          {session.url && (
            <a
              href={session.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-sm text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              Jules에서 보기 →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
