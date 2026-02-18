import { NextResponse } from "next/server";

interface NewsItem {
    title: string;
    description: string;
    link: string;
    pubDate?: string;
    source?: string;
}

interface AnalysisResponse {
    success: boolean;
    keyword: string;
    category: string;
    news: NewsItem[];
    relatedSearches: string[];
    crawledAt: string;
    error?: string;
}

export async function GET(
    request: Request,
): Promise<NextResponse<AnalysisResponse>> {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get("keyword") || "";
    const category = searchParams.get("category") || "기타";

    if (!keyword) {
        return NextResponse.json(
            {
                success: false,
                keyword: "",
                category,
                news: [],
                relatedSearches: [],
                crawledAt: new Date().toISOString(),
                error: "키워드가 필요합니다",
            },
            { status: 400 },
        );
    }

    try {
        // Naver 검색 결과에서 관련 뉴스 수집
        const news = await fetchNaverNews(keyword);
        // 연관 검색어 추출
        const relatedSearches = await fetchRelatedSearches(keyword);

        return NextResponse.json({
            success: true,
            keyword,
            category,
            news,
            relatedSearches,
            crawledAt: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Analysis crawling error:", error);
        return NextResponse.json(
            {
                success: false,
                keyword,
                category,
                news: [],
                relatedSearches: [],
                crawledAt: new Date().toISOString(),
                error: error instanceof Error ? error.message : "분석 데이터 수집 실패",
            },
            { status: 500 },
        );
    }
}

// Naver 뉴스 검색 결과 크롤링
async function fetchNaverNews(keyword: string): Promise<NewsItem[]> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000);

        const url = `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(keyword)}&sort=1&sm=tab_smr&nso=so:dd,p:1d`;
        const response = await fetch(url, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "text/html,application/xhtml+xml",
                "Accept-Language": "ko-KR,ko;q=0.9",
            },
            cache: "no-store",
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            console.warn("Naver news response not ok:", response.status);
            return generateFallbackNews(keyword);
        }

        const html = await response.text();
        return parseNaverNewsHtml(html, keyword);
    } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
            console.warn("Naver news fetch timed out");
        } else {
            console.error("Naver news fetch error:", error);
        }
        return generateFallbackNews(keyword);
    }
}

// Naver 뉴스 HTML 파싱
function parseNaverNewsHtml(html: string, keyword: string): NewsItem[] {
    const news: NewsItem[] = [];

    try {
        // 뉴스 제목과 링크 추출 (news_tit 클래스)
        const titlePattern =
            /class="news_tit"[^>]*href="([^"]+)"[^>]*title="([^"]+)"/gi;
        for (const match of html.matchAll(titlePattern)) {
            if (news.length >= 8) break;
            news.push({
                title: decodeHtmlEntities(match[2]),
                description: "",
                link: match[1],
                source: "네이버 뉴스",
            });
        }

        // 뉴스 설명 추출 (news_dsc 클래스)
        const descPattern = /class="news_dsc"[^>]*>[\s\S]*?<a[^>]*>([\s\S]*?)<\/a>/gi;
        let descIdx = 0;
        for (const match of html.matchAll(descPattern)) {
            if (descIdx >= news.length) break;
            news[descIdx].description = decodeHtmlEntities(
                match[1].replace(/<[^>]+>/g, "").trim(),
            ).substring(0, 200);
            descIdx++;
        }

        // 언론사 추출
        const pressPattern = /class="info press"[^>]*>([^<]+)</gi;
        let pressIdx = 0;
        for (const match of html.matchAll(pressPattern)) {
            if (pressIdx >= news.length) break;
            news[pressIdx].source = decodeHtmlEntities(match[1].trim());
            pressIdx++;
        }
    } catch (error) {
        console.error("Naver news HTML parsing error:", error);
    }

    if (news.length === 0) {
        return generateFallbackNews(keyword);
    }

    return news;
}

// 연관 검색어 추출
async function fetchRelatedSearches(keyword: string): Promise<string[]> {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const url = `https://ac.search.naver.com/nx/ac?q=${encodeURIComponent(keyword)}&con=1&frm=nv&ans=2&r_format=json&r_enc=UTF-8&r_unicode=0&t_koreng=1&run=2&rev=4&q_enc=UTF-8`;
        const response = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            },
            cache: "no-store",
            signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) return [];

        const data = await response.json();
        // Naver autocomplete API returns items array
        if (data?.items && Array.isArray(data.items)) {
            const suggestions: string[] = [];
            for (const group of data.items) {
                if (Array.isArray(group)) {
                    for (const item of group) {
                        if (Array.isArray(item) && item[0] && typeof item[0] === "string") {
                            suggestions.push(item[0]);
                        }
                    }
                }
            }
            return suggestions.slice(0, 10);
        }
        return [];
    } catch {
        return [];
    }
}

// 폴백 뉴스 데이터
function generateFallbackNews(keyword: string): NewsItem[] {
    return [
        {
            title: `'${keyword}' 관련 최신 뉴스`,
            description: `${keyword}에 대한 최신 동향과 분석입니다.`,
            link: `https://search.naver.com/search.naver?where=news&query=${encodeURIComponent(keyword)}`,
            source: "네이버 뉴스",
        },
        {
            title: `${keyword}, 실시간 화제의 중심`,
            description: `실시간 검색에서 ${keyword}가 화제입니다. 자세한 내용을 확인하세요.`,
            link: `https://search.naver.com/search.naver?where=nexearch&query=${encodeURIComponent(keyword)}`,
            source: "네이버 검색",
        },
    ];
}

function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, " ")
        .replace(/&#(\d+);/g, (_, code) =>
            String.fromCharCode(parseInt(code, 10)),
        )
        .replace(/<b>/gi, "")
        .replace(/<\/b>/gi, "")
        .trim();
}
