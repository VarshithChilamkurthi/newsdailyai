import argparse
import os
import time

from dotenv import load_dotenv

from database import (
    get_all_articles,
    get_articles_missing_content,
    init_db,
    save_articles,
    update_article_content,
)
from scraper import extract_article_content, scrape_all


def ensure_nltk_resources():
    try:
        import nltk

        for resource in ("punkt_tab", "punkt"):
            try:
                nltk.download(resource, quiet=True)
            except Exception:
                pass
    except Exception as e:
        print(f"Warning: NLTK resource download skipped: {e}")


def backfill_article_content():
    articles = get_articles_missing_content()
    total = len(articles)
    if total == 0:
        print("All articles already have full content.")
        return

    print(f"Backfilling full content for {total} articles...")
    updated = 0
    for i, article in enumerate(articles, 1):
        print(
            f"Extracting content for article ID {article.id} ({i}/{total})..."
        )
        content = extract_article_content(article.source_url)
        if content:
            update_article_content(article.id, content)
            updated += 1
            print(f"  Updated article ID {article.id} ({len(content)} chars)")
        else:
            print(f"  No content extracted for article ID {article.id}")
        time.sleep(1)

    print(f"Backfill complete: {updated}/{total} articles updated.")


def run_pipeline():
    ensure_nltk_resources()
    init_db()

    print("Scraping all sources...")
    articles = scrape_all()
    new_count = save_articles(articles, extract_full=True)
    print(f"New articles saved: {new_count}")

    backfill_article_content()

    all_articles = get_all_articles()
    print(f"Total articles in database: {len(all_articles)}")
    print("LinkedIn posts are generated on-demand via the API.")


def run_api():
    import uvicorn

    from api import app

    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    load_dotenv()

    parser = argparse.ArgumentParser(description="NewsDailyAI")
    parser.add_argument(
        "--serve",
        action="store_true",
        help="Start the FastAPI server instead of running scrape/generate",
    )
    args = parser.parse_args()

    if args.serve:
        run_api()
    else:
        run_pipeline()
