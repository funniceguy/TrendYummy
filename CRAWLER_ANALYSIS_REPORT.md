# Deep Verification Analysis: TrendYummy Crawlers

**Date:** 2026-02-04
**Category:** Ops
**Status:** **DEGRADED** (YouTube Crawler Failure)

## 1. Executive Summary

The system is currently operating in a degraded state. While the Trends and Humor crawlers are functioning correctly, the **YouTube crawler has failed completely** and is serving static fallback data. Immediate operator intervention is required to restore real-time video trend data.

## 2. Crawler Health Analysis

### A. Trends Crawler
*   **Status:** **HEALTHY**
*   **Count:** 39 items (Expected: ~40-45)
*   **Sources:** SBS News (RSS), AI Times (RSS), Gamemeca/Inven (HTML), Google Trends (RSS).
*   **Analysis:** The count of 39 indicates that all major sources are responding and parsing correctly. The slight variance from the theoretical maximum (45) is normal due to deduplication or empty feeds.

### B. YouTube Crawler
*   **Status:** **CRITICAL FAILURE / FALLBACK ACTIVE**
*   **Count:** 11 items
*   **Analysis:** The count of **exactly 11 items** matches the sum of hardcoded fallback data:
    *   Total: 3
    *   Music: 3
    *   Entertainment: 2
    *   Game: 1
    *   Sports: 1
    *   Person: 1
    *   **Sum:** 11
*   **Root Cause:**
    1.  **API Failure:** `YOUTUBE_API_KEY` is likely missing or invalid in the environment variables, causing the primary fetch method to fail.
    2.  **RSS Failure:** The secondary RSS fallback method (`https://www.youtube.com/feeds/videos.xml?chart=MOST_POPULAR&regionCode=KR`) is also failing or returning no items for the "Total" category.
*   **Impact:** Users are seeing stale, hardcoded video data instead of real-time trends.

### C. Humor Crawler
*   **Status:** **HEALTHY**
*   **Count:** 10 items
*   **Source:** TodayHumor (HTML Scraping)
*   **Analysis:** The crawler successfully fetched and parsed 10 items, indicating the source site is up and the regex patterns for HTML parsing are still valid.

## 3. Reliability Risks & Mitigations

| Component | Risk | Impact | Mitigation |
| :--- | :--- | :--- | :--- |
| **YouTube** | Missing API Key / Quota Limits | **High** (Stale Data) | **Immediate:** Add `YOUTUBE_API_KEY` to `.env`. **Long-term:** Implement rotation or alternative data provider. |
| **YouTube** | RSS Format Change | **Medium** (Fallback to Static) | Update RSS parsing logic in `src/app/api/youtube/route.ts` if API key is not an option. |
| **Humor** | HTML Structure Change | **Medium** (Broken Scraper) | Monitor `todayhumor` layout. Consider moving to a more robust parser (e.g., `cheerio`) instead of regex. |
| **Trends** | RSS Feed Downtime | **Low** (Partial Data Loss) | The multi-source strategy (SBS, AI Times, Game, Google) effectively mitigates single-source failures. |

## 4. Operator Checklist

### Immediate Actions (Critical)
- [ ] **Verify `YOUTUBE_API_KEY`**: Check if `YOUTUBE_API_KEY` is defined in the production `.env` file and is valid.
- [ ] **Check Logs**: Inspect server logs for `YouTube API error` or `YouTube RSS error` messages to confirm the specific failure reason.

### Routine Monitoring
- [ ] **Trend Source Diversity**: Ensure `sources` in `/api/trends` response includes SBS, AI Times, Game, and Google.
- [ ] **Humor Content**: Verify `/api/humor` returns non-empty lists and valid titles.
- [ ] **YouTube Fallback**: If `/api/youtube` returns exactly 11 items, the system is in fallback mode. Investigate immediately.
