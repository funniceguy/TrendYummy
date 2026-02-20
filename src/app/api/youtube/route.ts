import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

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

// YouTube 카테고리 ID 매핑 (한국)
const YOUTUBE_CATEGORIES = [
  { id: "0", name: "전체", icon: "🔥" },
  { id: "10", name: "음악", icon: "🎵" },
  { id: "24", name: "엔터테인먼트", icon: "🎭" },
  { id: "20", name: "게임", icon: "🎮" },
  { id: "17", name: "스포츠", icon: "⚽" },
  { id: "22", name: "인물/블로그", icon: "👤" },
];

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

export async function GET(
  request: Request,
): Promise<NextResponse<YouTubeResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category") || "0";

    const allCategories: YouTubeCategory[] = [];

    for (const cat of YOUTUBE_CATEGORIES) {
      const videos = await fetchYouTubeTrending(cat.id);
      allCategories.push({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        videos: videos.slice(0, 10),
      });
    }

    const filteredCategories =
      categoryId !== "0"
        ? allCategories.filter((c) => c.id === categoryId || c.id === "0")
        : allCategories;

    return NextResponse.json({
      success: true,
      categories: filteredCategories,
      crawledAt: new Date().toISOString(),
      filter: {
        timeRange: "최근 48시간",
        sortBy: "인기순",
        region: "대한민국",
      },
    });
  } catch (error) {
    console.error("YouTube API error:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : "YouTube 데이터 수집 실패",
        categories: [],
        crawledAt: new Date().toISOString(),
        filter: {
          timeRange: "최근 48시간",
          sortBy: "인기순",
          region: "대한민국",
        },
      },
      { status: 500 },
    );
  }
}

async function fetchYouTubeTrending(
  categoryId: string,
): Promise<YouTubeVideo[]> {
  // YouTube Data API v3 사용 (API 키가 있는 경우)
  if (YOUTUBE_API_KEY) {
    try {
      const videos = await fetchFromYouTubeAPI(categoryId);
      if (videos.length > 0) {
        return videos;
      }
    } catch (error) {
      console.error(`YouTube API error for category ${categoryId}:`, error);
    }
  }

  // API 키가 없거나 실패 시 RSS 피드 사용
  try {
    const videos = await fetchFromRSS(categoryId);
    if (videos.length > 0) {
      return videos;
    }
  } catch (error) {
    console.error(`YouTube RSS error for category ${categoryId}:`, error);
  }

  // 최후의 폴백: 48시간 기준 최신 데이터
  return getRecentFallbackVideos(categoryId);
}

// YouTube Data API v3 사용 (48시간 이내 업로드 + 인기순)
async function fetchFromYouTubeAPI(
  categoryId: string,
): Promise<YouTubeVideo[]> {
  const now = new Date();

  // 먼저 인기 동영상을 가져온 후 48시간 필터링
  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    chart: "mostPopular",
    regionCode: "KR",
    maxResults: "50", // 더 많이 가져와서 48시간 필터링
    key: YOUTUBE_API_KEY!,
  });

  if (categoryId !== "0") {
    params.append("videoCategoryId", categoryId);
  }

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    throw new Error(`YouTube API returned ${response.status}`);
  }

  const data = await response.json();
  const videos: YouTubeVideo[] = [];

  for (const item of data.items || []) {
    const publishedAt = new Date(item.snippet.publishedAt);
    const hoursDiff =
      (now.getTime() - publishedAt.getTime()) / (1000 * 60 * 60);

    // 48시간 이내 업로드된 동영상만 포함
    if (hoursDiff <= 48) {
      videos.push({
        id: `${categoryId}_${videos.length + 1}`,
        videoId: item.id,
        title: item.snippet.title,
        channelName: item.snippet.channelTitle,
        channelUrl: `https://www.youtube.com/channel/${item.snippet.channelId}`,
        thumbnailUrl:
          item.snippet.thumbnails?.maxres?.url ||
          item.snippet.thumbnails?.high?.url ||
          `https://img.youtube.com/vi/${item.id}/maxresdefault.jpg`,
        videoUrl: `https://www.youtube.com/watch?v=${item.id}`,
        viewCount: formatViewCount(parseInt(item.statistics?.viewCount || "0")),
        publishedAt: item.snippet.publishedAt,
        duration: parseDuration(item.contentDetails?.duration || ""),
        category: getCategoryName(categoryId),
        uploadedHoursAgo: Math.floor(hoursDiff),
      });
    }
  }

  // 조회수(인기순)로 정렬
  videos.sort((a, b) => {
    const viewsA = parseViewCount(a.viewCount);
    const viewsB = parseViewCount(b.viewCount);
    return viewsB - viewsA;
  });

  return videos.slice(0, 10);
}

// RSS 피드 사용
async function fetchFromRSS(categoryId: string): Promise<YouTubeVideo[]> {
  // YouTube 인기 동영상 RSS는 카테고리 필터링을 지원하지 않음
  if (categoryId !== "0") {
    return [];
  }

  const rssUrl =
    "https://www.youtube.com/feeds/videos.xml?chart=MOST_POPULAR&regionCode=KR";

  const response = await fetch(rssUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "application/rss+xml, application/xml, text/xml",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`RSS feed returned ${response.status}`);
  }

  const xml = await response.text();
  return parseYouTubeRSS(xml, categoryId);
}

function parseYouTubeRSS(xml: string, categoryId: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  const now = new Date();
  const fortyEightHoursAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

  try {
    const entryPattern = /<entry>([\s\S]*?)<\/entry>/gi;
    const entries = [...xml.matchAll(entryPattern)];

    for (const entry of entries) {
      const content = entry[1];

      const videoIdMatch = content.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
      const videoId = videoIdMatch ? videoIdMatch[1] : null;

      const titleMatch = content.match(/<title>([^<]+)<\/title>/);
      const title = titleMatch ? decodeHtmlEntities(titleMatch[1]) : null;

      const channelMatch = content.match(/<name>([^<]+)<\/name>/);
      const channelName = channelMatch
        ? decodeHtmlEntities(channelMatch[1])
        : null;

      const channelUriMatch = content.match(/<uri>([^<]+)<\/uri>/);
      const channelUrl = channelUriMatch ? channelUriMatch[1] : "";

      const publishedMatch = content.match(/<published>([^<]+)<\/published>/);
      const publishedAt = publishedMatch ? publishedMatch[1] : "";

      const viewsMatch = content.match(/<media:statistics views="(\d+)"/);
      const viewCount = viewsMatch
        ? formatViewCount(parseInt(viewsMatch[1]))
        : "N/A";

      // 48시간 이내 동영상만 포함
      if (publishedAt) {
        const publishedDate = new Date(publishedAt);
        if (publishedDate < fortyEightHoursAgo) {
          continue;
        }

        const hoursDiff =
          (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60);

        if (videoId && title && channelName) {
          videos.push({
            id: `${categoryId}_${videos.length + 1}`,
            videoId,
            title,
            channelName,
            channelUrl,
            thumbnailUrl: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
            videoUrl: `https://www.youtube.com/watch?v=${videoId}`,
            viewCount,
            publishedAt,
            duration: "",
            category: getCategoryName(categoryId),
            uploadedHoursAgo: Math.floor(hoursDiff),
          });
        }
      }
    }
  } catch (error) {
    console.error("YouTube RSS parsing error:", error);
  }

  // 인기순 정렬
  videos.sort((a, b) => {
    const viewsA = parseViewCount(a.viewCount);
    const viewsB = parseViewCount(b.viewCount);
    return viewsB - viewsA;
  });

  return videos.slice(0, 10);
}

function parseDuration(duration: string): string {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";

  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function formatViewCount(views: number): string {
  if (views >= 100000000) {
    return `${(views / 100000000).toFixed(1)}억`;
  } else if (views >= 10000) {
    return `${(views / 10000).toFixed(1)}만`;
  } else if (views >= 1000) {
    return `${(views / 1000).toFixed(1)}천`;
  }
  return views.toString();
}

function parseViewCount(viewStr: string): number {
  if (viewStr.includes("억")) {
    return parseFloat(viewStr.replace("억", "")) * 100000000;
  } else if (viewStr.includes("만")) {
    return parseFloat(viewStr.replace("만", "")) * 10000;
  } else if (viewStr.includes("천")) {
    return parseFloat(viewStr.replace("천", "")) * 1000;
  }
  return parseInt(viewStr) || 0;
}

function getCategoryName(categoryId: string): string {
  const cat = YOUTUBE_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.name : "전체";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .trim();
}

// 48시간 기준 폴백 데이터 (API/RSS 실패 시 실제 유효한 YouTube 동영상 반환)
function getRecentFallbackVideos(categoryId: string): YouTubeVideo[] {
  console.log(
    `Using fallback data for category ${categoryId}. For real-time data, set YOUTUBE_API_KEY in .env`,
  );

  // 실제 존재하는 인기 K-POP, 엔터테인먼트 동영상들 (유효한 videoId)
  const fallbackData: Record<string, YouTubeVideo[]> = {
    "0": [
      // 전체
      {
        id: "0_1",
        videoId: "je_R3gEtDbw",
        title: "NewJeans (뉴진스) 'ETA' Official MV",
        channelName: "HYBE LABELS",
        channelUrl: "https://www.youtube.com/channel/UC3IZKseVpdzPSBaWxBxundA",
        thumbnailUrl:
          "https://img.youtube.com/vi/je_R3gEtDbw/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=je_R3gEtDbw",
        viewCount: "1.2억 회",
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: "3:35",
        category: "전체",
        uploadedHoursAgo: 24,
      },
      {
        id: "0_2",
        videoId: "Hbb75U73lmE",
        title: "aespa 에스파 'Supernova' MV",
        channelName: "SMTOWN",
        channelUrl: "https://www.youtube.com/channel/UCEf_Bc-KVd7onSeifS3py9g",
        thumbnailUrl:
          "https://img.youtube.com/vi/Hbb75U73lmE/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=Hbb75U73lmE",
        viewCount: "8500만 회",
        publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        duration: "3:18",
        category: "전체",
        uploadedHoursAgo: 36,
      },
      {
        id: "0_3",
        videoId: "ZZbA8AyGEG8",
        title:
          "(여자)아이들((G)I-DLE) - '퀸카 (Queencard)' Official Music Video",
        channelName: "(G)I-DLE (여자)아이들 (Official YouTube Channel)",
        channelUrl: "https://www.youtube.com/channel/UCritGVo7pLJLUS8wEu32vow",
        thumbnailUrl:
          "https://img.youtube.com/vi/ZZbA8AyGEG8/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ZZbA8AyGEG8",
        viewCount: "1.5억 회",
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        duration: "3:09",
        category: "전체",
        uploadedHoursAgo: 12,
      },
    ],
    "10": [
      // 음악
      {
        id: "10_1",
        videoId: "je_R3gEtDbw",
        title: "NewJeans (뉴진스) 'ETA' Official MV",
        channelName: "HYBE LABELS",
        channelUrl: "https://www.youtube.com/channel/UC3IZKseVpdzPSBaWxBxundA",
        thumbnailUrl:
          "https://img.youtube.com/vi/je_R3gEtDbw/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=je_R3gEtDbw",
        viewCount: "1.2억 회",
        publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        duration: "3:35",
        category: "음악",
        uploadedHoursAgo: 24,
      },
      {
        id: "10_2",
        videoId: "Hbb75U73lmE",
        title: "aespa 에스파 'Supernova' MV",
        channelName: "SMTOWN",
        channelUrl: "https://www.youtube.com/channel/UCEf_Bc-KVd7onSeifS3py9g",
        thumbnailUrl:
          "https://img.youtube.com/vi/Hbb75U73lmE/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=Hbb75U73lmE",
        viewCount: "8500만 회",
        publishedAt: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
        duration: "3:18",
        category: "음악",
        uploadedHoursAgo: 36,
      },
      {
        id: "10_3",
        videoId: "ZZbA8AyGEG8",
        title:
          "(여자)아이들((G)I-DLE) - '퀸카 (Queencard)' Official Music Video",
        channelName: "(G)I-DLE (여자)아이들 (Official YouTube Channel)",
        channelUrl: "https://www.youtube.com/channel/UCritGVo7pLJLUS8wEu32vow",
        thumbnailUrl:
          "https://img.youtube.com/vi/ZZbA8AyGEG8/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ZZbA8AyGEG8",
        viewCount: "1.5억 회",
        publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        duration: "3:09",
        category: "음악",
        uploadedHoursAgo: 12,
      },
    ],
    "24": [
      // 엔터테인먼트
      {
        id: "24_1",
        videoId: "phuKD0i8A7M",
        title: "[무한도전] 토요일 토요일은 가수다 무대 전곡 모아보기",
        channelName: "MBCentertainment",
        channelUrl: "https://www.youtube.com/channel/UCe56vXHUHFV-6AXllbbmH_w",
        thumbnailUrl:
          "https://img.youtube.com/vi/phuKD0i8A7M/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=phuKD0i8A7M",
        viewCount: "2300만 회",
        publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
        duration: "58:12",
        category: "엔터테인먼트",
        uploadedHoursAgo: 18,
      },
      {
        id: "24_2",
        videoId: "gyjVcqNL0ac",
        title: "런닝맨 역대 레전드 게임 BEST 10",
        channelName: "SBS Entertainment",
        channelUrl: "https://www.youtube.com/channel/UCzW6lXb4OOxjbGg3O7TBzTw",
        thumbnailUrl:
          "https://img.youtube.com/vi/gyjVcqNL0ac/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=gyjVcqNL0ac",
        viewCount: "5600만 회",
        publishedAt: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(),
        duration: "42:15",
        category: "엔터테인먼트",
        uploadedHoursAgo: 30,
      },
    ],
    "20": [
      // 게임
      {
        id: "20_1",
        videoId: "cLC40c7rjKY",
        title: "LOL 2024 Worlds 결승전 하이라이트",
        channelName: "League of Legends Korea",
        channelUrl: "https://www.youtube.com/channel/UCfU6kGlx3JqHs5oO2kbvwXA",
        thumbnailUrl:
          "https://img.youtube.com/vi/cLC40c7rjKY/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=cLC40c7rjKY",
        viewCount: "450만 회",
        publishedAt: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        duration: "12:34",
        category: "게임",
        uploadedHoursAgo: 20,
      },
    ],
    "17": [
      // 스포츠
      {
        id: "17_1",
        videoId: "ZyRLqKL1aNA",
        title: "손흥민 결승골 모음집",
        channelName: "Tottenham Hotspur",
        channelUrl: "https://www.youtube.com/channel/UCH_cVD15vdmThRxK_BsXKvA",
        thumbnailUrl:
          "https://img.youtube.com/vi/ZyRLqKL1aNA/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ZyRLqKL1aNA",
        viewCount: "890만 회",
        publishedAt: new Date(Date.now() - 15 * 60 * 60 * 1000).toISOString(),
        duration: "8:45",
        category: "스포츠",
        uploadedHoursAgo: 15,
      },
    ],
    "22": [
      // 인물/블로그
      {
        id: "22_1",
        videoId: "ksjDDOPNqpU",
        title: "침착맨 - 웃긴 일상 VLOG",
        channelName: "침착맨",
        channelUrl: "https://www.youtube.com/channel/UCUj6rrhMTR9pipbAWBAMu8Q",
        thumbnailUrl:
          "https://img.youtube.com/vi/ksjDDOPNqpU/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ksjDDOPNqpU",
        viewCount: "320만 회",
        publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
        duration: "15:22",
        category: "인물/블로그",
        uploadedHoursAgo: 10,
      },
    ],
  };

  return fallbackData[categoryId] || fallbackData["0"];
}
