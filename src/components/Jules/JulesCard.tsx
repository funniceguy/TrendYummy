import React from "react";
import {
  AlertTriangle,
  Bot,
  FileText,
  Headphones,
  Link as LinkIcon,
  ShieldCheck,
} from "lucide-react";
import {
  JulesAgentService,
  type JulesVerificationCard,
  type VerificationState,
} from "@/services/JulesAgentService";

interface JulesCardProps {
  card: JulesVerificationCard;
  onOpenReport: (card: JulesVerificationCard) => void;
}

const ACTIVE_STATES: VerificationState[] = [
  "QUEUED",
  "PLANNING",
  "PLAN_REVIEW",
  "IN_PROGRESS",
];

function getStateBadgeClass(state: VerificationState): string {
  if (state === "COMPLETED") {
    return "bg-emerald-500/20 text-emerald-300 border-emerald-400/40";
  }
  if (state === "FAILED" || state === "CREATE_FAILED") {
    return "bg-red-500/20 text-red-300 border-red-400/40";
  }
  return "bg-neon-magenta/20 text-neon-magenta border-neon-magenta/40";
}

function getStateText(state: VerificationState): string {
  switch (state) {
    case "QUEUED":
      return "대기";
    case "PLANNING":
      return "계획";
    case "PLAN_REVIEW":
      return "검토";
    case "IN_PROGRESS":
      return "진행";
    case "COMPLETED":
      return "완료";
    case "FAILED":
      return "실패";
    case "CREATE_FAILED":
      return "생성 실패";
    default:
      return state;
  }
}

export const JulesCard: React.FC<JulesCardProps> = ({ card, onOpenReport }) => {
  const isActive = ACTIVE_STATES.includes(card.state);
  const audioUrl = JulesAgentService.getAudioUrl(card.sessionId);

  return (
    <div className="relative overflow-hidden rounded-xl border border-neon-magenta/30 bg-white/5 backdrop-blur-md p-6 transition-all duration-300 hover:border-neon-magenta/60 hover:bg-white/10">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-neon-magenta/10 to-neon-cyan/5 opacity-70" />

      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-neon-magenta/30 bg-neon-magenta/10 px-2 py-1">
          <Bot className="h-4 w-4 text-neon-magenta" />
          <span className="text-xs font-bold uppercase tracking-wider text-neon-magenta">
            Jules Verification
          </span>
        </div>
        <span
          className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${getStateBadgeClass(
            card.state,
          )}`}
        >
          {getStateText(card.state)}
        </span>
      </div>

      <h3 className="mb-2 line-clamp-2 text-lg font-bold text-white">
        {card.query}
      </h3>
      <p className="mb-3 text-xs text-gray-400">Session: {card.sessionId}</p>

      <div className="mb-3">
        <div className="mb-1 flex items-center justify-between text-xs text-gray-400">
          <span>진행률</span>
          <span>{card.progress}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10">
          <div
            className={`h-2 rounded-full transition-all ${
              card.state === "FAILED" || card.state === "CREATE_FAILED"
                ? "bg-red-400"
                : card.state === "COMPLETED"
                  ? "bg-emerald-400"
                  : "bg-neon-cyan"
            }`}
            style={{ width: `${Math.max(4, Math.min(100, card.progress))}%` }}
          />
        </div>
      </div>

      <div className="mb-3 space-y-1 text-xs text-gray-300">
        <p className="line-clamp-2">{card.statusMessage}</p>
        <p>
          크롤링 검증:{" "}
          <span className={card.crawlVerified ? "text-emerald-300" : "text-yellow-300"}>
            {card.crawlSummary}
          </span>
        </p>
        <p className="flex items-center gap-1">
          {card.anomalyDetected ? (
            <>
              <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
              <span className="text-red-300">
                이상 징후 {card.anomalies.length}건
              </span>
            </>
          ) : (
            <>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              <span className="text-emerald-300">이상 징후 없음</span>
            </>
          )}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
        <button
          onClick={() => onOpenReport(card)}
          className="inline-flex items-center gap-1 rounded-md border border-neon-magenta/40 bg-neon-magenta/10 px-3 py-1.5 text-xs font-semibold text-neon-magenta transition hover:bg-neon-magenta/20"
        >
          <FileText className="h-3 w-3" />
          리포트
        </button>

        <a
          href={audioUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-3 py-1.5 text-xs font-semibold text-neon-cyan transition hover:bg-neon-cyan/20"
        >
          <Headphones className="h-3 w-3" />
          음성 파일
        </a>

        {card.julesUrl ? (
          <a
            href={card.julesUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-md border border-white/20 bg-white/5 px-3 py-1.5 text-xs font-semibold text-gray-200 transition hover:bg-white/10"
          >
            <LinkIcon className="h-3 w-3" />
            Jules
          </a>
        ) : null}

        {isActive ? (
          <span className="ml-auto text-[11px] text-neon-cyan">실시간 업데이트 중</span>
        ) : null}
      </div>
    </div>
  );
};
