"use client";

import { useState, useEffect, useCallback } from "react";
import { LayoutWithNav } from "@/components/layout/LayoutWithNav";
import type { Session } from "@/types/jules";

interface HumorPost {
  id: string;
  title: string;
  url: string;
  author: string;
  date: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
}

interface CrawlResponse {
  success: boolean;
  posts: HumorPost[];
  crawledAt: string;
  source: string;
  error?: string;
}

export default function HumorPage() {
  const [posts, setPosts] = useState<HumorPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [crawledAt, setCrawledAt] = useState<string | null>(null);
  const [activeSessionCount, setActiveSessionCount] = useState(0);

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

  // 페이지 로드 시 자동으로 크롤링
  useEffect(() => {
    handleCrawl();
  }, []);

  const handleCrawl = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/humor");
      const data: CrawlResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || "크롤링에 실패했습니다");
      }

      setPosts(data.posts);
      setCrawledAt(data.crawledAt);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LayoutWithNav activeSessionCount={activeSessionCount}>
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <span>😂</span>
              오늘의유머 베스트
            </h1>
            <p className="text-muted-foreground mt-2">
              오늘의유머 베스트 게시판 인기글 TOP 10
            </p>
            {crawledAt && (
              <p className="text-xs text-muted-foreground mt-1">
                마지막 업데이트: {new Date(crawledAt).toLocaleString("ko-KR")}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <a
              href="https://www.todayhumor.co.kr/board/list.php?table=humorbest"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 border rounded-lg hover:bg-accent transition-colors text-sm"
            >
              원본 사이트 방문 ↗
            </a>
            <button
              onClick={handleCrawl}
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:from-yellow-600 hover:to-orange-600 disabled:opacity-50 transition-all"
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

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-500">
            ❌ {error}
            <button
              onClick={handleCrawl}
              className="ml-4 underline hover:no-underline"
            >
              다시 시도
            </button>
          </div>
        )}

        {isLoading && posts.length === 0 ? (
          <div className="bg-card border rounded-lg p-12 text-center">
            <div className="text-6xl mb-4 animate-bounce">🔄</div>
            <h2 className="text-2xl font-semibold mb-2">
              오늘의유머에서 인기글을 가져오는 중...
            </h2>
            <p className="text-muted-foreground">잠시만 기다려주세요</p>
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {/* 베스트 요약 카드 */}
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-lg p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold mb-2">
                    🏆 베스트 게시판 TOP {posts.length}
                  </h2>
                  <p className="text-muted-foreground">
                    오늘의유머 베스트 게시판에서 가장 인기있는 게시글들입니다
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-yellow-500">
                    {posts
                      .reduce((sum, p) => sum + p.viewCount, 0)
                      .toLocaleString()}
                  </div>
                  <div className="text-sm text-muted-foreground">총 조회수</div>
                </div>
              </div>
            </div>

            {/* 게시글 목록 */}
            <div className="bg-card border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-accent/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold w-12">
                      순위
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">
                      제목
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold w-20">
                      작성자
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold w-20">
                      조회
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold w-16">
                      추천
                    </th>
                    <th className="px-4 py-3 text-center text-sm font-semibold w-16">
                      댓글
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((post, index) => (
                    <tr
                      key={post.id}
                      className="border-t hover:bg-accent/30 transition-colors"
                    >
                      <td className="px-4 py-4">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            index === 0
                              ? "bg-yellow-500 text-black"
                              : index === 1
                                ? "bg-gray-400 text-black"
                                : index === 2
                                  ? "bg-amber-700 text-white"
                                  : "bg-accent text-foreground"
                          }`}
                        >
                          {index + 1}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <a
                          href={post.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-medium hover:text-primary hover:underline transition-colors line-clamp-1"
                        >
                          {post.title}
                          {post.commentCount > 0 && (
                            <span className="ml-2 text-xs text-orange-500">
                              [{post.commentCount}]
                            </span>
                          )}
                        </a>
                        {post.date && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {post.date}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-muted-foreground">
                        {post.author}
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        <span className="flex items-center justify-center gap-1">
                          👁️ {post.viewCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        <span className="flex items-center justify-center gap-1 text-green-500">
                          👍 {post.recommendCount}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center text-sm">
                        <span className="flex items-center justify-center gap-1 text-blue-500">
                          💬 {post.commentCount}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 카드 뷰 (모바일) */}
            <div className="lg:hidden space-y-4 mt-6">
              {posts.map((post, index) => (
                <a
                  key={post.id}
                  href={post.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-card border rounded-lg p-4 hover:border-primary/50 transition-all"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        index === 0
                          ? "bg-yellow-500 text-black"
                          : index === 1
                            ? "bg-gray-400 text-black"
                            : index === 2
                              ? "bg-amber-700 text-white"
                              : "bg-accent text-foreground"
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold line-clamp-2 mb-2">
                        {post.title}
                      </h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>👁️ {post.viewCount.toLocaleString()}</span>
                        <span className="text-green-500">
                          👍 {post.recommendCount}
                        </span>
                        <span className="text-blue-500">
                          💬 {post.commentCount}
                        </span>
                      </div>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-card border rounded-lg p-12 text-center">
            <div className="text-6xl mb-4">🤷</div>
            <h2 className="text-2xl font-semibold mb-2">
              게시글을 불러올 수 없습니다
            </h2>
            <p className="text-muted-foreground mb-6">
              오늘의유머 사이트에 접속할 수 없거나 게시글이 없습니다
            </p>
            <button
              onClick={handleCrawl}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              다시 시도
            </button>
          </div>
        )}
      </div>
    </LayoutWithNav>
  );
}
