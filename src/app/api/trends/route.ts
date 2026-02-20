import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

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

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Upgrade-Insecure-Requests": "1",
};

// ═══════════════════════════════════════════════════════════════
// SBS 뉴스 RSS 섹션 ID (연예, 스포츠, 경제, 사회, 정치)
// 2026-02 기준: 연예=14(방송/연예), 스포츠=09
// ═══════════════════════════════════════════════════════════════
const SBS_SECTIONS: Record<string, { sectionId: string; source: string }> = {
  연예: { sectionId: "14", source: "SBS 연예" },
  스포츠: { sectionId: "09", source: "SBS 스포츠" },
  경제: { sectionId: "02", source: "SBS 경제" },
  사회: { sectionId: "03", source: "SBS 사회" },
  정치: { sectionId: "01", source: "SBS 정치" },
};

import { MOCK_TRENDS } from "./mockData";

export async function GET(
  request: Request,
): Promise<NextResponse<TrendResponse>> {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category") || "전체";
  const errors: string[] = [];

  try {
    // 모든 크롤러 병렬 실행
    const sbsPromises = Object.entries(SBS_SECTIONS).map(([cat, info]) =>
      crawlSbsRss(cat, info.sectionId, info.source).catch((e) => {
        const msg = `[SBS ${cat}] Failed: ${e.message}`;
        console.error(msg);
        errors.push(msg);
        return [];
      }),
    );

    const [sbsResults, itItems, gameItems, googleTrends] = await Promise.all([
      Promise.all(sbsPromises),
      crawlAITimesRSS().catch((e) => {
        const msg = `[AI타임스] Failed: ${e.message}`;
        console.error(msg);
        errors.push(msg);
        return [];
      }),
      crawlGameNews().catch((e) => {
        const msg = `[게임] Failed: ${e.message}`;
        console.error(msg);
        errors.push(msg);
        return [];
      }),
      fetchGoogleTrendsKR().catch((e) => {
        const msg = `[Google] Failed: ${e.message}`;
        console.error(msg);
        errors.push(msg);
        return [];
      }),
    ]);

    // 모든 결과 병합
    let allTrends = sbsResults.flat();
    allTrends = [...allTrends, ...itItems, ...gameItems];

    // Google Trends에서 기타 카테고리만 추가
    const etcTrends = googleTrends.filter((t) => t.category === "기타");
    allTrends = [...allTrends, ...etcTrends.slice(0, 5)];

    // 성공한 소스 목록
    const successSources: string[] = [];
    for (const [, info] of Object.entries(SBS_SECTIONS)) {
      if (allTrends.some((t) => t.source === info.source))
        successSources.push(info.source);
    }
    if (itItems.length > 0) successSources.push("AI타임스");
    if (gameItems.length > 0) {
      if (gameItems.some((t) => t.source === "게임메카"))
        successSources.push("게임메카");
      if (gameItems.some((t) => t.source === "인벤"))
        successSources.push("인벤");
    }
    if (etcTrends.length > 0) successSources.push("구글 트렌드");

    // Fallback: 데이터가 하나도 없으면 모의 데이터 사용 및 에러 정보 포함
    if (allTrends.length === 0) {
      console.warn("No trends found, using mock data. Errors:", errors);
      // Front-end requires success: true to display data. 
      // We return success: true but include error field for debugging.
      return NextResponse.json({
        success: true,
        trends: MOCK_TRENDS,
        crawledAt: new Date().toISOString(),
        sources: ["시스템 알림(데이터 수집 실패)"],
        filter: {
          country: "대한민국",
          timeRange: "실시간",
          category: category,
        },
        categories: CATEGORIES,
        error: `All sources failed. Errors: ${errors.join(", ")}`,
      });
    }

    // 카테고리 필터링
    let filteredTrends = allTrends;
    if (category !== "전체") {
      filteredTrends = allTrends.filter((t) => t.category === category);
    }

    // 순위 재정렬
    const rankedTrends = filteredTrends.map((trend, index) => ({
      ...trend,
      rank: index + 1,
    }));

    return NextResponse.json({
      success: true,
      trends: rankedTrends,
      crawledAt: new Date().toISOString(),
      sources: successSources,
      filter: {
        country: "대한민국",
        timeRange: "실시간",
        category: category,
      },
      categories: CATEGORIES,
      error: errors.length > 0 ? `Partial failures: ${errors.join(", ")}` : undefined,
    });
  } catch (error) {
    console.error("Trend crawling fatal error:", error);
    // Fatal error but we still want to show mock data on frontend
    return NextResponse.json(
      {
        success: true,
        error: error instanceof Error ? error.message : "트렌드 수집 치명적 오류",
        trends: MOCK_TRENDS,
        crawledAt: new Date().toISOString(),
        sources: ["시스템 알림(오류 발생)"],
        filter: {
          country: "대한민국",
          timeRange: "실시간",
          category: category,
        },
        categories: CATEGORIES,
      },
      { status: 200 },
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// 공통 유틸리티
// ═══════════════════════════════════════════════════════════════

async function safeFetch(
  url: string,
  timeoutMs: number = 8000,
  referer?: string,
): Promise<string> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const headers: Record<string, string> = { ...FETCH_HEADERS };
    if (referer) {
      headers.Referer = referer;
    }

    const response = await fetch(url, {
      headers,
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.text();
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ═══════════════════════════════════════════════════════════════
// 1) SBS 뉴스 RSS — 연예, 스포츠, 경제, 사회, 정치
// ═══════════════════════════════════════════════════════════════

async function crawlSbsRss(
  category: string,
  sectionId: string,
  sourceName: string,
): Promise<TrendItem[]> {
  try {
    const url = `https://news.sbs.co.kr/news/SectionRssFeed.do?sectionId=${sectionId}`;
    const xml = await safeFetch(url, 5000, "https://news.sbs.co.kr/");
    return parseRssItems(xml, category, sourceName, 5);
  } catch (error) {
    console.error(`[${category}] SBS RSS 실패:`, error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 2) AI타임스 RSS — IT/AI 카테고리
// ═══════════════════════════════════════════════════════════════

async function crawlAITimesRSS(): Promise<TrendItem[]> {
  try {
    const xml = await safeFetch(
      "https://cdn.aitimes.com/rss/gn_rss_allArticle.xml",
      5000,
    );
    return parseRssItems(xml, "IT", "AI타임스", 5);
  } catch (error) {
    console.error("[IT] AI타임스 RSS 실패:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 3) 게임 뉴스 — 게임메카 + 인벤 HTML 스크래핑
// ═══════════════════════════════════════════════════════════════

async function crawlGameNews(): Promise<TrendItem[]> {
  const [gamemecaItems, invenItems] = await Promise.all([
    crawlGamemeca(),
    crawlInven(),
  ]);

  // 게임메카 3건 + 인벤 2건 (또는 가용 수에 따라 조합)
  const combined: TrendItem[] = [];

  // 게임메카 우선 3건
  for (const item of gamemecaItems) {
    if (combined.length >= 3) break;
    combined.push(item);
  }

  // 인벤 보충 2건
  for (const item of invenItems) {
    if (combined.length >= 5) break;
    combined.push(item);
  }

  // 아직 부족하면 나머지로 채우기
  if (combined.length < 5) {
    for (const item of [...gamemecaItems, ...invenItems]) {
      if (combined.length >= 5) break;
      if (!combined.some((c) => c.keyword === item.keyword)) {
        combined.push(item);
      }
    }
  }

  console.log(
    `[게임] 총 ${combined.length}건 (게임메카 ${gamemecaItems.length}건, 인벤 ${invenItems.length}건)`,
  );
  return combined;
}

async function crawlGamemeca(): Promise<TrendItem[]> {
  try {
    const html = await safeFetch("https://www.gamemeca.com/", 8000, "https://www.gamemeca.com/");
    const items: TrendItem[] = [];
    const seen = new Set<string>();

    // 게임메카 기사 패턴: <a href="/view.php?gid=NNNN">title</a>
    const pattern =
      /<a[^>]*href="(\/view\.php\?gid=\d+)"[^>]*>([^<]{5,})<\/a>/gi;

    for (const match of html.matchAll(pattern)) {
      const title = decodeHtmlEntities(match[2]).trim();
      if (title.length < 5 || title.length > 150) continue;

      const normalizedTitle = title.toLowerCase();
      if (seen.has(normalizedTitle)) continue;
      seen.add(normalizedTitle);

      items.push({
        rank: items.length + 1,
        keyword: title,
        category: "게임",
        link: `https://www.gamemeca.com${match[1]}`,
        source: "게임메카",
      });

      if (items.length >= 10) break;
    }

    console.log(`[게임] 게임메카 크롤링: ${items.length}건`);
    return items;
  } catch (error) {
    console.error("[게임] 게임메카 실패:", error);
    return [];
  }
}

async function crawlInven(): Promise<TrendItem[]> {
  try {
    const html = await safeFetch("https://www.inven.co.kr/", 8000, "https://www.inven.co.kr/");
    const items: TrendItem[] = [];
    const seen = new Set<string>();

    // 인벤 메인 페이지 — webzine/news 링크 + 내부 텍스트 추출
    const pattern =
      /<a[^>]*href="(https?:\/\/www\.inven\.co\.kr\/webzine\/news\/[^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

    for (const match of html.matchAll(pattern)) {
      // HTML 태그 제거 후 텍스트만 추출
      const rawText = match[2].replace(/<[^>]+>/g, "").trim();
      const title = decodeHtmlEntities(rawText).trim();

      if (title.length < 8 || title.length > 150) continue;
      // "더보기", navigation links 제외
      if (/더보기|뉴스$|^[가-힣]{2,4}$/.test(title)) continue;

      const normalizedTitle = title.toLowerCase();
      if (seen.has(normalizedTitle)) continue;
      seen.add(normalizedTitle);

      items.push({
        rank: items.length + 1,
        keyword: title,
        category: "게임",
        link: match[1],
        source: "인벤",
      });

      if (items.length >= 10) break;
    }

    // 폴백: span.title 패턴 (메인 페이지 뉴스 목록)
    if (items.length < 3) {
      const titlePattern =
        /<span class="title(?:-sm)?">([^<]{8,})<\/span>/gi;
      for (const match of html.matchAll(titlePattern)) {
        const title = decodeHtmlEntities(match[1]).trim();
        const normalizedTitle = title.toLowerCase();
        if (seen.has(normalizedTitle)) continue;
        seen.add(normalizedTitle);

        items.push({
          rank: items.length + 1,
          keyword: title,
          category: "게임",
          link: `https://www.inven.co.kr/webzine/news/`,
          source: "인벤",
        });

        if (items.length >= 10) break;
      }
    }

    console.log(`[게임] 인벤 크롤링: ${items.length}건`);
    return items;
  } catch (error) {
    console.error("[게임] 인벤 실패:", error);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════
// 4) Google Trends RSS — 기타 카테고리 보완
// ═══════════════════════════════════════════════════════════════

async function fetchGoogleTrendsKR(): Promise<TrendItem[]> {
  try {
    const xml = await safeFetch(
      "https://trends.google.co.kr/trending/rss?geo=KR",
      5000,
    );
    return parseGoogleTrendsRSS(xml);
  } catch (error) {
    console.error("Google Trends error:", error);
    return [];
  }
}

function parseGoogleTrendsRSS(xml: string): TrendItem[] {
  const trends: TrendItem[] = [];

  try {
    const itemPattern = /<item>([\s\S]*?)<\/item>/gi;
    const items = [...xml.matchAll(itemPattern)];
    const seen = new Set<string>();
    const now = new Date();

    for (const itemMatch of items) {
      const content = itemMatch[1];

      const titleMatch = content.match(/<title>([^<]+)<\/title>/i);
      if (!titleMatch) continue;

      const keyword = decodeHtmlEntities(titleMatch[1].trim());
      if (seen.has(keyword.toLowerCase()) || keyword.length < 2) continue;
      if (keyword.includes("Daily Search Trends")) continue;
      seen.add(keyword.toLowerCase());

      const pubDateMatch = content.match(/<pubDate>([^<]+)<\/pubDate>/i);
      let publishedAt: string | undefined;
      if (pubDateMatch) {
        const pubDate = new Date(pubDateMatch[1]);
        const hoursDiff =
          (now.getTime() - pubDate.getTime()) / (1000 * 60 * 60);
        if (hoursDiff > 48) continue;
        publishedAt = pubDate.toISOString();
      }

      const trafficMatch = content.match(
        /<ht:approx_traffic>([^<]+)<\/ht:approx_traffic>/i,
      );
      const trafficVolume = trafficMatch ? trafficMatch[1] : undefined;

      // 관련 뉴스 제목으로 카테고리 판별
      const newsItemTitles: string[] = [];
      const newsTitlePattern =
        /<ht:news_item_title>([^<]+)<\/ht:news_item_title>/gi;
      for (const m of content.matchAll(newsTitlePattern)) {
        newsItemTitles.push(decodeHtmlEntities(m[1]));
      }

      const classificationText = [keyword, ...newsItemTitles].join(" ");

      trends.push({
        rank: trends.length + 1,
        keyword,
        category: guessCategory(classificationText),
        link: `https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(keyword)}`,
        source: "구글 트렌드",
        publishedAt,
        trafficVolume,
      });
    }
  } catch (error) {
    console.error("Google RSS parsing error:", error);
  }

  return trends;
}

// ═══════════════════════════════════════════════════════════════
// 공통 RSS 파서 (SBS, AI타임스 등)
// ═══════════════════════════════════════════════════════════════

function parseRssItems(
  xml: string,
  category: string,
  sourceName: string,
  maxItems: number,
): TrendItem[] {
  const items: TrendItem[] = [];

  try {
    const itemPattern = /<item>([\s\S]*?)<\/item>/gi;

    for (const match of xml.matchAll(itemPattern)) {
      if (items.length >= maxItems) break;

      const content = match[1];

      // 제목 추출 (CDATA 또는 일반)
      const titleMatch =
        content.match(
          /<title>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/title>/i,
        ) || content.match(/<title>([^<]+)<\/title>/i);

      // 링크 추출
      const linkMatch =
        content.match(
          /<link>\s*<!\[CDATA\[([\s\S]*?)\]\]>\s*<\/link>/i,
        ) || content.match(/<link>([^<]+)<\/link>/i);

      if (!titleMatch) continue;

      const title = decodeHtmlEntities(titleMatch[1]).trim();
      if (title.length < 5 || title.length > 150) continue;
      // Skip feed-level titles
      if (/^SBS|^RSS|^뉴스$/i.test(title)) continue;

      const link = linkMatch
        ? decodeHtmlEntities(linkMatch[1]).trim()
        : `https://search.naver.com/search.naver?query=${encodeURIComponent(title)}`;

      // pubDate 추출
      const pubDateMatch = content.match(/<pubDate>([^<]+)<\/pubDate>/i);
      let publishedAt: string | undefined;
      if (pubDateMatch) {
        try {
          publishedAt = new Date(pubDateMatch[1]).toISOString();
        } catch {
          // ignore invalid dates
        }
      }

      items.push({
        rank: items.length + 1,
        keyword: title,
        category,
        link,
        source: sourceName,
        publishedAt,
      });
    }
  } catch (error) {
    console.error(`[${category}] RSS 파싱 오류:`, error);
  }

  console.log(
    `[${category}] RSS 크롤링 결과: ${items.length}건 (${sourceName})`,
  );
  return items;
}

// ═══════════════════════════════════════════════════════════════
// 카테고리 추측 (Google Trends용)
// ═══════════════════════════════════════════════════════════════

function guessCategory(text: string): string {
  const categoryPatterns: Record<string, RegExp> = {
    연예: /아이유|BTS|블랙핑크|뉴진스|에스파|아이브|배우|드라마|영화|컴백|앨범|콘서트|연예인|가수|아이돌|걸그룹|보이그룹|넷플릭스|디즈니|티빙|예능|방송|MBC|KBS|SBS|JTBC|tvN|시청률|레드벨벳|르세라핌|엔시티|엑소|방탄소년단|소녀시대|임영웅|트로트|마동석|공유|현빈|송중기|전지현|김수현|장원영|안유진|민지|하니|제니|지수|로제|리사/i,
    스포츠:
      /손흥민|야구|축구|농구|배구|올림픽|월드컵|리그|경기|선수|감독|우승|골|홈런|MVP|KBO|EPL|NBA|토트넘|맨유|레알|바르셀로나|프리미어리그|K리그|프로야구|안세영|류현진|오타니|메시|호날두|리버풀|첼시|아스날|골프|UFC/i,
    경제: /주식|코인|비트코인|부동산|금리|환율|투자|증시|코스피|코스닥|삼성전자|현대차|경제|물가|달러|나스닥|테슬라|엔비디아|반도체|GDP|취업|은행|금융|대출|한국은행|유가|관세|ETF/i,
    정치: /대통령|국회|정부|여당|야당|선거|법안|정책|장관|의원|탄핵|윤석열|이재명|한동훈|트럼프|바이든|김건희|조국|민주당|국민의힘|지지율|여론조사|외교|국방|북한|헌법|특검/i,
    사회: /사건|사고|경찰|검찰|법원|재판|범죄|피해|논란|시위|날씨|지진|태풍|폭설|한파|미세먼지|코로나|화재|홍수|산불|음주운전|마약|인권|복지|의료|병원|교육|수능|저출산|고령화|환경|기후변화|실종/i,
    IT: /AI|인공지능|챗GPT|애플|구글|아이폰|갤럭시|자율주행|로봇|메타버스|ChatGPT|클로드|GPT|OpenAI|딥시크|Gemini|DeepSeek|Claude|LLM|머신러닝|딥러닝|클라우드|AWS|5G|네이버|카카오|스마트폰|CPU|GPU|해킹|보안|블록체인/i,
    게임: /게임|롤|배그|발로란트|스팀|플스|닌텐도|엑박|e스포츠|LOL|롤드컵|T1|페이커|오버워치|메이플|던파|로스트아크|원신|포트나이트|GTA|엘든링|젤다|포켓몬|디아블로|리니지|PS5|Xbox|Switch|모바일게임/i,
  };

  for (const [cat, pattern] of Object.entries(categoryPatterns)) {
    if (pattern.test(text)) {
      return cat;
    }
  }

  return "기타";
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/<b>/gi, "")
    .replace(/<\/b>/gi, "")
    .replace(/\+/g, " ")
    .trim();
}
