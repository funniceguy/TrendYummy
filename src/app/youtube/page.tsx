"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { LayoutWithNav } from "@/components/layout/LayoutWithNav";
import type { Session } from "@/types/jules";
import { getApiPath } from "@/lib/api-path";

interface YouTubeVideo {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  channelUrl: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: string;
  publishedAt: string;
  duration: string;
  category: string;
  uploadedHoursAgo?: number;
}

interface YouTubeCategory {
  id: string;
  name: string;
  icon: string;
  videos: YouTubeVideo[];
}

interface YouTubeResponse {
  success: boolean;
  categories: YouTubeCategory[];
  crawledAt: string;
  filter: {
    timeRange: string;
    sortBy: string;
    region: string;
  };
  error?: string;
}

const CATEGORY_TABS = [
  { id: "0", name: "전체", icon: "🔥" },
  { id: "10", name: "음악", icon: "🎵" },
  { id: "24", name: "엔터테인먼트", icon: "🎭" },
  { id: "20", name: "게임", icon: "🎮" },
  { id: "17", name: "스포츠", icon: "⚽" },
  { id: "22", name: "인물/블로그", icon: "👤" },
];

export default function YouTubePage() {
  const [categories, setCategories] = useState<YouTubeCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("0");
  const [isLoading, setIsLoading] = useState(false);
  const [activeSessionCount, setActiveSessionCount] = useState(0);
  const isFetchingRef = useRef(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [filterInfo, setFilterInfo] = useState<{
    timeRange: string;
    sortBy: string;
    region: string;
  } | null>(null);

  const fetchActiveSessionCount = useCallback(async () => {
    try {
      const response = await fetch(getApiPath("/api/sessions?pageSize=30"));
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

  // 페이지 로드 시 인기 동영상 로드
  useEffect(() => {
    loadTrendingVideos();
  }, []);

  const loadTrendingVideos = async () => {
    if (isFetchingRef.current) {
      return;
    }

    isFetchingRef.current = true;
    setIsLoading(true);

    try {
      const response = await fetch(getApiPath("/api/youtube"));
      const data: YouTubeResponse = await response.json();

      if (data.success && data.categories) {
        setCategories(data.categories);
        setLastUpdated(data.crawledAt);
        setFilterInfo(data.filter);
      }
    } catch (error) {
      console.error("Failed to load YouTube videos:", error);
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  };

  // 선택된 카테고리의 비디오 가져오기
  const getDisplayVideos = (): YouTubeVideo[] => {
    if (selectedCategory === "0") {
      const allCategory = categories.find((c) => c.id === "0");
      return allCategory?.videos || [];
    }

    const category = categories.find((c) => c.id === selectedCategory);
    return category?.videos || [];
  };

  const displayVideos = getDisplayVideos();
  const currentCategoryInfo = CATEGORY_TABS.find(
    (c) => c.id === selectedCategory,
  );

  // 시간 경과 표시
  const getTimeAgo = (hoursAgo?: number) => {
    if (hoursAgo === undefined) return null;
    if (hoursAgo < 1) return "방금 전";
    if (hoursAgo < 24) return `${hoursAgo}시간 전`;
    return `${Math.floor(hoursAgo / 24)}일 전`;
  };

  return (
    <LayoutWithNav activeSessionCount={activeSessionCount}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>📺</span>
              YouTube 인기 동영상
            </h1>
            <p className="text-muted-foreground mt-2">
              {filterInfo ? (
                <span className="inline-flex items-center gap-1">
                  <span className="text-blue-400">🇰🇷 {filterInfo.region}</span>
                  <span className="mx-2">•</span>
                  <span className="text-green-400">
                    ⏱️ {filterInfo.timeRange}
                  </span>
                  <span className="mx-2">•</span>
                  <span className="text-yellow-400">
                    📊 {filterInfo.sortBy}
                  </span>
                </span>
              ) : (
                "한국 YouTube 인기 급상승 동영상"
              )}
            </p>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground mt-1">
                마지막 업데이트: {new Date(lastUpdated).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {isLoading && (
              <span className="px-3 py-1 rounded-full text-xs font-medium border border-red-500/40 bg-red-500/10 text-red-400">
                수집 중...
              </span>
            )}
            <a
              href="https://www.youtube.com/feed/trending?gl=KR"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
            >
              YouTube 인기 급상승 ↗
            </a>
            <button
              onClick={loadTrendingVideos}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-semibold hover:from-red-600 hover:to-pink-600 disabled:opacity-50 transition-all"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🔄</span>
                  로딩 중...
                </span>
              ) : (
                "새로고침"
              )}
            </button>
          </div>
        </div>

        {/* 카테고리 탭 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 p-2 bg-slate-800/50 rounded-lg border border-slate-700">
            {CATEGORY_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                disabled={isLoading}
                className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                  selectedCategory === tab.id
                    ? "bg-red-500 text-white shadow-lg"
                    : "bg-slate-700/50 text-slate-200 hover:bg-slate-600 hover:text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>

        {isLoading && categories.length === 0 ? (
          <div className="bg-card border rounded-lg p-12 text-center">
            <div className="text-6xl mb-4 animate-bounce">🎬</div>
            <h2 className="text-2xl font-semibold mb-2">
              인기 동영상을 불러오는 중...
            </h2>
            <p className="text-muted-foreground">잠시만 기다려주세요</p>
          </div>
        ) : displayVideos.length > 0 ? (
          <div className="space-y-6">
            {/* 요약 카드 */}
            <div className="bg-gradient-to-r from-red-500/10 to-pink-500/10 border border-red-500/30 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2 flex items-center gap-2">
                    <span>{currentCategoryInfo?.icon}</span>
                    {currentCategoryInfo?.name} 인기 동영상 TOP{" "}
                    {displayVideos.length}
                  </h2>
                  <p className="text-muted-foreground">
                    최근 48시간 내 업로드된{" "}
                    {currentCategoryInfo?.name.toLowerCase()} 동영상 중
                    인기순으로 정렬됩니다. 클릭하면 해당 동영상을 시청할 수
                    있습니다.
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-red-500">
                    {displayVideos.length}
                  </div>
                  <div className="text-sm text-muted-foreground">동영상</div>
                </div>
              </div>
            </div>

            {/* 동영상 리스트 (순위 표시) */}
            <div className="space-y-4">
              {displayVideos.map((video, index) => (
                <VideoListItem
                  key={video.id}
                  video={video}
                  rank={index + 1}
                  getTimeAgo={getTimeAgo}
                />
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🎬</div>
            <h2 className="text-2xl font-semibold mb-2">
              동영상 데이터가 없습니다
            </h2>
            <p className="text-muted-foreground mb-6">
              새로고침 버튼을 클릭하여 인기 동영상을 확인하세요
            </p>
            <button
              onClick={loadTrendingVideos}
              disabled={isLoading}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              동영상 불러오기
            </button>
          </div>
        )}
      </div>
    </LayoutWithNav>
  );
}

interface VideoListItemProps {
  video: YouTubeVideo;
  rank: number;
  getTimeAgo: (hoursAgo?: number) => string | null;
}

function VideoListItem({ video, rank, getTimeAgo }: VideoListItemProps) {
  const timeAgo = getTimeAgo(video.uploadedHoursAgo);

  return (
    <a
      href={video.videoUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex gap-4 bg-card border rounded-lg overflow-hidden hover:border-red-500/50 transition-all hover:shadow-lg hover:shadow-red-500/10 group p-4"
    >
      {/* 순위 */}
      <div className="flex items-center justify-center w-12 shrink-0">
        <span
          className={`text-3xl font-bold ${
            rank === 1
              ? "text-yellow-500"
              : rank === 2
                ? "text-gray-400"
                : rank === 3
                  ? "text-amber-700"
                  : "text-muted-foreground"
          }`}
        >
          {rank}
        </span>
      </div>

      {/* 썸네일 */}
      <div className="relative w-48 shrink-0">
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          className="w-full aspect-video object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.currentTarget.src = `https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`;
          }}
        />
        {/* 재생 버튼 오버레이 */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-lg">
          <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        {/* 재생시간 */}
        {video.duration && (
          <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-1 rounded text-white text-xs font-medium">
            {video.duration}
          </div>
        )}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-red-500 transition-colors">
          {video.title}
        </h3>
        <div className="text-sm text-muted-foreground mb-2">
          {video.channelName}
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span>👁️</span>
            <span>조회수 {video.viewCount}</span>
          </div>
          {timeAgo && (
            <div className="flex items-center gap-1">
              <span className="text-green-400">🕐</span>
              <span className="text-green-400">{timeAgo} 업로드</span>
            </div>
          )}
        </div>
        <div className="mt-3 flex items-center gap-2">
          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">
            {video.category}
          </span>
          {video.uploadedHoursAgo !== undefined &&
            video.uploadedHoursAgo <= 12 && (
              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded animate-pulse">
                🔥 NEW
              </span>
            )}
        </div>
      </div>
    </a>
  );
}
