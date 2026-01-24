"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  description: string;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "대시보드",
    href: "/",
    icon: "🏠",
    description: "세션 모니터링",
  },
  {
    label: "트렌드",
    href: "/trends",
    icon: "📈",
    description: "최신 트렌드",
  },
  {
    label: "유튜브",
    href: "/youtube",
    icon: "📺",
    description: "인기 동영상",
  },
  {
    label: "유머",
    href: "/humor",
    icon: "😂",
    description: "인기 유머",
  },
  {
    label: "운세",
    href: "/fortune",
    icon: "🔮",
    description: "오늘의 운세",
  },
];

interface LayoutWithNavProps {
  children: React.ReactNode;
  activeSessionCount?: number;
}

export function LayoutWithNav({
  children,
  activeSessionCount = 0,
}: LayoutWithNavProps) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-background">
      {/* 사이드바 */}
      <aside
        className={`${
          isSidebarOpen ? "w-64" : "w-20"
        } bg-card border-r transition-all duration-300 flex flex-col`}
      >
        {/* 로고 */}
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            {isSidebarOpen ? (
              <div>
                <h1 className="text-2xl font-bold">🍭 TrendYummy</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  AI Content Platform
                </p>
              </div>
            ) : (
              <div className="text-3xl">🍭</div>
            )}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-accent rounded-md"
            >
              {isSidebarOpen ? "◀" : "▶"}
            </button>
          </div>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 p-4 space-y-2">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-accent"
                }`}
              >
                <span className="text-2xl">{item.icon}</span>
                {isSidebarOpen && (
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs opacity-80">{item.description}</div>
                  </div>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Jules 상태 */}
        <div className="p-4 border-t">
          {isSidebarOpen ? (
            <div className="bg-accent/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Jules Pro</span>
                <div
                  className={`w-2 h-2 rounded-full ${activeSessionCount > 0 ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
                ></div>
              </div>
              <div className="text-2xl font-bold">
                {activeSessionCount}
                <span className="text-sm text-muted-foreground">/15</span>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                활성 세션
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="text-2xl font-bold">{activeSessionCount}</div>
              <div className="text-xs text-muted-foreground">/15</div>
            </div>
          )}
        </div>
      </aside>

      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
