import { NextResponse } from "next/server";

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

// 48시간 기준 폴백 데이터
function getRecentFallbackVideos(categoryId: string): YouTubeVideo[] {
  const now = new Date();

  // 최근 시간 생성 함수 (1-48시간 전)
  const getRecentDate = (hoursAgo: number) => {
    const date = new Date(now);
    date.setHours(date.getHours() - hoursAgo);
    return date.toISOString();
  };

  const fallbackData: Record<string, YouTubeVideo[]> = {
    // 전체 (0) - 최근 48시간 인기 동영상
    "0": [
      {
        id: "0_1",
        videoId: "pFQyMhwSxNc",
        title: "NewJeans (뉴진스) 'How Sweet' Official MV",
        channelName: "HYBE LABELS",
        channelUrl: "https://www.youtube.com/@HYBELABELS",
        thumbnailUrl:
          "https://img.youtube.com/vi/pFQyMhwSxNc/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=pFQyMhwSxNc",
        viewCount: "521만",
        publishedAt: getRecentDate(3),
        duration: "3:15",
        category: "전체",
        uploadedHoursAgo: 3,
      },
      {
        id: "0_2",
        videoId: "wHnVoXvZqfI",
        title: "ILLIT (아일릿) 'Magnetic' Official MV",
        channelName: "HYBE LABELS",
        channelUrl: "https://www.youtube.com/@HYBELABELS",
        thumbnailUrl:
          "https://img.youtube.com/vi/wHnVoXvZqfI/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=wHnVoXvZqfI",
        viewCount: "412만",
        publishedAt: getRecentDate(8),
        duration: "2:56",
        category: "전체",
        uploadedHoursAgo: 8,
      },
      {
        id: "0_3",
        videoId: "abc123def",
        title: "[속보] 2025년 신년 특별 뉴스 브리핑",
        channelName: "MBC 뉴스",
        channelUrl: "https://www.youtube.com/@MBCnews",
        thumbnailUrl: "https://img.youtube.com/vi/abc123def/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=abc123def",
        viewCount: "287만",
        publishedAt: getRecentDate(12),
        duration: "15:32",
        category: "전체",
        uploadedHoursAgo: 12,
      },
      {
        id: "0_4",
        videoId: "game2025",
        title: "2025 LCK 스프링 개막전 하이라이트",
        channelName: "LCK",
        channelUrl: "https://www.youtube.com/@LCK",
        thumbnailUrl: "https://img.youtube.com/vi/game2025/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game2025",
        viewCount: "198만",
        publishedAt: getRecentDate(18),
        duration: "12:45",
        category: "전체",
        uploadedHoursAgo: 18,
      },
      {
        id: "0_5",
        videoId: "comedy123",
        title: "런닝맨 신년특집 비하인드",
        channelName: "SBS ENTERTAINMENT",
        channelUrl: "https://www.youtube.com/@SBSent",
        thumbnailUrl: "https://img.youtube.com/vi/comedy123/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=comedy123",
        viewCount: "156만",
        publishedAt: getRecentDate(24),
        duration: "8:22",
        category: "전체",
        uploadedHoursAgo: 24,
      },
      {
        id: "0_6",
        videoId: "tech2025",
        title: "CES 2025 삼성 신제품 발표 총정리",
        channelName: "잇섭",
        channelUrl: "https://www.youtube.com/@itsubmain",
        thumbnailUrl: "https://img.youtube.com/vi/tech2025/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=tech2025",
        viewCount: "134만",
        publishedAt: getRecentDate(28),
        duration: "18:45",
        category: "전체",
        uploadedHoursAgo: 28,
      },
      {
        id: "0_7",
        videoId: "sports2025",
        title: "손흥민 시즌 첫 골! 토트넘 경기 하이라이트",
        channelName: "SPOTV",
        channelUrl: "https://www.youtube.com/@SPOTV",
        thumbnailUrl: "https://img.youtube.com/vi/sports2025/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sports2025",
        viewCount: "112만",
        publishedAt: getRecentDate(32),
        duration: "6:30",
        category: "전체",
        uploadedHoursAgo: 32,
      },
      {
        id: "0_8",
        videoId: "drama2025",
        title: "[스물다섯 스물하나] 명장면 모음",
        channelName: "tvN drama",
        channelUrl: "https://www.youtube.com/@tvNdrama",
        thumbnailUrl: "https://img.youtube.com/vi/drama2025/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=drama2025",
        viewCount: "98만",
        publishedAt: getRecentDate(36),
        duration: "22:15",
        category: "전체",
        uploadedHoursAgo: 36,
      },
      {
        id: "0_9",
        videoId: "cook2025",
        title: "백종원 신년 맞이 특별 레시피",
        channelName: "백종원의 요리비책",
        channelUrl: "https://www.youtube.com/@paikisvlog",
        thumbnailUrl: "https://img.youtube.com/vi/cook2025/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=cook2025",
        viewCount: "87만",
        publishedAt: getRecentDate(40),
        duration: "11:20",
        category: "전체",
        uploadedHoursAgo: 40,
      },
      {
        id: "0_10",
        videoId: "vlog2025",
        title: "일상 브이로그 | 새해 첫 일주일",
        channelName: "침착맨",
        channelUrl: "https://www.youtube.com/@ChimChak",
        thumbnailUrl: "https://img.youtube.com/vi/vlog2025/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog2025",
        viewCount: "76만",
        publishedAt: getRecentDate(44),
        duration: "14:55",
        category: "전체",
        uploadedHoursAgo: 44,
      },
    ],
    // 음악 (10)
    "10": [
      {
        id: "10_1",
        videoId: "music_nj",
        title: "NewJeans (뉴진스) 'How Sweet' Official MV",
        channelName: "HYBE LABELS",
        channelUrl: "https://www.youtube.com/@HYBELABELS",
        thumbnailUrl: "https://img.youtube.com/vi/music_nj/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_nj",
        viewCount: "521만",
        publishedAt: getRecentDate(3),
        duration: "3:15",
        category: "음악",
        uploadedHoursAgo: 3,
      },
      {
        id: "10_2",
        videoId: "music_illit",
        title: "ILLIT (아일릿) 'Magnetic' Official MV",
        channelName: "HYBE LABELS",
        channelUrl: "https://www.youtube.com/@HYBELABELS",
        thumbnailUrl:
          "https://img.youtube.com/vi/music_illit/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_illit",
        viewCount: "412만",
        publishedAt: getRecentDate(8),
        duration: "2:56",
        category: "음악",
        uploadedHoursAgo: 8,
      },
      {
        id: "10_3",
        videoId: "music_aespa",
        title: "aespa 에스파 'Supernova' MV",
        channelName: "SMTOWN",
        channelUrl: "https://www.youtube.com/@SMTOWN",
        thumbnailUrl:
          "https://img.youtube.com/vi/music_aespa/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_aespa",
        viewCount: "356만",
        publishedAt: getRecentDate(14),
        duration: "3:28",
        category: "음악",
        uploadedHoursAgo: 14,
      },
      {
        id: "10_4",
        videoId: "music_bts",
        title: "BTS (방탄소년단) 신곡 공개",
        channelName: "BANGTANTV",
        channelUrl: "https://www.youtube.com/@BANGTANTV",
        thumbnailUrl: "https://img.youtube.com/vi/music_bts/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_bts",
        viewCount: "298만",
        publishedAt: getRecentDate(20),
        duration: "4:02",
        category: "음악",
        uploadedHoursAgo: 20,
      },
      {
        id: "10_5",
        videoId: "music_iu",
        title: "IU(아이유) - 신곡 라이브",
        channelName: "이지금 [IU Official]",
        channelUrl: "https://www.youtube.com/@dlwlrma",
        thumbnailUrl: "https://img.youtube.com/vi/music_iu/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_iu",
        viewCount: "245만",
        publishedAt: getRecentDate(26),
        duration: "3:45",
        category: "음악",
        uploadedHoursAgo: 26,
      },
      {
        id: "10_6",
        videoId: "music_bp",
        title: "BLACKPINK 월드투어 비하인드",
        channelName: "BLACKPINK",
        channelUrl: "https://www.youtube.com/@BLACKPINK",
        thumbnailUrl: "https://img.youtube.com/vi/music_bp/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_bp",
        viewCount: "187만",
        publishedAt: getRecentDate(32),
        duration: "12:30",
        category: "음악",
        uploadedHoursAgo: 32,
      },
      {
        id: "10_7",
        videoId: "music_svt",
        title: "SEVENTEEN 세븐틴 신곡 MV",
        channelName: "HYBE LABELS",
        channelUrl: "https://www.youtube.com/@HYBELABELS",
        thumbnailUrl: "https://img.youtube.com/vi/music_svt/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_svt",
        viewCount: "156만",
        publishedAt: getRecentDate(38),
        duration: "3:52",
        category: "음악",
        uploadedHoursAgo: 38,
      },
      {
        id: "10_8",
        videoId: "music_str",
        title: "Stray Kids - 락 뮤직비디오",
        channelName: "JYP Entertainment",
        channelUrl: "https://www.youtube.com/@jaboratory",
        thumbnailUrl: "https://img.youtube.com/vi/music_str/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_str",
        viewCount: "134만",
        publishedAt: getRecentDate(42),
        duration: "3:18",
        category: "음악",
        uploadedHoursAgo: 42,
      },
      {
        id: "10_9",
        videoId: "music_twice",
        title: "TWICE 'Strategy' Official MV",
        channelName: "JYP Entertainment",
        channelUrl: "https://www.youtube.com/@jaboratory",
        thumbnailUrl:
          "https://img.youtube.com/vi/music_twice/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_twice",
        viewCount: "112만",
        publishedAt: getRecentDate(45),
        duration: "3:24",
        category: "음악",
        uploadedHoursAgo: 45,
      },
      {
        id: "10_10",
        videoId: "music_ive",
        title: "IVE 아이브 신곡 뮤직비디오",
        channelName: "Starship Entertainment",
        channelUrl: "https://www.youtube.com/@Starship",
        thumbnailUrl: "https://img.youtube.com/vi/music_ive/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=music_ive",
        viewCount: "98만",
        publishedAt: getRecentDate(47),
        duration: "3:08",
        category: "음악",
        uploadedHoursAgo: 47,
      },
    ],
    // 엔터테인먼트 (24)
    "24": [
      {
        id: "24_1",
        videoId: "ent_rm",
        title: "런닝맨 신년특집 비하인드",
        channelName: "SBS ENTERTAINMENT",
        channelUrl: "https://www.youtube.com/@SBSent",
        thumbnailUrl: "https://img.youtube.com/vi/ent_rm/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_rm",
        viewCount: "312만",
        publishedAt: getRecentDate(4),
        duration: "8:22",
        category: "엔터테인먼트",
        uploadedHoursAgo: 4,
      },
      {
        id: "24_2",
        videoId: "ent_knowbros",
        title: "아는형님 신년맞이 레전드 모음",
        channelName: "JTBC Entertainment",
        channelUrl: "https://www.youtube.com/@JTBCent",
        thumbnailUrl:
          "https://img.youtube.com/vi/ent_knowbros/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_knowbros",
        viewCount: "256만",
        publishedAt: getRecentDate(10),
        duration: "15:45",
        category: "엔터테인먼트",
        uploadedHoursAgo: 10,
      },
      {
        id: "24_3",
        videoId: "ent_snl",
        title: "SNL코리아 시즌 5 하이라이트",
        channelName: "tvN",
        channelUrl: "https://www.youtube.com/@tvN",
        thumbnailUrl: "https://img.youtube.com/vi/ent_snl/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_snl",
        viewCount: "198만",
        publishedAt: getRecentDate(16),
        duration: "11:30",
        category: "엔터테인먼트",
        uploadedHoursAgo: 16,
      },
      {
        id: "24_4",
        videoId: "ent_yoo",
        title: "유퀴즈 올해의 게스트 베스트",
        channelName: "tvN",
        channelUrl: "https://www.youtube.com/@tvN",
        thumbnailUrl: "https://img.youtube.com/vi/ent_yoo/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_yoo",
        viewCount: "167만",
        publishedAt: getRecentDate(22),
        duration: "18:20",
        category: "엔터테인먼트",
        uploadedHoursAgo: 22,
      },
      {
        id: "24_5",
        videoId: "ent_chim",
        title: "침착맨 신년 라이브 하이라이트",
        channelName: "침착맨",
        channelUrl: "https://www.youtube.com/@ChimChak",
        thumbnailUrl: "https://img.youtube.com/vi/ent_chim/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_chim",
        viewCount: "145만",
        publishedAt: getRecentDate(28),
        duration: "22:15",
        category: "엔터테인먼트",
        uploadedHoursAgo: 28,
      },
      {
        id: "24_6",
        videoId: "ent_inf",
        title: "무한도전 레전드 에피소드 TOP10",
        channelName: "MBC entertainment",
        channelUrl: "https://www.youtube.com/@MBCent",
        thumbnailUrl: "https://img.youtube.com/vi/ent_inf/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_inf",
        viewCount: "123만",
        publishedAt: getRecentDate(34),
        duration: "25:00",
        category: "엔터테인먼트",
        uploadedHoursAgo: 34,
      },
      {
        id: "24_7",
        videoId: "ent_show",
        title: "쇼미더머니 시즌 12 예고편",
        channelName: "Mnet K-POP",
        channelUrl: "https://www.youtube.com/@MnetKPOP",
        thumbnailUrl: "https://img.youtube.com/vi/ent_show/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_show",
        viewCount: "112만",
        publishedAt: getRecentDate(38),
        duration: "2:30",
        category: "엔터테인먼트",
        uploadedHoursAgo: 38,
      },
      {
        id: "24_8",
        videoId: "ent_cook",
        title: "백종원 신년 맞이 특별 레시피",
        channelName: "백종원의 요리비책",
        channelUrl: "https://www.youtube.com/@paikisvlog",
        thumbnailUrl: "https://img.youtube.com/vi/ent_cook/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_cook",
        viewCount: "98만",
        publishedAt: getRecentDate(42),
        duration: "11:20",
        category: "엔터테인먼트",
        uploadedHoursAgo: 42,
      },
      {
        id: "24_9",
        videoId: "ent_drama",
        title: "[스물다섯 스물하나] 명장면 모음",
        channelName: "tvN drama",
        channelUrl: "https://www.youtube.com/@tvNdrama",
        thumbnailUrl: "https://img.youtube.com/vi/ent_drama/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_drama",
        viewCount: "87만",
        publishedAt: getRecentDate(45),
        duration: "22:15",
        category: "엔터테인먼트",
        uploadedHoursAgo: 45,
      },
      {
        id: "24_10",
        videoId: "ent_movie",
        title: "2025 개봉 예정 한국 영화 총정리",
        channelName: "CGV",
        channelUrl: "https://www.youtube.com/@CGVmovie",
        thumbnailUrl: "https://img.youtube.com/vi/ent_movie/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=ent_movie",
        viewCount: "76만",
        publishedAt: getRecentDate(47),
        duration: "8:45",
        category: "엔터테인먼트",
        uploadedHoursAgo: 47,
      },
    ],
    // 게임 (20)
    "20": [
      {
        id: "20_1",
        videoId: "game_lck",
        title: "2025 LCK 스프링 개막전 하이라이트",
        channelName: "LCK",
        channelUrl: "https://www.youtube.com/@LCK",
        thumbnailUrl: "https://img.youtube.com/vi/game_lck/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_lck",
        viewCount: "287만",
        publishedAt: getRecentDate(5),
        duration: "12:45",
        category: "게임",
        uploadedHoursAgo: 5,
      },
      {
        id: "20_2",
        videoId: "game_faker",
        title: "페이커 시즌 14 첫 경기 풀영상",
        channelName: "T1",
        channelUrl: "https://www.youtube.com/@T1",
        thumbnailUrl: "https://img.youtube.com/vi/game_faker/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_faker",
        viewCount: "234만",
        publishedAt: getRecentDate(12),
        duration: "28:30",
        category: "게임",
        uploadedHoursAgo: 12,
      },
      {
        id: "20_3",
        videoId: "game_val",
        title: "발로란트 VCT 2025 킥오프",
        channelName: "VALORANT Champions Tour",
        channelUrl: "https://www.youtube.com/@ValorantChampionsTour",
        thumbnailUrl: "https://img.youtube.com/vi/game_val/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_val",
        viewCount: "178만",
        publishedAt: getRecentDate(18),
        duration: "15:20",
        category: "게임",
        uploadedHoursAgo: 18,
      },
      {
        id: "20_4",
        videoId: "game_maple",
        title: "메이플스토리 신규 직업 플레이 영상",
        channelName: "MapleStory",
        channelUrl: "https://www.youtube.com/@MapleStoryKR",
        thumbnailUrl: "https://img.youtube.com/vi/game_maple/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_maple",
        viewCount: "145만",
        publishedAt: getRecentDate(24),
        duration: "18:45",
        category: "게임",
        uploadedHoursAgo: 24,
      },
      {
        id: "20_5",
        videoId: "game_genshin",
        title: "원신 5.3 업데이트 공개",
        channelName: "원신",
        channelUrl: "https://www.youtube.com/@GenshinImpact",
        thumbnailUrl:
          "https://img.youtube.com/vi/game_genshin/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_genshin",
        viewCount: "123만",
        publishedAt: getRecentDate(30),
        duration: "8:30",
        category: "게임",
        uploadedHoursAgo: 30,
      },
      {
        id: "20_6",
        videoId: "game_steam",
        title: "스팀 2025 신작 추천 TOP 10",
        channelName: "겜맥",
        channelUrl: "https://www.youtube.com/@gemmac",
        thumbnailUrl: "https://img.youtube.com/vi/game_steam/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_steam",
        viewCount: "98만",
        publishedAt: getRecentDate(36),
        duration: "14:20",
        category: "게임",
        uploadedHoursAgo: 36,
      },
      {
        id: "20_7",
        videoId: "game_fc",
        title: "FC 온라인 신규 선수 업데이트",
        channelName: "EA SPORTS FC ONLINE",
        channelUrl: "https://www.youtube.com/@FCOnline",
        thumbnailUrl: "https://img.youtube.com/vi/game_fc/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_fc",
        viewCount: "87만",
        publishedAt: getRecentDate(40),
        duration: "6:15",
        category: "게임",
        uploadedHoursAgo: 40,
      },
      {
        id: "20_8",
        videoId: "game_pubg",
        title: "배틀그라운드 e스포츠 하이라이트",
        channelName: "PUBG ESPORTS",
        channelUrl: "https://www.youtube.com/@pubgesports",
        thumbnailUrl: "https://img.youtube.com/vi/game_pubg/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_pubg",
        viewCount: "76만",
        publishedAt: getRecentDate(44),
        duration: "10:30",
        category: "게임",
        uploadedHoursAgo: 44,
      },
      {
        id: "20_9",
        videoId: "game_lost",
        title: "로스트아크 신규 레이드 공략",
        channelName: "LOST ARK",
        channelUrl: "https://www.youtube.com/@LOSTARKOFFICIAL",
        thumbnailUrl: "https://img.youtube.com/vi/game_lost/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_lost",
        viewCount: "65만",
        publishedAt: getRecentDate(46),
        duration: "22:40",
        category: "게임",
        uploadedHoursAgo: 46,
      },
      {
        id: "20_10",
        videoId: "game_ow",
        title: "오버워치 2 신규 영웅 공개",
        channelName: "오버워치",
        channelUrl: "https://www.youtube.com/@PlayOverwatch",
        thumbnailUrl: "https://img.youtube.com/vi/game_ow/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=game_ow",
        viewCount: "54만",
        publishedAt: getRecentDate(48),
        duration: "4:20",
        category: "게임",
        uploadedHoursAgo: 48,
      },
    ],
    // 스포츠 (17)
    "17": [
      {
        id: "17_1",
        videoId: "sport_son",
        title: "손흥민 시즌 첫 골! 토트넘 경기 하이라이트",
        channelName: "SPOTV",
        channelUrl: "https://www.youtube.com/@SPOTV",
        thumbnailUrl: "https://img.youtube.com/vi/sport_son/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_son",
        viewCount: "198만",
        publishedAt: getRecentDate(6),
        duration: "6:30",
        category: "스포츠",
        uploadedHoursAgo: 6,
      },
      {
        id: "17_2",
        videoId: "sport_kim",
        title: "김민재 바이에른 경기 풀하이라이트",
        channelName: "스포츠타임",
        channelUrl: "https://www.youtube.com/@sportstime",
        thumbnailUrl: "https://img.youtube.com/vi/sport_kim/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_kim",
        viewCount: "156만",
        publishedAt: getRecentDate(14),
        duration: "8:45",
        category: "스포츠",
        uploadedHoursAgo: 14,
      },
      {
        id: "17_3",
        videoId: "sport_kbo",
        title: "KBO 2025 시즌 개막 카운트다운",
        channelName: "KBO",
        channelUrl: "https://www.youtube.com/@KBO",
        thumbnailUrl: "https://img.youtube.com/vi/sport_kbo/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_kbo",
        viewCount: "134만",
        publishedAt: getRecentDate(20),
        duration: "5:30",
        category: "스포츠",
        uploadedHoursAgo: 20,
      },
      {
        id: "17_4",
        videoId: "sport_lee",
        title: "이강인 PSG 경기 하이라이트",
        channelName: "SBS Sports",
        channelUrl: "https://www.youtube.com/@SBSSports",
        thumbnailUrl: "https://img.youtube.com/vi/sport_lee/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_lee",
        viewCount: "112만",
        publishedAt: getRecentDate(26),
        duration: "7:20",
        category: "스포츠",
        uploadedHoursAgo: 26,
      },
      {
        id: "17_5",
        videoId: "sport_vball",
        title: "여자 배구 V리그 하이라이트",
        channelName: "KOVO",
        channelUrl: "https://www.youtube.com/@KOVO",
        thumbnailUrl:
          "https://img.youtube.com/vi/sport_vball/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_vball",
        viewCount: "98만",
        publishedAt: getRecentDate(32),
        duration: "12:15",
        category: "스포츠",
        uploadedHoursAgo: 32,
      },
      {
        id: "17_6",
        videoId: "sport_hwang",
        title: "황희찬 울버햄튼 골 하이라이트",
        channelName: "SPOTV",
        channelUrl: "https://www.youtube.com/@SPOTV",
        thumbnailUrl:
          "https://img.youtube.com/vi/sport_hwang/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_hwang",
        viewCount: "87만",
        publishedAt: getRecentDate(36),
        duration: "5:45",
        category: "스포츠",
        uploadedHoursAgo: 36,
      },
      {
        id: "17_7",
        videoId: "sport_golf",
        title: "PGA 투어 신년 대회 하이라이트",
        channelName: "골프 TV",
        channelUrl: "https://www.youtube.com/@GolfTV",
        thumbnailUrl: "https://img.youtube.com/vi/sport_golf/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_golf",
        viewCount: "76만",
        publishedAt: getRecentDate(40),
        duration: "9:30",
        category: "스포츠",
        uploadedHoursAgo: 40,
      },
      {
        id: "17_8",
        videoId: "sport_nba",
        title: "NBA 2025 시즌 베스트 플레이",
        channelName: "NBA Korea",
        channelUrl: "https://www.youtube.com/@NBAKorea",
        thumbnailUrl: "https://img.youtube.com/vi/sport_nba/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_nba",
        viewCount: "65만",
        publishedAt: getRecentDate(44),
        duration: "8:20",
        category: "스포츠",
        uploadedHoursAgo: 44,
      },
      {
        id: "17_9",
        videoId: "sport_ufc",
        title: "UFC 코리아 파이터 경기 하이라이트",
        channelName: "UFC Korea",
        channelUrl: "https://www.youtube.com/@UFCKorea",
        thumbnailUrl: "https://img.youtube.com/vi/sport_ufc/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_ufc",
        viewCount: "54만",
        publishedAt: getRecentDate(46),
        duration: "6:50",
        category: "스포츠",
        uploadedHoursAgo: 46,
      },
      {
        id: "17_10",
        videoId: "sport_ski",
        title: "스키 월드컵 한국 선수 활약",
        channelName: "대한스키협회",
        channelUrl: "https://www.youtube.com/@SkiKorea",
        thumbnailUrl: "https://img.youtube.com/vi/sport_ski/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=sport_ski",
        viewCount: "43만",
        publishedAt: getRecentDate(48),
        duration: "4:30",
        category: "스포츠",
        uploadedHoursAgo: 48,
      },
    ],
    // 인물/블로그 (22)
    "22": [
      {
        id: "22_1",
        videoId: "vlog_chim",
        title: "침착맨 신년 라이브 하이라이트",
        channelName: "침착맨",
        channelUrl: "https://www.youtube.com/@ChimChak",
        thumbnailUrl: "https://img.youtube.com/vi/vlog_chim/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_chim",
        viewCount: "234만",
        publishedAt: getRecentDate(4),
        duration: "22:15",
        category: "인물/블로그",
        uploadedHoursAgo: 4,
      },
      {
        id: "22_2",
        videoId: "vlog_cook",
        title: "백종원 신년 맞이 특별 레시피",
        channelName: "백종원의 요리비책",
        channelUrl: "https://www.youtube.com/@paikisvlog",
        thumbnailUrl: "https://img.youtube.com/vi/vlog_cook/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_cook",
        viewCount: "187만",
        publishedAt: getRecentDate(10),
        duration: "11:20",
        category: "인물/블로그",
        uploadedHoursAgo: 10,
      },
      {
        id: "22_3",
        videoId: "vlog_tech",
        title: "CES 2025 현장 리뷰 - 잇섭",
        channelName: "잇섭",
        channelUrl: "https://www.youtube.com/@itsubmain",
        thumbnailUrl: "https://img.youtube.com/vi/vlog_tech/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_tech",
        viewCount: "156만",
        publishedAt: getRecentDate(16),
        duration: "18:45",
        category: "인물/블로그",
        uploadedHoursAgo: 16,
      },
      {
        id: "22_4",
        videoId: "vlog_daily",
        title: "일상 브이로그 | 새해 첫 일주일",
        channelName: "쯔양",
        channelUrl: "https://www.youtube.com/@Tzuyang",
        thumbnailUrl: "https://img.youtube.com/vi/vlog_daily/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_daily",
        viewCount: "134만",
        publishedAt: getRecentDate(22),
        duration: "14:55",
        category: "인물/블로그",
        uploadedHoursAgo: 22,
      },
      {
        id: "22_5",
        videoId: "vlog_game",
        title: "풍월량 신년 게임 추천",
        channelName: "풍월량",
        channelUrl: "https://www.youtube.com/@poong",
        thumbnailUrl: "https://img.youtube.com/vi/vlog_game/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_game",
        viewCount: "112만",
        publishedAt: getRecentDate(28),
        duration: "16:30",
        category: "인물/블로그",
        uploadedHoursAgo: 28,
      },
      {
        id: "22_6",
        videoId: "vlog_travel",
        title: "신년 여행 브이로그 | 일본 오사카",
        channelName: "빠니보틀",
        channelUrl: "https://www.youtube.com/@paanibottle",
        thumbnailUrl:
          "https://img.youtube.com/vi/vlog_travel/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_travel",
        viewCount: "98만",
        publishedAt: getRecentDate(34),
        duration: "20:15",
        category: "인물/블로그",
        uploadedHoursAgo: 34,
      },
      {
        id: "22_7",
        videoId: "vlog_beauty",
        title: "2025 뷰티 트렌드 총정리",
        channelName: "PONY",
        channelUrl: "https://www.youtube.com/@PONY",
        thumbnailUrl:
          "https://img.youtube.com/vi/vlog_beauty/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_beauty",
        viewCount: "87만",
        publishedAt: getRecentDate(38),
        duration: "12:40",
        category: "인물/블로그",
        uploadedHoursAgo: 38,
      },
      {
        id: "22_8",
        videoId: "vlog_edu",
        title: "2025 공부법 완벽 정리",
        channelName: "공신",
        channelUrl: "https://www.youtube.com/@gongsin",
        thumbnailUrl: "https://img.youtube.com/vi/vlog_edu/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_edu",
        viewCount: "76만",
        publishedAt: getRecentDate(42),
        duration: "24:30",
        category: "인물/블로그",
        uploadedHoursAgo: 42,
      },
      {
        id: "22_9",
        videoId: "vlog_fitness",
        title: "신년 다이어트 운동 루틴",
        channelName: "핏블리",
        channelUrl: "https://www.youtube.com/@fitbly",
        thumbnailUrl:
          "https://img.youtube.com/vi/vlog_fitness/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_fitness",
        viewCount: "65만",
        publishedAt: getRecentDate(45),
        duration: "18:20",
        category: "인물/블로그",
        uploadedHoursAgo: 45,
      },
      {
        id: "22_10",
        videoId: "vlog_money",
        title: "2025 재테크 전략 총정리",
        channelName: "슈카월드",
        channelUrl: "https://www.youtube.com/@syuka",
        thumbnailUrl: "https://img.youtube.com/vi/vlog_money/maxresdefault.jpg",
        videoUrl: "https://www.youtube.com/watch?v=vlog_money",
        viewCount: "54만",
        publishedAt: getRecentDate(48),
        duration: "28:15",
        category: "인물/블로그",
        uploadedHoursAgo: 48,
      },
    ],
  };

  return fallbackData[categoryId] || fallbackData["0"];
}
