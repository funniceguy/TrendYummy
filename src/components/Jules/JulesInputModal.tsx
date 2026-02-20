import React, { useEffect, useState } from "react";
import { Activity, Bot, BrainCircuit, Send, X } from "lucide-react";
import { JulesAgentService, type SessionStatus } from "@/services/JulesAgentService";

interface JulesInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalyze: (query: string, options?: { force?: boolean }) => Promise<void> | void;
}

const DEFAULT_STATUS: SessionStatus = {
  total: 15,
  active: 0,
  idle: 15,
  available: 15,
  details: [],
};

export const JulesInputModal: React.FC<JulesInputModalProps> = ({
  isOpen,
  onClose,
  onAnalyze,
}) => {
  const [query, setQuery] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(DEFAULT_STATUS);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [forceAnalysis, setForceAnalysis] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    const loadStatus = async () => {
      try {
        const status = await JulesAgentService.refreshSessionStatus();
        if (!isMounted) {
          return;
        }
        setSessionStatus(status);
        setStatusError(null);
      } catch (error) {
        if (!isMounted) {
          return;
        }
        setStatusError(error instanceof Error ? error.message : "status load failed");
      }
    };

    void loadStatus();
    const intervalId = setInterval(() => {
      void loadStatus();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  const isSystemBusy = sessionStatus.available <= 0;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = query.trim();
    if (!nextQuery || isProcessing) {
      return;
    }

    if (isSystemBusy && forceAnalysis) {
      return;
    }

    setIsProcessing(true);
    try {
      await onAnalyze(nextQuery, { force: forceAnalysis });
      setQuery("");
      setForceAnalysis(false);
      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      alert(`Request failed: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-neon-magenta bg-gray-900 shadow-[0_0_50px_rgba(217,70,239,0.3)]">
        <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-6">
          <h3 className="flex items-center gap-2 text-xl font-bold text-neon-magenta">
            <Bot className="h-6 w-6" />
            Jules verification request
          </h3>

          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-2 rounded-full border px-3 py-1 text-xs ${
                isSystemBusy
                  ? "border-red-500 bg-red-500/20 text-red-300"
                  : "border-neon-lime bg-neon-lime/20 text-neon-lime"
              }`}
            >
              <Activity className="h-3 w-3" />
              <span>
                Available: {sessionStatus.available} / {sessionStatus.total}
              </span>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="rounded-full p-2 transition-colors hover:bg-white/10 disabled:opacity-50"
            >
              <X className="h-5 w-5 text-gray-400 hover:text-white" />
            </button>
          </div>
        </div>

        <div className="p-8">
          {isProcessing ? (
            <div className="py-8 text-center">
              <BrainCircuit className="mx-auto mb-4 h-16 w-16 animate-pulse text-neon-magenta" />
              <h4 className="mb-2 text-lg font-bold text-white">
                Processing verification request...
              </h4>
              <p className="text-sm text-gray-400">
                Lightweight checks run first. Jules starts only when anomaly is detected
                or when force mode is enabled.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label className="mb-3 ml-1 block text-sm font-semibold text-gray-300">
                Request
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Example: Verify crawler reliability for entertainment category"
                  className="w-full rounded-xl border border-white/20 bg-black/40 py-4 pl-5 pr-12 text-lg text-white outline-none transition-all focus:border-neon-magenta focus:ring-1 focus:ring-neon-magenta"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!query.trim() || (isSystemBusy && forceAnalysis)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white transition-all ${
                    !query.trim() || (isSystemBusy && forceAnalysis)
                      ? "cursor-not-allowed bg-gray-600"
                      : "bg-neon-magenta hover:bg-neon-magenta/80"
                  }`}
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>

              <label className="mt-4 flex cursor-pointer items-center gap-2 text-xs text-gray-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 accent-neon-magenta"
                  checked={forceAnalysis}
                  onChange={(event) => setForceAnalysis(event.target.checked)}
                />
                Force Jules deep analysis even when no anomaly is detected
              </label>

              <div className="mt-4 text-xs">
                {statusError ? (
                  <p className="text-red-300">Session status load failed: {statusError}</p>
                ) : (
                  <p className="text-gray-500">
                    Recommended default: keep force mode off. This avoids unnecessary Jules
                    sessions when crawler checks are healthy.
                  </p>
                )}
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
