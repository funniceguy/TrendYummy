export interface TrendItem {
    id: string;
    category: string;
    keyword: string;
    title: string;
    summary: string;
    source: string;
    timestamp: string;
    score: number;
    link?: string;
    trafficVolume?: string;
}

export const CATEGORIES = [
    "연예",
    "스포츠",
    "경제",
    "정치",
    "사회",
    "IT",
    "게임",
    "기타",
];

// API 응답 타입
interface ApiTrendItem {
    rank: number;
    keyword: string;
    category: string;
    link: string;
    source: string;
    publishedAt?: string;
    trafficVolume?: string;
}

interface ApiTrendResponse {
    success: boolean;
    trends: ApiTrendItem[];
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

// 트래픽 볼륨 문자열을 점수로 변환
function trafficToScore(trafficVolume?: string): number {
    if (!trafficVolume) return Math.floor(Math.random() * 30) + 50;
    const cleaned = trafficVolume.replace(/[^0-9KMkm+]/g, '').toUpperCase();
    if (cleaned.includes('M')) return 99;
    if (cleaned.includes('500K')) return 95;
    if (cleaned.includes('200K')) return 90;
    if (cleaned.includes('100K')) return 85;
    if (cleaned.includes('50K')) return 75;
    if (cleaned.includes('20K')) return 65;
    if (cleaned.includes('10K')) return 55;
    return Math.floor(Math.random() * 20) + 50;
}

// API 응답을 프론트엔드 TrendItem으로 매핑
function mapApiToTrendItem(apiItem: ApiTrendItem): TrendItem {
    return {
        id: `trend-${apiItem.keyword}-${apiItem.rank}`,
        category: apiItem.category,
        keyword: apiItem.keyword,
        title: apiItem.keyword,
        summary: `"${apiItem.keyword}" — 현재 화제의 키워드입니다. (출처: ${apiItem.source}, 트래픽: ${apiItem.trafficVolume || 'N/A'})`,
        source: apiItem.source,
        timestamp: apiItem.publishedAt || new Date().toISOString(),
        score: trafficToScore(apiItem.trafficVolume),
        link: apiItem.link,
        trafficVolume: apiItem.trafficVolume,
    };
}

export const TrendService = {
    fetchTrends: async (category: string): Promise<TrendItem[]> => {
        try {
            const url = category === '전체'
                ? '/api/trends'
                : `/api/trends?category=${encodeURIComponent(category)}`;
            const response = await fetch(url, { cache: 'no-store' });

            if (!response.ok) {
                console.error(`API response not ok: ${response.status}`);
                return [];
            }

            const data: ApiTrendResponse = await response.json();

            if (!data.success || !data.trends?.length) {
                console.warn('API returned no trends or failed:', data.error);
                return [];
            }

            return data.trends.map(mapApiToTrendItem);
        } catch (error) {
            console.error("Failed to fetch trends from API:", error);
            return [];
        }
    },

    fetchAllTrends: async (): Promise<Record<string, TrendItem[]>> => {
        try {
            const response = await fetch('/api/trends', { cache: 'no-store' });

            if (!response.ok) {
                console.error(`API response not ok: ${response.status}`);
                return {};
            }

            const data: ApiTrendResponse = await response.json();

            if (!data.success || !data.trends?.length) {
                console.warn('API returned no trends or failed:', data.error);
                return {};
            }

            // 카테고리별로 그룹화
            const grouped: Record<string, TrendItem[]> = {};
            for (const apiItem of data.trends) {
                const item = mapApiToTrendItem(apiItem);
                if (!grouped[item.category]) {
                    grouped[item.category] = [];
                }
                grouped[item.category].push(item);
            }

            return grouped;
        } catch (error) {
            console.error("Failed to fetch all trends from API:", error);
            return {};
        }
    }
};
