from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    create_engine,
    func,
    or_,
)
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///newsdailyai.db"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine, expire_on_commit=False)
Base = declarative_base()


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    source_url = Column(String, unique=True, nullable=False)
    source_name = Column(String, nullable=False)
    summary = Column(Text, default="")
    content_markdown = Column(Text, default="")
    published_date = Column(DateTime, nullable=True)
    tags = Column(String, default="")
    created_at = Column(DateTime, default=func.now())


class LinkedInPost(Base):
    __tablename__ = "linkedin_posts"

    id = Column(Integer, primary_key=True)
    article_id = Column(Integer, ForeignKey("articles.id"), nullable=False)
    post_text = Column(Text, nullable=False)
    tone = Column(String, default="professional")
    generated_at = Column(DateTime, default=func.now())
    is_edited = Column(Boolean, default=False)


def init_db():
    Base.metadata.create_all(bind=engine)


def get_post_for_article_tone(article_id: int, tone: str):
    session = SessionLocal()
    try:
        return (
            session.query(LinkedInPost)
            .filter(
                LinkedInPost.article_id == article_id,
                LinkedInPost.tone == tone,
            )
            .order_by(LinkedInPost.generated_at.desc())
            .first()
        )
    finally:
        session.close()


def _parse_published_date(value):
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    if isinstance(value, str):
        normalized = value.replace("Z", "+00:00")
        try:
            return datetime.fromisoformat(normalized)
        except ValueError:
            return None
    return None


def save_articles(articles_list, extract_full: bool = False):
    from scraper import extract_article_content

    session = SessionLocal()
    added = 0
    try:
        for article in articles_list:
            source_url = article.get("url")
            if not source_url:
                continue

            existing = (
                session.query(Article)
                .filter(Article.source_url == source_url)
                .first()
            )
            if existing:
                continue

            summary = article.get("summary") or ""
            content_markdown = article.get("content_markdown") or ""
            if extract_full and len(summary) < 200 and not content_markdown:
                content_markdown = extract_article_content(source_url)

            session.add(
                Article(
                    title=article["title"],
                    source_url=source_url,
                    source_name=article["source_name"],
                    summary=summary,
                    content_markdown=content_markdown,
                    published_date=_parse_published_date(
                        article.get("published_date")
                    ),
                )
            )
            added += 1

        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()

    return added


def get_articles_missing_content():
    session = SessionLocal()
    try:
        return (
            session.query(Article)
            .filter(
                or_(
                    Article.content_markdown.is_(None),
                    Article.content_markdown == "",
                )
            )
            .order_by(Article.published_date.desc())
            .all()
        )
    finally:
        session.close()


def update_article_content(article_id, content_markdown):
    session = SessionLocal()
    try:
        article = session.query(Article).filter(Article.id == article_id).first()
        if not article:
            return False
        article.content_markdown = content_markdown
        session.commit()
        return True
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_all_articles():
    session = SessionLocal()
    try:
        return (
            session.query(Article)
            .order_by(Article.published_date.desc())
            .all()
        )
    finally:
        session.close()


def get_articles_without_posts():
    session = SessionLocal()
    try:
        return (
            session.query(Article)
            .outerjoin(LinkedInPost, Article.id == LinkedInPost.article_id)
            .filter(LinkedInPost.id.is_(None))
            .order_by(Article.published_date.desc())
            .all()
        )
    finally:
        session.close()


def save_generated_post(article_id, post_text, tone="professional"):
    session = SessionLocal()
    try:
        post = LinkedInPost(
            article_id=article_id,
            post_text=post_text,
            tone=tone,
        )
        session.add(post)
        session.commit()
        session.refresh(post)
        return post
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_posts_for_article(article_id):
    session = SessionLocal()
    try:
        return (
            session.query(LinkedInPost)
            .filter(LinkedInPost.article_id == article_id)
            .all()
        )
    finally:
        session.close()


def get_article_by_id(article_id):
    session = SessionLocal()
    try:
        return session.query(Article).filter(Article.id == article_id).first()
    finally:
        session.close()


def search_articles(query: str, limit=50):
    session = SessionLocal()
    try:
        pattern = f"%{query.lower()}%"
        return (
            session.query(Article)
            .filter(
                or_(
                    func.lower(Article.title).like(pattern),
                    func.lower(Article.summary).like(pattern),
                )
            )
            .order_by(Article.published_date.desc())
            .limit(limit)
            .all()
        )
    finally:
        session.close()


def update_linkedin_post(article_id, post_id, post_text):
    session = SessionLocal()
    try:
        post = (
            session.query(LinkedInPost)
            .filter(
                LinkedInPost.id == post_id,
                LinkedInPost.article_id == article_id,
            )
            .first()
        )
        if not post:
            return None
        post.post_text = post_text
        post.is_edited = True
        session.commit()
        session.refresh(post)
        return post
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def get_latest_posts(limit=10):
    session = SessionLocal()
    try:
        return (
            session.query(LinkedInPost, Article)
            .join(Article, LinkedInPost.article_id == Article.id)
            .order_by(LinkedInPost.generated_at.desc())
            .limit(limit)
            .all()
        )
    finally:
        session.close()
