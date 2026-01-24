"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { LayoutWithNav } from "@/components/layout/LayoutWithNav";
import { SessionMonitor } from "@/components/dashboard/SessionMonitor";
import type { Session } from "@/types/jules";

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 세션 목록 조회
  const fetchSessions = useCallback(async () => {
    setIsLoading(true);

    try {
      const response = await fetch("/api/sessions?pageSize=30");
      if (!response.ok) {
        throw new Error("세션 목록을 불러오는데 실패했습니다");
      }
      const data = await response.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 초기 로딩 및 자동 새로고침
  useEffect(() => {
    fetchSessions();

    // 30초마다 자동 새로고침
    const interval = setInterval(fetchSessions, 30000);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  // 세션 통계 계산
  const stats = {
    active: sessions.filter((s) =>
      ["QUEUED", "PLANNING", "PLAN_REVIEW", "IN_PROGRESS"].includes(s.state),
    ).length,
    completed: sessions.filter((s) => s.state === "COMPLETED").length,
    waiting: Math.max(0, sessions.filter((s) => s.state === "QUEUED").length),
    failed: sessions.filter((s) => s.state === "FAILED").length,
  };

  // 빠른 시작 카드 데이터
  const quickStartCards = [
    {
      title: "📊 트렌드 리포트",
      description: "실시간 인터넷 트렌드 TOP 10 분석",
      href: "/trends",
      color: "border-blue-500/30 bg-blue-500/5 hover:bg-blue-500/10",
    },
    {
      title: "🎥 유튜브 분석",
      description: "인기 동영상 트렌드 분석 리포트",
      href: "/youtube",
      color: "border-red-500/30 bg-red-500/5 hover:bg-red-500/10",
    },
    {
      title: "😄 유머 콘텐츠",
      description: "커뮤니티 인기 유머 콘텐츠 수집",
      href: "/humor",
      color: "border-yellow-500/30 bg-yellow-500/5 hover:bg-yellow-500/10",
    },
    {
      title: "🔮 오늘의 운세",
      description: "AI 기반 별자리 운세 생성",
      href: "/fortune",
      color: "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10",
    },
  ];

  return (
    <LayoutWithNav>
      <div className="space-y-8">
        {/* 헤더 */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
          <p className="text-muted-foreground mt-2">
            Jules API 세션 모니터링 및 콘텐츠 생성 현황
          </p>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* 활성 세션 */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  활성 세션
                </p>
                <p className="text-3xl font-bold mt-2">
                  {stats.active}
                  <span className="text-muted-foreground text-lg">/15</span>
                </p>
              </div>
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${
                  stats.active > 0
                    ? "bg-green-500/20 text-green-500"
                    : "bg-gray-500/20 text-gray-500"
                }`}
              >
                <span className="text-2xl">⚡</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    stats.active > 0
                      ? "bg-green-500 animate-pulse"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-xs text-muted-foreground">
                  {stats.active > 0 ? "실행 중" : "유휴 상태"}
                </span>
              </div>
            </div>
          </div>

          {/* 완료 세션 */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  완료된 세션
                </p>
                <p className="text-3xl font-bold mt-2">{stats.completed}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-blue-500/20 text-blue-500">
                <span className="text-2xl">✅</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">
                전체 세션 중 완료
              </span>
            </div>
          </div>

          {/* 대기 중 */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  대기 중
                </p>
                <p className="text-3xl font-bold mt-2">{stats.waiting}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-yellow-500/20 text-yellow-500">
                <span className="text-2xl">⏳</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">
                큐에서 대기 중
              </span>
            </div>
          </div>

          {/* 실패 세션 */}
          <div className="border rounded-lg p-6 bg-card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  실패 세션
                </p>
                <p className="text-3xl font-bold mt-2">{stats.failed}</p>
              </div>
              <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-500/20 text-red-500">
                <span className="text-2xl">❌</span>
              </div>
            </div>
            <div className="mt-4">
              <span className="text-xs text-muted-foreground">
                오류 발생한 세션
              </span>
            </div>
          </div>
        </div>

        {/* 빠른 시작 가이드 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">빠른 시작</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStartCards.map((card) => (
              <Link key={card.href} href={card.href}>
                <div
                  className={`border rounded-lg p-6 transition-all cursor-pointer ${card.color}`}
                >
                  <h3 className="text-xl font-bold mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {card.description}
                  </p>
                  <div className="mt-4 text-sm font-medium text-primary">
                    시작하기 →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* 세션 모니터 */}
        <div>
          <h2 className="text-2xl font-bold mb-4">세션 모니터</h2>
          <SessionMonitor
            sessions={sessions}
            onRefresh={fetchSessions}
            isLoading={isLoading}
          />
        </div>

        {/* 하단 정보 */}
        <div className="text-center text-sm text-muted-foreground pt-8 border-t">
          <p>Next.js 14 + TypeScript + Tailwind CSS + Jules API</p>
          <p className="mt-1">
            자동 새로고침: 30초마다 • 마지막 업데이트:{" "}
            {new Date().toLocaleTimeString("ko-KR")}
          </p>
        </div>
      </div>
    </LayoutWithNav>
  );
}
