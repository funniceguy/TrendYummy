"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import mermaid from "mermaid";
import {
  Activity,
  Bot,
  BrainCircuit,
  FileText,
  Hash,
  Plus,
  RefreshCw,
  Settings,
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

  const [verificationCards, setVerificationCards] = useState<JulesVerificationCard[]>([]);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>(DEFAULT_STATUS);
  const [isCreatingManualVerification, setIsCreatingManualVerification] =
    useState(false);
  const [isRefreshingVerificationCards, setIsRefreshingVerificationCards] =
    useState(false);
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

  const loadVerificationCards = useCallback(async () => {
    setIsRefreshingVerificationCards(true);
    try {
      const data = await JulesAgentService.listVerificationCards();
      setVerificationCards(data.cards);
      setSessionStatus(JulesAgentService.getSessionStatus());
    } catch (error) {
      console.error("Failed to load verification cards:", error);
    } finally {
      setIsRefreshingVerificationCards(false);
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
    void loadVerificationCards();
    const interval = setInterval(() => {
      void loadVerificationCards();
    }, 4000);
    return () => clearInterval(interval);
  }, [loadVerificationCards]);

  useEffect(() => {
    if (!toastMessage) {
      return;
    }
    const timeoutId = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
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

  const handleManualAnalyze = async (query: string) => {
    if (isCreatingManualVerification) {
      return;
    }
    setIsCreatingManualVerification(true);
    try {
      const card = await JulesAgentService.createVerification(query, "manual");
      setToastMessage(
        `수동 검증 요청 접수 완료: ${card.sessionId}. 카드에서 진행 상황을 확인하세요.`,
      );
      setSelectedCategory("Jules Analysis");
      await loadVerificationCards();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setToastMessage(`수동 요청 실패: ${message}`);
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
            전체 보기
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
              disabled={isCreatingManualVerification || sessionStatus.available <= 0}
              className="rounded-xl border border-neon-magenta/30 bg-neon-magenta/10 p-3 text-neon-magenta transition-all hover:scale-105 hover:bg-neon-magenta/30 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              title="새 검증 요청"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-gray-300">
            <p>
              세션 사용량: {sessionStatus.active}/{sessionStatus.total}
            </p>
            <p>가용 세션: {sessionStatus.available}</p>
            <p>생성 카드: {verificationCards.length}</p>
          </div>
        </nav>

        <div className="border-t border-white/10 p-6">
          <Link
            href="/settings"
            className="group flex items-center gap-3 rounded-lg border border-transparent p-3 text-gray-400 transition-all hover:border-white/10 hover:bg-white/5 hover:text-white"
          >
            <Settings className="h-5 w-5 transition-colors group-hover:text-neon-cyan" />
            <span className="text-sm font-medium">설정</span>
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
            {isJulesCategory ? "Jules Verification Dashboard" : `${selectedCategory} 대시보드`}
          </h2>

          <div className="flex items-center gap-4">
            <span className="text-xs text-gray-500">
              {isJulesCategory
                ? `검증 카드 ${verificationCards.length}개`
                : "트렌드 자동 업데이트 활성"}
            </span>
            <span
              className={`rounded-full border px-2 py-1 text-xs ${
                showBusyBadge
                  ? "border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan"
                  : "border-white/10 bg-white/5 text-gray-400"
              }`}
            >
              {isLoading
                ? "트렌드 수집 중..."
                : isCreatingManualVerification
                  ? "세션 생성 중..."
                  : sessionStatus.active > 0
                    ? `Jules 진행 중 (${sessionStatus.active})`
                    : "대기"}
            </span>
            <button
              onClick={() => {
                void fetchTrends();
                void loadVerificationCards();
              }}
              disabled={isLoading || isRefreshingVerificationCards}
              className="rounded-full p-2 text-neon-cyan transition-colors duration-700 hover:rotate-180 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:rotate-0"
              title="새로고침"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  isLoading || isRefreshingVerificationCards ? "animate-spin" : ""
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
                  <p>아직 생성된 Jules 검증 카드가 없습니다.</p>
                  <button
                    onClick={() => setIsJulesModalOpen(true)}
                    className="mt-4 rounded-lg bg-neon-magenta/20 px-4 py-2 text-sm font-bold text-neon-magenta transition hover:bg-neon-magenta/30"
                  >
                    + 첫 검증 요청하기
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
                <p>트렌드 데이터가 없습니다. 새로고침을 시도해 주세요.</p>
              </div>
            ) : (
              filteredTrends.map((item) => (
                <TrendCard
                  key={item.id}
                  item={item}
                />
              ))
            )}
          </div>
        </div>

        {selectedReport ? (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 p-12 backdrop-blur-lg">
            <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-neon-magenta/50 bg-gray-900 shadow-[0_0_50px_rgba(217,70,239,0.3)]">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/5 p-6">
                <h3 className="flex items-center gap-2 text-2xl font-bold text-neon-magenta">
                  <BrainCircuit className="h-6 w-6" />
                  Jules 검증 리포트
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
                    Verification Graph
                  </h3>
                  <div className="relative flex flex-1 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5">
                    {selectedReport.visualContent ? (
                      <div className="mermaid">{selectedReport.visualContent.content}</div>
                    ) : (
                      <div className="text-gray-500">시각화 데이터가 없습니다.</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-8 py-4 text-xs text-gray-400">
                <div className="flex items-center gap-4">
                  <span>Session ID: {selectedReport.sessionId}</span>
                  <span>상태: {selectedReport.state}</span>
                  <span>크롤링 검증: {selectedReport.crawlVerified ? "정상" : "확인 필요"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span>분석 시간: {selectedReport.analysisTime}초</span>
                  <a
                    href={JulesAgentService.getAudioUrl(selectedReport.sessionId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-neon-cyan/40 bg-neon-cyan/10 px-2 py-1 font-semibold text-neon-cyan transition hover:bg-neon-cyan/20"
                  >
                    <Volume2 className="h-3 w-3" />
                    음성 파일
                  </a>
                  <button
                    onClick={() => setSelectedReport(null)}
                    className="inline-flex items-center gap-1 rounded-md border border-neon-magenta/40 bg-neon-magenta/10 px-2 py-1 font-semibold text-neon-magenta transition hover:bg-neon-magenta/20"
                  >
                    <FileText className="h-3 w-3" />
                    닫기
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
