import requests
from bs4 import BeautifulSoup
import json
import datetime
import re
import time
import sys

# Constants
HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
    'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1'
}
TIMEOUT = 10

def fetch_page(url, encoding=None):
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if encoding:
            r.encoding = encoding
        r.raise_for_status()
        return r
    except Exception as e:
        print(f"Error fetching {url}: {e}", file=sys.stderr)
        return None

def get_details(url):
    """Fetches summary, thumbnail, and potentially counts from the article page."""
    details = {
        'summary': '내용을 불러오지 못했습니다.',
        'thumbnailUrl': '',
        'category': '유머'
    }

    # Simple rate limit
    time.sleep(0.5)

    r = fetch_page(url)
    if not r:
        return details

    soup = BeautifulSoup(r.content, 'html.parser')

    # Extract Thumbnail
    og_img = soup.find('meta', property='og:image')
    if og_img and og_img.get('content'):
        details['thumbnailUrl'] = og_img['content']
    else:
        first_img = soup.find('img')
        if first_img and first_img.get('src'):
             src = first_img['src']
             if src.startswith('http'):
                 details['thumbnailUrl'] = src

    # Extract Summary
    og_desc = soup.find('meta', property='og:description')
    if og_desc and og_desc.get('content'):
        details['summary'] = og_desc['content'][:100] + '...'
    else:
        paragraphs = soup.find_all('p')
        text_content = ""
        for p in paragraphs:
            text = p.get_text(strip=True)
            if len(text) > 20:
                text_content = text
                break
        if text_content:
            details['summary'] = text_content[:100] + '...'

    return details

def scrape_dogdrip():
    url = "https://www.dogdrip.net/dogdrip"
    print(f"Scraping {url}...")
    r = fetch_page(url)
    if not r: return []

    soup = BeautifulSoup(r.content, 'html.parser')
    items = []

    links = soup.select('a.title-link')

    for l in links:
        title = l.get_text(strip=True)
        href = l.get('href')
        if not href: continue

        if "공지" in title or "규칙" in title:
            continue

        if href.startswith('/'):
            href = 'https://www.dogdrip.net' + href

        items.append({
            'title': title,
            'sourceUrl': href,
            'sourceSite': '개드립',
            'viewCount': 0,
            'likeCount': 0,
            'commentCount': 0
        })

    print(f"DogDrip items found: {len(items)}")
    return items

def scrape_instiz():
    url = "https://www.instiz.net/"
    print(f"Scraping {url}...")
    r = fetch_page(url)
    if not r: return []

    soup = BeautifulSoup(r.content, 'html.parser')
    items = []

    titles = soup.select('span.post_title')

    for t in titles:
        title = t.get_text(strip=True)
        parent_a = t.find_parent('a')
        if not parent_a: continue

        href = parent_a.get('href')
        if not href: continue

        comment_count = 0
        cmt_span = parent_a.find('span', class_='cmt')
        if cmt_span:
            try:
                comment_count = int(cmt_span.get_text(strip=True))
            except:
                pass

        if href.startswith('javascript'):
             continue

        if href.startswith('//'):
            href = 'https:' + href
        elif href.startswith('/'):
            href = 'https://www.instiz.net' + href
        elif not href.startswith('http'):
            href = 'https://www.instiz.net/' + href

        items.append({
            'title': title,
            'sourceUrl': href,
            'sourceSite': '인스티즈',
            'viewCount': 0,
            'likeCount': 0,
            'commentCount': comment_count
        })

    print(f"Instiz items found: {len(items)}")
    return items

def scrape_dc():
    url = "https://gall.dcinside.com/board/lists/?id=dcbest"
    print(f"Scraping {url}...")
    r = fetch_page(url)
    if not r: return []

    soup = BeautifulSoup(r.content, 'html.parser')
    items = []

    rows = soup.select('tr.ub-content')

    for row in rows:
        title_td = row.select_one('td.gall_tit')
        if not title_td: continue

        a_tag = title_td.select_one('a')
        if not a_tag: continue

        title = a_tag.get_text(strip=True)
        href = a_tag.get('href')
        if not href: continue

        views = 0
        view_td = row.select_one('td.gall_count')
        if view_td:
            try: views = int(view_td.get_text(strip=True))
            except: pass

        likes = 0
        like_td = row.select_one('td.gall_recommend')
        if like_td:
             try: likes = int(like_td.get_text(strip=True))
             except: pass

        if href.startswith('/'):
            href = 'https://gall.dcinside.com' + href

        items.append({
            'title': title,
            'sourceUrl': href,
            'sourceSite': '디시인사이드',
            'viewCount': views,
            'likeCount': likes,
            'commentCount': 0
        })

    print(f"DC items found: {len(items)}")
    return items

def scrape_humoruniv():
    url = "http://m.humoruniv.com/board/list.html?table=pds"
    print(f"Scraping {url}...")
    r = fetch_page(url, encoding='euc-kr')
    if not r: return []

    soup = BeautifulSoup(r.text, 'html.parser')
    items = []

    links = soup.select('a')

    for l in links:
        href = l.get('href')
        if not href or 'read.html' not in href: continue

        title = l.get_text(strip=True)
        if len(title) < 5: continue

        if not href.startswith('http'):
            if href.startswith('/'):
                 href = 'http://m.humoruniv.com' + href
            else:
                 href = 'http://m.humoruniv.com/board/' + href

        items.append({
            'title': title,
            'sourceUrl': href,
            'sourceSite': '웃긴대학',
            'viewCount': 0,
            'likeCount': 0,
            'commentCount': 0
        })
        if len(items) > 20: break

    print(f"Humor Univ items found: {len(items)}")
    return items

def scrape_theqoo():
    url = "https://theqoo.net/hot"
    print(f"Scraping {url}...")
    r = fetch_page(url)
    if not r: return []

    soup = BeautifulSoup(r.content, 'html.parser')
    items = []

    # Attempt to find standard board table
    rows = soup.select('table tbody tr')
    for row in rows:
        title_td = row.select_one('td.title')
        if not title_td: continue
        a_tag = title_td.select_one('a')
        if not a_tag: continue

        title = a_tag.get_text(strip=True)
        href = a_tag.get('href')
        if not href: continue

        if not href.startswith('http'):
            href = 'https://theqoo.net' + href

        items.append({
            'title': title,
            'sourceUrl': href,
            'sourceSite': '더쿠',
            'viewCount': 0,
            'likeCount': 0,
            'commentCount': 0
        })

    print(f"TheQoo items found: {len(items)}")
    return items

def main():
    all_contents = []

    all_contents.extend(scrape_dogdrip())
    all_contents.extend(scrape_instiz())
    all_contents.extend(scrape_dc())
    all_contents.extend(scrape_humoruniv())
    all_contents.extend(scrape_theqoo())

    top_10 = []

    # Collect candidates by site
    by_site = {}
    for item in all_contents:
        site = item['sourceSite']
        if site not in by_site: by_site[site] = []
        by_site[site].append(item)

    sites = list(by_site.keys())
    max_len = max(len(v) for v in by_site.values()) if sites else 0

    for i in range(max_len):
        for site in sites:
            if i < len(by_site[site]):
                top_10.append(by_site[site][i])
                if len(top_10) >= 10: break
        if len(top_10) >= 10: break

    print("Fetching details for Top 10 items...")
    for item in top_10:
        try:
            print(f"  Fetching {item['sourceUrl']}...")
            details = get_details(item['sourceUrl'])
            item.update(details)
            item['publishedAt'] = datetime.datetime.now().isoformat() + "Z"
        except Exception as e:
            print(f"  Failed to fetch details for {item['sourceUrl']}: {e}")

    # Counts
    counts = []
    for site in ["개드립", "인스티즈", "더쿠", "디시인사이드", "웃긴대학"]:
        c = len([x for x in top_10 if x['sourceSite'] == site])
        counts.append({"site": site, "count": c})

    output = {
        "generatedAt": datetime.datetime.now().isoformat() + "Z",
        "summary": "오늘의 인기 유머 트렌드 집계 결과입니다.",
        "contents": top_10,
        "topSites": counts
    }

    with open('humor_trends.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print("Successfully generated humor_trends.json")

if __name__ == "__main__":
    main()
