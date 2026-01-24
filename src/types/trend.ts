export interface TrendItem {
  keyword: string;
  category: string;
  trendScore: number;
  searchVolume: number;
  growthRate: number;
  relatedKeywords: string[];
  sources: string[];
  summary: string;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface TrendReport {
  generatedAt: string;
  summary: string;
  trends: TrendItem[];
  topCategories: CategoryStat[];
}
