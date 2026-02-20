# Deep Verification Analysis: TrendYummy Crawlers
**Generated At:** 2025-02-17
**Category:** System Verification (TrendYummy)

## 1. System Crawler Health

### A. Trends Crawler (`/api/trends`)
*   **Status:** PASS (HTTP 200, count=40)
*   **Mechanism:** Parallel fetches from multiple sources:
    *   **SBS News (RSS):** Categories: Entertainment, Sports, Economy, Social, Politics.
    *   **AI Times (RSS):** Category: IT.
    *   **GameMeca & Inven (HTML Scraping):** Category: Game.
    *   **Google Trends (RSS):** Category: Others (Fallback).
*   **Health Check:** Currently returns mock data (`MOCK_TRENDS`) if all sources fail. The health check endpoint `/api/trends` returns HTTP 200 even on failure, with `sources: ["시스템 알림(데이터 수집 실패)"]`.
    *   **Finding:** The HTTP 200 status is misleading. The system is resilient (frontend doesn't crash), but potentially stale/broken.

### B. YouTube Crawler (`/api/youtube`)
*   **Status:** PASS (HTTP 200, count=11)
*   **Mechanism:** Tiered fallback:
    1.  **YouTube Data API v3:** Primary (requires `YOUTUBE_API_KEY`).
    2.  **RSS Feed:** Secondary (`https://www.youtube.com/feeds/videos.xml?chart=MOST_POPULAR&regionCode=KR`).
    3.  **Static Fallback:** Hardcoded list (e.g., NewJeans 'ETA').
*   **Health Check:** Returns HTTP 200 even if falling back to static data.
    *   **Finding:** If API quota is exhausted and RSS fails, users see old data without indication.

### C. Humor Crawler (`/api/humor`)
*   **Status:** PASS (HTTP 200, count=10)
*   **Mechanism:** HTML Scraping of `todayhumor.co.kr` (Humor Best board).
    *   Uses Regex (`matchAll`) to parse HTML structure (`table_list`, `member_info`).
*   **Health Check:** Returns HTTP 200 if scraping succeeds. Returns HTTP 500 on catastrophic failure, or empty list on soft failure.
    *   **Finding:** Highly fragile due to reliance on specific HTML structure.

---

## 2. Reliability Risks & Mitigations

### Critical Risks
1.  **Game/Humor Scraping Fragility:**
    *   **Risk:** `crawlGamemeca`, `crawlInven`, and Humor crawler use Regex on HTML. Any layout change breaks this immediately.
    *   **Mitigation:** Switch to official APIs where possible, or use headless browsers (Playwright/Puppeteer) for more robust selection. Implement structural validation.

2.  **YouTube API Quota:**
    *   **Risk:** YouTube Data API has strict daily quotas. High traffic will exhaust it quickly.
    *   **Mitigation:** Implement aggressive caching (Redis/Vercel KV) for API responses (e.g., 1-hour TTL). Use RSS as a primary source for "Popular" if fine-grained categorization isn't critical.

3.  **Silent Failures (Mock Data):**
    *   **Risk:** Trends API returns mock data with HTTP 200. Monitoring tools checking only HTTP status will miss outages.
    *   **Mitigation:** Update health checks to inspect response body for "success" flags or specific error strings ("시스템 알림").

### Recommended Mitigations
*   **Unified Error Reporting:** Log failures to a centralized monitoring service (Sentry, Datadog) instead of just `console.error`.
*   **Circuit Breakers:** If a source fails consecutively, stop trying for a period to prevent cascading failures or IP bans.
*   **Proxy Rotation:** For scrapers (Humor, Game), use rotating proxies to avoid IP blocking.

---

## 3. Operator Checklist (Production Monitoring)

### Daily Checks
- [ ] **API Status:** Verify `/api/trends`, `/api/youtube`, `/api/humor` return HTTP 200.
- [ ] **Data Freshness:** Check `crawledAt` timestamp in responses. Ensure it's within the last hour.
- [ ] **Source Validity:**
    -   **Trends:** Ensure `sources` array does NOT contain "시스템 알림" (System Notification).
    -   **YouTube:** Ensure video titles are not static fallback data (e.g., check for recent upload dates).
- [ ] **Error Logs:** specific patterns to watch for:
    -   `Trend crawling fatal error`
    -   `YouTube API error`
    -   `Humor crawling error`

### Emergency Response
1.  **Trends Failure:**
    -   Check RSS feeds manually (SBS, AI Times).
    -   If external feeds are down, the system will serve mock data. This is expected behavior.
2.  **YouTube Failure:**
    -   Check `YOUTUBE_API_KEY` quota.
    -   If quota exceeded, the system falls back to RSS.
3.  **Humor Failure:**
    -   Check `todayhumor.co.kr` accessibility.
    -   If site structure changed, update Regex patterns in `src/app/api/humor/route.ts`.

---

**Actionable Output:**
1.  **Updated Health Check Script:** See `scripts/health-check.sh` for enhanced monitoring logic detecting "Soft Failures".
