import json
import time
from datetime import datetime

import requests
from newspaper import Article as NewspaperArticle

HN_API_BASE = "https://hacker-news.firebaseio.com/v0"

KEYWORDS = [
    "ai",
    "llm",
    "gpt",
    "claude",
    "programming",
    "developer",
    "code",
    "python",
    "javascript",
    "open source",
    "api",
    "database",
    "deployment",
    "software engineer",
    "machine learning",
    "deep learning",
]


def _title_matches(title: str) -> bool:
    title_lower = title.lower()
    return any(keyword in title_lower for keyword in KEYWORDS)


def extract_article_content(url: str) -> str:
    """Download and parse full article text from a URL."""
    if not url or not url.startswith(("http://", "https://")):
        return ""

    try:
        article = NewspaperArticle(url)
        article.download()
        article.parse()
        return (article.text or "").strip()
    except Exception:
        return ""


def scrape_hackernews():
    """Fetch top HN stories and return articles matching keyword filters."""
    articles = []

    try:
        response = requests.get(f"{HN_API_BASE}/topstories.json", timeout=30)
        response.raise_for_status()
        story_ids = response.json()[:30]
    except requests.RequestException as e:
        print(f"Failed to fetch top stories: {e}")
        return articles

    for story_id in story_ids:
        try:
            item_response = requests.get(
                f"{HN_API_BASE}/item/{story_id}.json", timeout=30
            )
            item_response.raise_for_status()
            item = item_response.json()
        except requests.RequestException:
            time.sleep(1)
            continue

        time.sleep(1)

        if not item or item.get("type") != "story":
            continue

        title = item.get("title", "")
        if not title or not _title_matches(title):
            continue

        item_id = item.get("id", story_id)
        url = item.get("url") or f"https://news.ycombinator.com/item?id={item_id}"
        summary = item.get("text") or ""
        published_date = datetime.utcfromtimestamp(item["time"]).isoformat()

        articles.append(
            {
                "title": title,
                "url": url,
                "source_name": "Hacker News",
                "summary": summary,
                "published_date": published_date,
            }
        )

    return articles


DEVTO_TAGS = ["ai", "programming", "webdev"]
DEVTO_API_URL = "https://dev.to/api/articles"


def scrape_devto():
    """Fetch recent Dev.to articles for relevant tags."""
    articles = []
    seen_urls = set()

    for tag in DEVTO_TAGS:
        try:
            response = requests.get(
                DEVTO_API_URL,
                params={"tag": tag, "per_page": 20},
                timeout=30,
            )
            response.raise_for_status()
            items = response.json()
        except requests.RequestException as e:
            print(f"Failed to fetch Dev.to articles for tag '{tag}': {e}")
            continue

        for article in items:
            url = article.get("url", "")
            if not url or url in seen_urls:
                continue
            seen_urls.add(url)

            articles.append(
                {
                    "title": article.get("title", ""),
                    "url": url,
                    "source_name": "Dev.to",
                    "summary": article.get("description") or "",
                    "published_date": article.get("published_at", ""),
                }
            )

    return articles


def scrape_all():
    """Scrape all sources and return deduplicated articles by URL."""
    combined = scrape_hackernews() + scrape_devto()
    seen_urls = set()
    deduplicated = []

    for article in combined:
        url = article.get("url")
        if not url or url in seen_urls:
            continue
        seen_urls.add(url)
        deduplicated.append(article)

    return deduplicated


if __name__ == "__main__":
    result = scrape_hackernews()
    print(json.dumps(result, indent=2))
