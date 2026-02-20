"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutWithNav } from "@/components/layout/LayoutWithNav";
import type { Session } from "@/types/jules";

interface TrendItem {
  rank: number;
  keyword: string;
  category: string;
  link: string;
  source: string;
  publishedAt?: string;
  trafficVolume?: string;
}

interface TrendResponse {
  success: boolean;
  trends: TrendItem[];
  crawledAt: string;
  sources: string[];
  filter: {
    country: string;
    timeRange: string;
    category: string;
  };
  categories: string[];
  error?: string;
}

const CATEGORIES = [
  "전체",
  "연예",
  "스포츠",
  "경제",
  "정치",
  "사회",
  "IT",
  "게임",
  "기타",
];

export default function TrendsPage() {
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawledAt, setCrawledAt] = useState<string | null>(null);
  const [sources, setSources] = useState<string[]>([]);
  const [activeSessionCount, setActiveSessionCount] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [filterInfo, setFilterInfo] = useState<{
    country: string;
    timeRange: string;
  } | null>(null);

  // 활성 세션 수 조회
  const fetchActiveSessionCount = useCallback(async () => {
    try {
      const response = await fetch("/api/sessions?pageSize=30");
      const data = await response.json();
      const sessions: Session[] = data.sessions || [];
      const activeCount = sessions.filter((s) =>
        ["QUEUED", "PLANNING", "PLAN_REVIEW", "IN_PROGRESS"].includes(s.state),
      ).length;
      setActiveSessionCount(activeCount);
    } catch (err) {
      console.error("Failed to fetch active sessions:", err);
    }
  }, []);

  useEffect(() => {
    fetchActiveSessionCount();
    const interval = setInterval(fetchActiveSessionCount, 10000);
    return () => clearInterval(interval);
  }, [fetchActiveSessionCount]);

  // 페이지 로드 시 자동으로 트렌드 로드
  useEffect(() => {
    handleFetchTrends(selectedCategory);
  }, []);

  const handleFetchTrends = async (category: string = selectedCategory) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/trends?category=${encodeURIComponent(category)}`,
        { cache: "no-store" },
      );
      const data: TrendResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "트렌드 수집에 실패했습니다");
      }

      setTrends(data.trends);
      setCrawledAt(data.crawledAt);
      setSources(data.sources);
      setFilterInfo({
        country: data.filter.country,
        timeRange: data.filter.timeRange,
      });
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    handleFetchTrends(category);
  };

  // 카테고리별 통계 (전체 데이터 기준)
  const categoryStats = trends.reduce(
    (acc, trend) => {
      acc[trend.category] = (acc[trend.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const sortedCategories = Object.entries(categoryStats)
    .sort((a, b) => b[1] - a[1])
    .map(([category, count]) => ({ category, count }));

  // 시간 경과 표시
  const getTimeAgo = (dateString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60),
    );

    if (diffHours < 1) return "방금 전";
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${Math.floor(diffHours / 24)}일 전`;
  };

  return (
    <LayoutWithNav activeSessionCount={activeSessionCount}>
      <div className="p-8">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>📈</span>
              실시간 인기 트렌드
            </h1>
            <p className="text-muted-foreground mt-2">
              {filterInfo ? (
                <>
                  <span className="inline-flex items-center gap-1">
                    <span className="text-blue-400">
                      🇰🇷 {filterInfo.country}
                    </span>
                    <span className="mx-2">•</span>
                    <span className="text-green-400">
                      ⏱️ {filterInfo.timeRange}
                    </span>
                  </span>
                </>
              ) : (
                "대한민국 실시간 인기 검색어를 수집합니다"
              )}
            </p>
            {crawledAt && (
              <p className="text-xs text-muted-foreground mt-1">
                마지막 업데이트: {new Date(crawledAt).toLocaleString("ko-KR")}
                {sources.length > 0 && ` (출처: ${sources.join(", ")})`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://trends.google.co.kr/trending?geo=KR"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
            >
              Google Trends ↗
            </a>
            <button
              onClick={() => handleFetchTrends()}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🔄</span>
                  수집 중...
                </span>
              ) : (
                "새로고침"
              )}
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  selectedCategory === category
                    ? "bg-blue-500 text-white shadow-lg shadow-blue-500/30"
                    : "bg-slate-700/50 text-slate-200 hover:bg-slate-600 hover:text-white"
                }`}
              >
                {category}
                {selectedCategory === "전체" && categoryStats[category] && (
                  <span className="ml-1 text-xs opacity-70">
                    ({categoryStats[category]})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 에러 표시 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            ❌ {error}
            <button
              onClick={() => handleFetchTrends()}
              className="ml-4 underline hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {isLoading && trends.length === 0 ? (
          <div className="bg-card border rounded-lg p-12 text-center">
            <div className="text-6xl mb-4 animate-bounce">🔍</div>
            <h2 className="text-2xl font-semibold mb-2">
              실시간 트렌드를 수집하는 중...
            </h2>
            <p className="text-muted-foreground">잠시만 기다려주세요</p>
          </div>
        ) : trends.length > 0 ? (
          <div className="space-y-6">
            {/* 요약 카드 */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 border border-blue-500/30 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    🔥{" "}
                    {selectedCategory === "전체"
                      ? "실시간 인기 검색어"
                      : `${selectedCategory} 트렌드`}{" "}
                    TOP {trends.length}
                  </h2>
                  <p className="text-muted-foreground">
                    지난 48시간 동안 가장 많이 검색된 키워드입니다. 클릭하면
                    네이버 검색 결과로 이동합니다.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-500">
                    {trends.length}
                  </div>
                  <div className="text-sm text-muted-foreground">트렌드</div>
                </div>
              </div>
            </div>

            {/* 카테고리 분포 (전체일 때만 표시) */}
            {selectedCategory === "전체" && sortedCategories.length > 0 && (
              <div className="bg-card border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-4">📊 카테고리 분포</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                  {sortedCategories.map((cat) => (
                    <button
                      key={cat.category}
                      onClick={() => handleCategoryChange(cat.category)}
                      className="bg-accent/50 hover:bg-accent rounded-lg p-3 text-center transition-colors"
                    >
                      <div className="text-2xl font-bold text-primary">
                        {cat.count}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {cat.category}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 트렌드 리스트 */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <div className="p-4 border-b bg-accent/30 flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {selectedCategory === "전체" ? "전체" : selectedCategory}{" "}
                  트렌드 ({trends.length}개)
                </h2>
                <div className="text-sm text-muted-foreground">
                  지난 48시간 기준
                </div>
              </div>
              <div className="divide-y">
                {trends.map((trend) => (
                  <TrendCard
                    key={`${trend.rank}-${trend.keyword}`}
                    trend={trend}
                    getTimeAgo={getTimeAgo}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-card border rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">📊</div>
            <h2 className="text-2xl font-semibold mb-2">
              {selectedCategory === "전체"
                ? "트렌드 데이터를 불러올 수 없습니다"
                : `${selectedCategory} 카테고리에 트렌드가 없습니다`}
            </h2>
            <p className="text-muted-foreground mb-6">
              {selectedCategory === "전체"
                ? "네트워크 문제이거나 데이터 소스에 접근할 수 없습니다"
                : "다른 카테고리를 선택해 보세요"}
            </p>
            <div className="flex gap-3 justify-center">
              {selectedCategory !== "전체" && (
                <button
                  onClick={() => handleCategoryChange("전체")}
                  className="px-6 py-3 bg-accent text-foreground rounded-lg font-semibold hover:bg-accent/80 transition-colors"
                >
                  전체 보기
                </button>
              )}
              <button
                onClick={() => handleFetchTrends()}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        )}
      </div>
    </LayoutWithNav>
  );
}

interface TrendCardProps {
  trend: TrendItem;
  getTimeAgo: (dateString?: string) => string | null;
}

function TrendCard({ trend, getTimeAgo }: TrendCardProps) {
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      연예: "bg-pink-500",
      스포츠: "bg-green-500",
      경제: "bg-yellow-500",
      정치: "bg-red-500",
      사회: "bg-orange-500",
      IT: "bg-blue-500",
      게임: "bg-purple-500",
      기타: "bg-gray-500",
    };
    return colors[category] || colors["기타"];
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return "bg-yellow-500 text-black";
    if (rank === 2) return "bg-gray-400 text-black";
    if (rank === 3) return "bg-amber-700 text-white";
    return "bg-accent text-foreground";
  };

  const timeAgo = getTimeAgo(trend.publishedAt);

  return (
    <a
      href={trend.link}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-4 p-4 hover:bg-accent/50 transition-colors"
    >
      {/* 순위 */}
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${getRankStyle(trend.rank)}`}
      >
        {trend.rank}
      </div>

      {/* 키워드 */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-lg hover:text-primary transition-colors">
            {trend.keyword}
          </span>
          <span
            className={`px-2 py-0.5 text-xs font-medium text-white rounded ${getCategoryColor(trend.category)}`}
          >
            {trend.category}
          </span>
          {trend.trafficVolume && (
            <span className="px-2 py-0.5 text-xs font-medium bg-emerald-500/20 text-emerald-400 rounded">
              🔥 {trend.trafficVolume}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
          <span>출처: {trend.source}</span>
          {timeAgo && (
            <>
              <span>•</span>
              <span>{timeAgo}</span>
            </>
          )}
        </div>
      </div>

      {/* 화살표 */}
      <div className="text-muted-foreground flex-shrink-0">
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
          />
        </svg>
      </div>
    </a>
  );
}
