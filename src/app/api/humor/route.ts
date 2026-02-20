import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const maxDuration = 30;

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

export async function GET() {
  try {
    // 오늘의유머 베스트 게시판 크롤링
    const response = await fetch(
      "https://www.todayhumor.co.kr/board/list.php?table=humorbest",
      {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept-Language": "ko-KR,ko;q=0.9,en;q=0.8",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          Referer: "https://www.todayhumor.co.kr/",
        },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }

    const html = await response.text();

    // HTML 파싱하여 게시글 목록 추출
    const posts = parseHumorBestPosts(html);

    return NextResponse.json({
      success: true,
      posts: posts.slice(0, 10), // 상위 10개만
      crawledAt: new Date().toISOString(),
      source: "todayhumor",
    });
  } catch (error) {
    console.error("Humor crawling error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "크롤링 실패",
        posts: [],
      },
      { status: 500 },
    );
  }
}

function parseHumorBestPosts(html: string): HumorPost[] {
  const posts: HumorPost[] = [];

  try {
    // tbody 내의 게시글 행들을 찾기
    // 오늘의유머 목록 테이블 구조: <table class="table_list"> 안의 <tr>

    // 방법 1: view.php 링크가 포함된 행 찾기
    const linkPattern =
      /href="[^"]*view\.php\?[^"]*no=(\d+)[^"]*"[^>]*>([^<]+)<\/a>/gi;
    const matches = [...html.matchAll(linkPattern)];

    // 중복 제거를 위한 Set
    const seenIds = new Set<string>();

    for (const match of matches) {
      const postId = match[1];
      let title = match[2].trim();

      // 이미 처리한 게시글이면 스킵
      if (seenIds.has(postId)) continue;

      // 제목 유효성 검사 (너무 짧거나 특수 텍스트 제외)
      if (title.length < 2) continue;
      if (title === "베스트" || title === "댓글" || title.startsWith("["))
        continue;

      // HTML 엔티티 디코딩
      title = decodeHtmlEntities(title);

      // 해당 게시글 행의 데이터 추출 시도
      // 게시글 ID 주변 컨텍스트에서 추가 정보 추출
      const postContext = extractPostContext(html, postId);

      seenIds.add(postId);

      posts.push({
        id: postId,
        title,
        url: `https://www.todayhumor.co.kr/board/view.php?table=humorbest&no=${postId}`,
        author: postContext.author || "익명",
        date: postContext.date || "",
        viewCount: postContext.viewCount || 0,
        recommendCount: postContext.recommendCount || 0,
        commentCount: postContext.commentCount || 0,
      });

      // 10개만 수집
      if (posts.length >= 10) break;
    }
  } catch (parseError) {
    console.error("HTML parsing error:", parseError);
  }

  return posts;
}

function extractPostContext(
  html: string,
  postId: string,
): {
  author: string;
  date: string;
  viewCount: number;
  recommendCount: number;
  commentCount: number;
} {
  const result = {
    author: "",
    date: "",
    viewCount: 0,
    recommendCount: 0,
    commentCount: 0,
  };

  try {
    // 게시글 ID가 포함된 행 찾기 (약 2000자 범위)
    const idIndex = html.indexOf(`no=${postId}`);
    if (idIndex === -1) return result;

    // 해당 행의 시작과 끝 찾기
    const rowStart = html.lastIndexOf("<tr", idIndex);
    const rowEnd = html.indexOf("</tr>", idIndex);

    if (rowStart === -1 || rowEnd === -1) return result;

    const rowHtml = html.substring(rowStart, rowEnd + 5);

    // 작성자 추출 - member_info 링크에서
    const authorMatch = rowHtml.match(
      /member_info\.php\?[^"]*"[^>]*>([^<]+)<\/a>/i,
    );
    if (authorMatch) {
      result.author = decodeHtmlEntities(authorMatch[1].trim());
    }

    // 날짜 추출 - date 클래스가 있는 td에서
    const dateMatch = rowHtml.match(
      /<td[^>]*class="[^"]*date[^"]*"[^>]*>([^<]+)<\/td>/i,
    );
    if (dateMatch) {
      result.date = dateMatch[1].trim();
    }

    // 조회수 추출 - hits 클래스가 있는 td에서
    const hitsMatch = rowHtml.match(
      /<td[^>]*class="[^"]*hits[^"]*"[^>]*>(\d+)<\/td>/i,
    );
    if (hitsMatch) {
      result.viewCount = parseInt(hitsMatch[1], 10);
    }

    // 추천수 추출 - oknok 클래스가 있는 td에서
    const oknokMatch = rowHtml.match(
      /<td[^>]*class="[^"]*oknok[^"]*"[^>]*>(\d+)<\/td>/i,
    );
    if (oknokMatch) {
      result.recommendCount = parseInt(oknokMatch[1], 10);
    }

    // 댓글수 추출 - list_memo_count 클래스의 span에서
    const memoMatch = rowHtml.match(
      /<span[^>]*class="[^"]*list_memo_count[^"]*"[^>]*>\[?(\d+)\]?<\/span>/i,
    );
    if (memoMatch) {
      result.commentCount = parseInt(memoMatch[1], 10);
    }
  } catch (error) {
    console.error("Context extraction error:", error);
  }

  return result;
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
