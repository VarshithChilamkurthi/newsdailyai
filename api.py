import os
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from database import (
    get_all_articles,
    get_article_by_id,
    get_latest_posts,
    get_post_for_article_tone,
    get_posts_for_article,
    init_db,
    save_generated_post,
    search_articles,
    update_linkedin_post,
)
from linkedin_generator import LinkedInPostGenerator

load_dotenv()

app = FastAPI(title="NewsDailyAI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()


def _article_to_dict(article):
    return {
        "id": article.id,
        "title": article.title,
        "source_url": article.source_url,
        "source_name": article.source_name,
        "published_date": (
            article.published_date.isoformat() if article.published_date else None
        ),
        "summary": article.summary or "",
    }


def _article_to_detail_dict(article):
    data = _article_to_dict(article)
    data["content_markdown"] = article.content_markdown or ""
    data["tags"] = article.tags or ""
    return data


def _post_to_dict(post):
    return {
        "id": post.id,
        "post_text": post.post_text,
        "copy_ready": post.post_text.strip(),
        "char_count": len(post.post_text),
        "tone": post.tone,
        "is_edited": post.is_edited,
        "generated_at": post.generated_at.isoformat() if post.generated_at else None,
    }


def _article_dict_for_generator(article):
    return {
        "title": article.title,
        "source_name": article.source_name,
        "summary": article.summary or "",
        "content_markdown": article.content_markdown or "",
    }


class GeneratePostRequest(BaseModel):
    tone: str = "professional"


class GeneratePostByIdRequest(BaseModel):
    article_id: int
    tone: str = "professional"


class UpdatePostRequest(BaseModel):
    post_text: str


@app.get("/api/articles")
def list_articles(page: int = 1, limit: int = 20, search: Optional[str] = None):
    if page < 1:
        page = 1
    if limit < 1:
        limit = 20

    try:
        if search:
            all_matching = search_articles(search.strip())
        else:
            all_matching = get_all_articles()

        total = len(all_matching)
        start = (page - 1) * limit
        end = page * limit
        page_articles = all_matching[start:end]

        return {
            "articles": [_article_to_dict(a) for a in page_articles],
            "total": total,
            "page": page,
            "limit": limit,
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


@app.get("/api/articles/{article_id}")
def get_article(article_id: int):
    article = get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    posts = get_posts_for_article(article_id)
    return {
        "article": _article_to_detail_dict(article),
        "linkedin_posts": [_post_to_dict(p) for p in posts],
    }


@app.post("/api/articles/{article_id}/generate-post")
def generate_post(article_id: int, body: GeneratePostRequest = GeneratePostRequest()):
    article = get_article_by_id(article_id)
    if not article:
        raise HTTPException(status_code=404, detail="Article not found")

    try:
        cached = get_post_for_article_tone(article_id, body.tone)
        if cached:
            return _post_to_dict(cached)

        generator = LinkedInPostGenerator(api_key=os.getenv("GROQ_API_KEY"))
        post_text = generator.generate_post(
            _article_dict_for_generator(article),
            tone=body.tone,
        )
        post = save_generated_post(article_id, post_text, tone=body.tone)
        return _post_to_dict(post)
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to generate post: {e}"
        ) from e


@app.post("/api/generate-post")
def generate_post_by_id(body: GeneratePostByIdRequest):
    return generate_post(body.article_id, GeneratePostRequest(tone=body.tone))


@app.put("/api/articles/{article_id}/posts/{post_id}")
def update_post(article_id: int, post_id: int, body: UpdatePostRequest):
    if not body.post_text.strip():
        raise HTTPException(status_code=400, detail="post_text cannot be empty")

    post = update_linkedin_post(article_id, post_id, body.post_text)
    if not post:
        raise HTTPException(status_code=404, detail="Post not found for this article")

    return {
        "message": "Post updated successfully",
        "post": _post_to_dict(post),
    }


@app.get("/api/posts/latest")
def latest_posts():
    try:
        results = get_latest_posts(limit=10)
        return {
            "posts": [
                {
                    **_post_to_dict(post),
                    "article_id": article.id,
                    "article_title": article.title,
                    "source_name": article.source_name,
                }
                for post, article in results
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e)) from e


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
