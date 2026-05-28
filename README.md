# NewsDailyAI

Scrape AI & dev news, generate LinkedIn posts with Groq, and browse/edit them in a React UI.

## Prerequisites

- Python 3.10+
- Node.js 18+ (20+ recommended)
- Groq API key: copy `.env.example` to `.env` and set your key:

```bash
cp .env.example .env
```

## Backend

From the project root (`newsdailyai`):

```bash
pip3 install -r requirements.txt
python3 main.py --serve
```

API: http://localhost:8000  
Interactive docs: http://localhost:8000/docs

### Scrape + generate (no API server)

Downloads full article text with `newspaper3k` (NLTK `punkt` resources downloaded on first run):

```bash
python3 main.py
```

This also backfills `content_markdown` for existing DB articles that are missing it.

## Frontend

In a **separate terminal**, from the project root:

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:5173

**Start the backend first**, then the frontend. The UI calls `http://localhost:8000`.

## Project structure

```
newsdailyai/
├── api.py              # FastAPI routes
├── database.py         # SQLAlchemy models
├── linkedin_generator.py
├── main.py             # CLI: scrape or --serve
├── scraper.py
├── frontend/           # React + Vite + Tailwind
└── requirements.txt
```
