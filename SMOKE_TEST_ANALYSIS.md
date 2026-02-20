# Production Force-Mode Smoke Test Analysis

## 1. Crawler Health Assessment

### Trends Crawler
*   **Status**: **HEALTHY (Active)**
*   **Metric**: Count = 40 (vs Mock = 5)
*   **Analysis**: The crawler is successfully aggregating data from multiple active sources (SBS News, AI Times, GameMeca/Inven, Google Trends). The high count confirms that the system is not relying on the 5-item `MOCK_TRENDS` fallback.
*   **Resilience**: Implements partial failure handling (e.g., if one RSS feed fails, others continue).

### YouTube Crawler
*   **Status**: **DEGRADED (Fallback Mode Active)**
*   **Metric**: Count = 11
*   **Analysis**: The count of exactly 11 matches the sum of hardcoded fallback videos (3 All + 3 Music + 2 Ent + 1 Game + 1 Sports + 1 Person). This indicates a **double failure**:
    1.  YouTube Data API v3 failed (likely missing `YOUTUBE_API_KEY`).
    2.  RSS Feed fallback failed or returned no data.
*   **Impact**: Users are seeing stale, hardcoded video data.

### Humor Crawler
*   **Status**: **HEALTHY (Fragile)**
*   **Metric**: Count = 10 (Max requested)
*   **Analysis**: Successfully parsed `todayhumor.co.kr` HTML to retrieve the requested 10 items.
*   **Risk**: Extremely high fragility due to Regex-based HTML parsing. Any markup change on the source site will cause immediate failure (Count = 0).

---

## 2. Reliability Risks & Mitigations

| Component | Risk | Severity | Mitigation Strategy |
| :--- | :--- | :--- | :--- |
| **YouTube** | **Stale Data (Fallback)** | **Critical** | **Immediate:** valid `YOUTUBE_API_KEY` in `.env`. <br> **Long-term:** Implement rotation or alternative piped instances. |
| **Humor** | **Regex Fragility** | High | **Monitor:** Alert if count == 0. <br> **Code:** Switch to robust DOM parser (Cheerio/JSDOM) instead of Regex. |
| **Trends** | **Source Flakiness** | Medium | Current `Promise.allSettled` architecture is good. Add more redundant sources (e.g., Naver Open API) to dilute impact of single-source failure. |

---

## 3. Operator Checklist (Production Monitoring)

### Critical Alerts
- [ ] **YouTube Crawler Count == 11**: Indicates fallback mode is active. Check API Quotas and `YOUTUBE_API_KEY`.
- [ ] **Humor Crawler Count == 0**: Indicates Regex parsing failure. Check source site HTML structure.
- [ ] **Trends Crawler Count <= 5**: Indicates massive failure or fallback to `MOCK_TRENDS`.

### Deployment verification
- [ ] Verify `YOUTUBE_API_KEY` is present in environment variables (missing in `.env.example`).
- [ ] Verify outgoing IP is not blocked by `todayhumor.co.kr` (anti-bot measures).
