# Deep Verification Analysis: AI Category Crawler

**Date:** 2024-05-22
**Analyst:** Jules
**Scope:** `/api/trends`, `/api/youtube`, `/api/humor`

## 1. Executive Summary

The system's crawler health is partially degraded. While the **Trends** and **Humor** crawlers are functioning correctly and retrieving live data, the **YouTube** crawler has failed completely and is serving static fallback content.

| Component | Status | Count | Verdict |
| :--- | :--- | :--- | :--- |
| **Trends** | **HEALTHY** | 38 | Aggregating live data from multiple sources (SBS, AI Times, GameMeca, Google). |
| **YouTube** | **CRITICAL** | 11 | **FAIL.** Serving hardcoded fallback data. API/RSS methods are failing. |
| **Humor** | **HEALTHY** | 10 | Successfully scraping `todayhumor.co.kr` (HTML). |

---

## 2. Endpoint Health Analysis

### 2.1. Trends Crawler (`/api/trends`)
*   **Status:** **Pass (Live Data)**
*   **Observation:** The count of **38 items** indicates successful aggregation from multiple sources:
    *   SBS News RSS (Entertainment, Sports, Economy, Society, Politics)
    *   AI Times RSS (IT/AI)
    *   GameMeca & Inven (Game)
    *   Google Trends (Etc)
*   **Resilience:** The system correctly handles partial failures. If one source fails, others continue to serve data. The "Mock Data" fallback (which returns a fixed set of items) is *not* currently active, which is good.

### 2.2. YouTube Crawler (`/api/youtube`)
*   **Status:** **Fail (Fallback Data)**
*   **Observation:** The count of **11 items** exactly matches the sum of hardcoded fallback videos defined in `getRecentFallbackVideos`:
    *   Category 0 (All): 3 videos
    *   Category 10 (Music): 3 videos
    *   Category 24 (Ent): 2 videos
    *   Category 20 (Game): 1 video
    *   Category 17 (Sports): 1 video
    *   Category 22 (People): 1 video
    *   **Total:** 11 videos
*   **Root Cause:**
    1.  **Missing API Key:** `YOUTUBE_API_KEY` is likely missing or invalid in `.env`.
    2.  **RSS Failure:** The RSS fallback is only implemented for the "All" category (ID 0) and appears to be failing or returning empty results for specific categories.

### 2.3. Humor Crawler (`/api/humor`)
*   **Status:** **Pass (Live Data)**
*   **Observation:** The count of **10 items** confirms that the HTML scraper for `todayhumor.co.kr` is successfully parsing the DOM using the current regex patterns.
*   **Mechanism:** It fetches the "Best of Best" board and extracts posts using regex `href="...view.php?...no=(\d+)..."`.

---

## 3. Reliability Risks & Mitigations

### 🔴 High Risk: YouTube Stale Data
*   **Risk:** The YouTube endpoint is serving static data. Users will see the same "NewJeans ETA" and "Aespa Supernova" videos indefinitely.
*   **Mitigation:**
    1.  **Immediate:** Obtain a valid Google Cloud API Key with YouTube Data API v3 enabled.
    2.  **Config:** Set `YOUTUBE_API_KEY` in the `.env` file (and `.env.local`).
    3.  **Code Improvement:** Enhance the RSS fallback to support more categories if possible, or use a headless browser (Puppeteer/Playwright) for more robust scraping if API quota is a concern.

### 🟡 Medium Risk: Humor Scraper Fragility
*   **Risk:** The Humor crawler relies on Regex parsing of HTML (`src/app/api/humor/route.ts`). Any change in `todayhumor.co.kr`'s markup (e.g., class names, attribute order) will break the scraper.
*   **Mitigation:**
    1.  **Monitoring:** Watch for "0 items" or "Parse Error" in logs.
    2.  **Refactoring:** Switch to a robust HTML parser like `cheerio` or `jsdom` instead of Regex.

### 🟢 Low Risk: Trends Partial Failure
*   **Risk:** Individual RSS feeds (e.g., SBS) may go down.
*   **Mitigation:** The current implementation already handles this well by logging errors (`[SBS 연예] Failed...`) and continuing with other sources. No immediate action needed.

---

## 4. Operator Checklist

### ✅ Verification Steps
1.  **Run Deep Verification Script:**
    Use the provided script to check for fallback signatures.
    ```bash
    # Ensure server is running at localhost:3000
    python3 scripts/verify-crawlers.py http://localhost:3000
    ```
    *   **Pass Criteria:**
        *   Trends: "PASS (Live Data)"
        *   YouTube: "PASS (Live Data)" (Not "WARN")
        *   Humor: "PASS (Live Data)"

2.  **Check Environment Variables:**
    Ensure `.env` contains:
    ```bash
    YOUTUBE_API_KEY=AIzaSy...
    ```

### 🔍 Log Monitoring
*   **Search for:** `System Notification` or `시스템 알림` in logs. This indicates the Trends crawler has fallen back to mock data.
*   **Search for:** `YouTube API error` or `YouTube RSS error`.
*   **Search for:** `Humor crawling error`.

### 🚨 Emergency Response
*   **If YouTube is stale:** Manually update `getRecentFallbackVideos` in `src/app/api/youtube/route.ts` with newer video IDs as a temporary fix if API key is unavailable.
