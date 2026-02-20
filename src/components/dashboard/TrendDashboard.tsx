"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import mermaid from "mermaid";
import {
  Activity,
  AlertTriangle,
  Bot,
  BrainCircuit,
  FileText,
  Hash,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Volume2,
  X,
  Zap,
} from "lucide-react";
import { useTrendStore } from "@/store/trendsStore";
import { TrendCard } from "./TrendCard";
import { JulesCard } from "../Jules/JulesCard";
import { JulesInputModal } from "../Jules/JulesInputModal";
import {
  JulesAgentService,
  type CrawlerHealthSnapshot,
  type DeepResearchResult,
  type JulesVerificationCard,
  type SessionStatus,
} from "@/services/JulesAgentService";

const DEFAULT_STATUS: SessionStatus = {
  total: 15,
  active: 0,
  idle: 15,
  available: 15,
  details: [],
};

export const TrendDashboard: React.FC = () => {
  const {
    trends,
    isLoading,
    selectedCategory,
    settings,
    fetchTrends,
    setSelectedCategory,
  } = useTrendStore();

  const [verificationCards, setVerificationCards] = useState<
    JulesVerificationCard[]
  >([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(DEFAULT_STATUS);
  const [crawlerHealth, setCrawlerHealth] = useState<CrawlerHealthSnapshot | null>(
    null,
  );
  const [isCreatingManualVerification, setIsCreatingManualVerification] =
    useState(false);
  const [isRefreshingDashboard, setIsRefreshingDashboard] = useState(false);
  const [selectedReport, setSelectedReport] = useState<DeepResearchResult | null>(
    null,
  );
  const [isJulesModalOpen, setIsJulesModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isJulesCategory = selectedCategory === "Jules Analysis";

  const filteredTrends = useMemo(() => {
    if (selectedCategory === "All") {
      return Object.values(trends).flat();
    }
    return trends[selectedCategory] || [];
  }, [selectedCategory, trends]);

  const showBusyBadge =
    isLoading || isCreatingManualVerification || sessionStatus.active > 0;

  const loadDashboardData = useCallback(async () => {
    setIsRefreshingDashboard(true);
    try {
      const [verificationData, healthSnapshot] = await Promise.all([
        JulesAgentService.listVerificationCards(),
        JulesAgentService.getCrawlerHealth(),
      ]);
      setVerificationCards(verificationData.cards);
      setSessionStatus(JulesAgentService.getSessionStatus());
      setCrawlerHealth(healthSnapshot);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setIsRefreshingDashboard(false);
    }
  }, []);

  useEffect(() => {
    void fetchTrends();
    const interval = setInterval(() => {
      void fetchTrends();
    }, settings.refreshInterval * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrends, settings.refreshInterval]);

  useEffect(() => {
    void loadDashboardData();
    const interval = setInterval(() => {
      void loadDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, [loadDashboardData]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setToastMessage(null);
    }, 4500);
    return () => clearTimeout(timeoutId);
  }, [toastMessage]);

  useEffect(() => {
    mermaid.initialize({
      startOnLoad: true,
      theme: "dark",
      securityLevel: "loose",
    });
  }, []);

  useEffect(() => {
    if (!selectedReport?.visualContent) {
      return;
    }
    setTimeout(() => {
      mermaid.contentLoaded();
    }, 100);
  }, [selectedReport]);

  const handleManualAnalyze = async (
    query: string,
    options?: { force?: boolean },
  ) => {
    if (isCreatingManualVerification) {
      return;
    }
    setIsCreatingManualVerification(true);
    try {
      const result = await JulesAgentService.createVerification(
        query,
        "manual",
        options,
      );

      if (result.skipped) {
        setCrawlerHealth(result.health);
        setToastMessage(
          `${result.reason} (${result.health.summary})`,
        );
        return;
      }

      setToastMessage(
        `Verification card created: ${result.card.sessionId}.`,
      );
      setSelectedCategory("Jules Analysis");
      await loadDashboardData();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setToastMessage(`Verification request failed: ${message}`);
    } finally {
      setIsCreatingManualVerification(false);
    }
  };

  const handleOpenReport = (card: JulesVerificationCard) => {
    setSelectedReport(JulesAgentService.toDeepResearchResult(card));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background font-sans text-foreground">
      <aside className="z-20 flex w-80 flex-col border-r border-white/10 bg-black/40 shadow-2xl">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg border border-neon-cyan/50 bg-neon-cyan/20 p-2 shadow-[0_0_15px_rgba(6,182,212,0.5)]">
              <Zap className="h-6 w-6 text-neon-cyan" />
            </div>
            <h1 className="text-2xl font-bold tracking-tighter text-neon-cyan">
              Trend<span className="text-white">Yummy</span>
            </h1>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-6 custom-scrollbar">
          <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            Categories
          </h2>
          <button
            onClick={() => setSelectedCategory("All")}
            disabled={isLoading}
            className={`w-full rounded-xl px-4 py-3 text-left transition-all ${
              selectedCategory === "All"
                ? "border border-neon-cyan/50 bg-neon-cyan/20 text-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                : "text-gray-400 hover:bg-white/5 hover:text-white"
            }`}
          >
            All trends
          </button>

          {settings.categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              disabled={isLoading}
              className={`w-full rounded-xl px-4 py-3 text-left transition-all ${
                selectedCategory === category
                  ? "border border-neon-cyan/50 bg-neon-cyan/20 text-neon-cyan shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              {category}
            </button>
          ))}

          <div className="my-4 border-t border-white/10" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedCategory("Jules Analysis")}
              className={`flex-1 rounded-xl px-4 py-3 text-left transition-all ${
                isJulesCategory
                  ? "border border-neon-magenta/50 bg-neon-magenta/20 text-neon-magenta shadow-[0_0_10px_rgba(217,70,239,0.2)]"
                  : "text-gray-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="flex items-center gap-2">
                <Bot className="h-4 w-4" />
                Jules Analysis
              </span>
            </button>
            <button
              onClick={() => setIsJulesModalOpen(true)}
              disabled={isCreatingManualVerification}
              className="rounded-xl border border-neon-magenta/30 bg-neon-magenta/10 p-3 text-neon-magenta transition-all hover:scale-105 hover:bg-neon-magenta/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              title="New verification request"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
            <p>
              Session usage: {sessionStatus.active}/{sessionStatus.total}
            </p>
            <p>Available sessions: {sessionStatus.available}</p>
            <p>Verification cards: {verificationCards.length}</p>
          </div>

          <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
            <p className="mb-1 flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
              Lightweight crawler checks
            </p>
            {crawlerHealth ? (
              <>
                <p>
                  {crawlerHealth.summary}
                </p>
                <p>
                  Pass: {crawlerHealth.passCount}/{crawlerHealth.totalCount}
                </p>
                <p className="flex items-center gap-1">
                  {crawlerHealth.anomalyDetected ? (
                    <>
                      <AlertTriangle className="h-3.5 w-3.5 text-red-300" />
                      Anomalies: {crawlerHealth.anomalies.length}
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-300" />
                      No anomaly
                    </>
                  )}
                </p>
              </>
            ) : (
              <p>Checking...</p>
            )}
          </div>
        </nav>

        <div className="border-t border-white/10 p-6">
          <Link
            href="/settings"
            className="group flex items-center gap-3 rounded-lg border border-transparent p-3 text-gray-400 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-5 w-5 transition-colors group-hover:text-neon-cyan" />
            <span className="text-sm font-medium">Settings</span>
          </Link>
        </div>
      </aside>

      <main className="relative flex flex-1 flex-col overflow-hidden">
        <header className="z-10 flex h-16 items-center justify-between border-b border-white/10 bg-black/20 px-8 backdrop-blur-sm">
          <h2 className="flex items-center gap-2 text-xl font-bold text-white">
            {isJulesCategory ? (
              <Bot className="h-5 w-5 text-neon-magenta" />
            ) : (
              <Hash className="h-5 w-5 text-gray-400" />
            )}
            {isJulesCategory
              ? "Jules Verification Dashboard"
              : `${selectedCategory} Dashboard`}
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              {isJulesCategory
                ? `Cards ${verificationCards.length}`
                : "Auto trend updates"}
            </span>
            <span
              className={`rounded-full border px-2 py-1 text-xs ${
                showBusyBadge
                  ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan"
                  : "border-white/10 bg-white/5 text-gray-400"
              }`}
            >
              {isLoading
                ? "Crawling..."
                : isCreatingManualVerification
                  ? "Creating session..."
                  : sessionStatus.active > 0
                    ? `Jules running (${sessionStatus.active})`
                    : "Idle"}
            </span>
            <button
              onClick={() => {
                void fetchTrends();
                void loadDashboardData();
              }}
              disabled={isLoading || isRefreshingDashboard}
              className="rounded-full p-2 text-neon-cyan transition-colors duration-700 hover:rotate-180 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:rotate-0"
              title="Refresh"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  isLoading || isRefreshingDashboard ? "animate-spin" : ""
                }`}
              />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {isJulesCategory ? (
              verificationCards.length === 0 ? (
                <div className="col-span-full flex flex-col items-center py-20 text-center text-gray-500">
                  <Bot className="mb-4 h-12 w-12 text-neon-magenta/40" />
                  <p>No Jules verification cards yet.</p>
                  <button
                    onClick={() => setIsJulesModalOpen(true)}
                    className="mt-4 rounded-lg bg-neon-magenta/20 px-4 py-2 text-sm font-bold text-neon-magenta transition hover:bg-neon-magenta/30"
                  >
                    + Create first verification
                  </button>
                </div>
              ) : (
                verificationCards.map((card) => (
                  <JulesCard
                    key={card.sessionId}
                    card={card}
                    onOpenReport={handleOpenReport}
                  />
                ))
              )
            ) : filteredTrends.length === 0 && !isLoading ? (
              <div className="col-span-full flex flex-col items-center py-20 text-center text-gray-500">
                <Zap className="mb-4 h-12 w-12 opacity-20" />
                <p>No trend data available. Try refresh.</p>
              </div>
            ) : (
              filteredTrends.map((item) => <TrendCard key={item.id} item={item} />)
            )}
          </div>
        </div>

        {selectedReport ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-12 backdrop-blur-lg">
            <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-neon-magenta/50 bg-gray-900 shadow-[0_0_50px_rgba(217,70,239,0.3)]">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-6">
                <h3 className="flex items-center gap-2 text-2xl font-bold text-neon-magenta">
                  <BrainCircuit className="h-6 w-6" />
                  Jules verification report
                </h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="rounded-full p-2 transition-colors hover:bg-white/10"
                >
                  <X className="h-6 w-6 text-gray-400 hover:text-white" />
                </button>
              </div>

              <div className="flex flex-1 overflow-hidden">
                <div className="prose prose-invert max-w-none w-1/2 overflow-y-auto border-r border-white/10 p-8">
                  <pre className="whitespace-pre-wrap font-sans leading-relaxed text-gray-300">
                    {selectedReport.markdownReport}
                  </pre>
                </div>
                <div className="flex w-1/2 flex-col bg-black/20 p-8">
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-neon-lime">
                    <Activity className="h-5 w-5" />
                    Verification graph
                  </h3>
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {selectedReport.visualContent ? (
                      <div className="mermaid">{selectedReport.visualContent.content}</div>
                    ) : (
                      <div className="text-gray-500">No visualization data.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-8 py-4 text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span>Session ID: {selectedReport.sessionId}</span>
                  <span>State: {selectedReport.state}</span>
                  <span>
                    Anomalies: {selectedReport.anomalies.length}
                  </span>
                  <span>
                    Crawler checks:{" "}
                    {selectedReport.crawlVerified ? "healthy" : "needs review"}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span>Elapsed: {selectedReport.analysisTime}s</span>
                  <a
                    href={JulesAgentService.getAudioUrl(selectedReport.sessionId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-1 font-semibold text-neon-cyan transition hover:bg-neon-cyan/20"
                  >
                    <Volume2 className="h-3 w-3" />
                    Audio
                  </a>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="inline-flex items-center gap-1 rounded-md border border-neon-magenta/40 bg-neon-magenta/10 px-2 py-1 font-semibold text-neon-magenta transition hover:bg-neon-magenta/20"
                  >
                    <FileText className="h-3 w-3" />
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <JulesInputModal
          isOpen={isJulesModalOpen}
          onClose={() => setIsJulesModalOpen(false)}
          onAnalyze={handleManualAnalyze}
        />

        {toastMessage ? (
          <div className="fixed bottom-6 right-6 z-[100] max-w-md animate-in slide-in-from-bottom-4">
            <div className="rounded-xl border border-neon-cyan/30 bg-gray-900/95 px-5 py-3 text-sm text-gray-200 shadow-[0_0_30px_rgba(6,182,212,0.2)] backdrop-blur-lg">
              {toastMessage}
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
};
