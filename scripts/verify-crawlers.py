#!/usr/bin/env python3
import sys
import json
import urllib.request
import urllib.error
import time

def fetch_json(url):
    try:
        req = urllib.request.Request(url)
        # Add user agent to mimic browser
        req.add_header('User-Agent', 'Mozilla/5.0 (compatible; CrawlerVerifier/1.0)')
        with urllib.request.urlopen(req, timeout=10) as response:
            return json.loads(response.read().decode('utf-8'))
    except urllib.error.URLError as e:
        print(f"Error fetching {url}: {e}")
        return None
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON from {url}: {e}")
        return None

def check_trends(base_url):
    url = f"{base_url}/api/trends"
    print(f"\nChecking Trends ({url})...")
    data = fetch_json(url)
    if not data:
        return "FAIL (Connection/Parse Error)"

    success = data.get("success", False)
    sources = data.get("sources", [])
    trends = data.get("trends", [])

    print(f"  - Success: {success}")
    print(f"  - Count: {len(trends)}")
    print(f"  - Sources: {', '.join(sources)}")

    if "시스템 알림(데이터 수집 실패)" in sources or "시스템 알림(오류 발생)" in sources:
        return "WARN (Using Fallback/Mock Data)"

    if len(trends) == 0:
        return "FAIL (No Data)"

    return "PASS (Live Data)"

def check_youtube(base_url):
    url = f"{base_url}/api/youtube"
    print(f"\nChecking YouTube ({url})...")
    data = fetch_json(url)
    if not data:
        return "FAIL (Connection/Parse Error)"

    success = data.get("success", False)
    categories = data.get("categories", [])

    total_videos = sum(len(c.get("videos", [])) for c in categories)

    print(f"  - Success: {success}")
    print(f"  - Total Videos: {total_videos}")

    # Check for specific fallback video ID (NewJeans 'ETA' - je_R3gEtDbw)
    is_fallback = False
    for cat in categories:
        for video in cat.get("videos", []):
            if video.get("videoId") == "je_R3gEtDbw":
                is_fallback = True
                break
        if is_fallback:
            break

    if is_fallback:
        return "WARN (Using Hardcoded Fallback)"

    if total_videos == 0:
        return "FAIL (No Data)"

    return "PASS (Live Data)"

def check_humor(base_url):
    url = f"{base_url}/api/humor"
    print(f"\nChecking Humor ({url})...")
    data = fetch_json(url)
    if not data:
        return "FAIL (Connection/Parse Error)"

    success = data.get("success", False)
    posts = data.get("posts", [])

    print(f"  - Success: {success}")
    print(f"  - Count: {len(posts)}")

    if len(posts) == 0:
        return "FAIL (No Data or Parsing Failed)"

    # Check for valid titles
    sample_title = posts[0].get("title", "") if posts else ""
    print(f"  - Sample: {sample_title}")

    return "PASS (Live Data)"

def main():
    base_url = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:3000"

    print(f"Starting Deep Verification on {base_url}")

    trends_status = check_trends(base_url)
    youtube_status = check_youtube(base_url)
    humor_status = check_humor(base_url)

    print("\n" + "="*40)
    print("VERIFICATION SUMMARY")
    print("="*40)
    print(f"Trends:  {trends_status}")
    print(f"YouTube: {youtube_status}")
    print(f"Humor:   {humor_status}")
    print("="*40)

if __name__ == "__main__":
    main()
