// Content Types
export interface TrendData {
  id: string;
  keyword: string;
  category: string;
  trendScore: number;
  searchVolume: number;
  growthRate: number;
  relatedKeywords: string[];
  sources: string[];
  timestamp: string;
  summary: string;
}

export interface TrendReport {
  id: string;
  generatedAt: string;
  trends: TrendData[];
  summary: string;
  topCategories: Array<{ category: string; count: number }>;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  videoUrl: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string;
  description: string;
  duration: string;
  category: string;
}

export interface YouTubeReport {
  id: string;
  generatedAt: string;
  videos: YouTubeVideo[];
  summary: string;
  topChannels: Array<{ name: string; count: number }>;
}

export interface HumorContent {
  id: string;
  title: string;
  thumbnailUrl?: string;
  sourceUrl: string;
  sourceSite: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  publishedAt: string;
  summary: string;
  category: string;
}

export interface HumorReport {
  id: string;
  generatedAt: string;
  contents: HumorContent[];
  summary: string;
  topSites: Array<{ site: string; count: number }>;
}

export interface FortuneDetail {
  id: string;
  generatedAt: string;
  zodiacSign: string;
  category: string;
  fortune: string;
  luckyNumbers: number[];
  luckyColor: string;
  luckyDirection: string;
  advice: string;
  compatibleSigns: string[];
  todayScore: number;
  weeklyForecast?: string;
}

// Task Execution Status
export interface TaskExecution {
  id: string;
  taskType: "trend" | "youtube" | "humor" | "fortune";
  sessionId: string;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  result?: TrendReport | YouTubeReport | HumorReport | FortuneDetail;
  error?: string;
}

// Last Execution Cache
export interface LastExecution {
  taskType: string;
  executedAt: string;
  sessionId: string;
  result: TrendReport | YouTubeReport | HumorReport | FortuneDetail;
}
