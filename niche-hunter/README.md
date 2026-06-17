# Niche Hunter

Identify underserved book niches on Amazon KDP by cross-referencing search
demand (Google Trends, Reddit) against book supply (Amazon, Google Books,
Open Library) and computing a Gap Score.

```
Gap Score = (Demand × 0.40) + (Supply × 0.35) + (Competition × 0.25)
```

A **Priority Niche** satisfies all four conditions:
- Gap Score ≥ 70
- Amazon results < 100
- Google Trends 90-day avg ≥ 40
- Avg reviews of top 3 books < 50

---

## Setup

### 1. Prerequisites

- Python 3.11+
- pip

### 2. Install dependencies

```bash
pip install -r requirements.txt
playwright install chromium
```

### 3. Configure API keys (optional but recommended)

```bash
cp .env.example .env
# Edit .env and fill in your keys
```

| Key | Where to get it | Required? |
|-----|----------------|-----------|
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | reddit.com/prefs/apps | Optional |
| `GOOGLE_BOOKS_API_KEY` | console.cloud.google.com | Optional |
| `PROXY_URL` | Your proxy provider | Optional |

Without API keys the tool still works — Reddit falls back to the public
JSON endpoint and Google Books uses the anonymous quota.

---

## Usage

```bash
# Analyse specific keywords
python main.py --keywords "stoicism for beginners, minimalist living"

# Load keywords from a file (one per line)
python main.py --file keywords.csv

# Auto mode: discover rising topics from Google Trends
python main.py --auto

# Custom output directory
python main.py --keywords "bullet journal" --output my_results/
```

---

## Output

Results are saved to the `results/` directory:

```
results/
├── YYYY-MM-DD_niche_report.csv
├── YYYY-MM-DD_niche_report.json
└── YYYY-MM-DD_summary.md
```

---

## Project Structure

```
niche-hunter/
├── main.py              # CLI entry point
├── config.py            # All settings and thresholds
├── requirements.txt
├── .env.example
├── scrapers/            # Data collection
│   ├── amazon.py
│   ├── google_trends.py
│   ├── google_books.py
│   ├── open_library.py
│   └── reddit.py
├── analysis/            # Scoring and reporting
│   ├── gap_score.py
│   └── report.py
├── utils/               # Shared helpers
│   ├── cache.py
│   ├── rate_limiter.py
│   └── user_agents.py
├── results/             # Generated reports (git-ignored except .gitkeep)
├── cache/               # Scraper cache (git-ignored except .gitkeep)
└── logs/                # Runtime logs (git-ignored except .gitkeep)
```

---

## Known Limitations

1. **Amazon blocks scrapers.** Playwright with delays buys time but is not permanent.
2. **pytrends rate limits.** Falls back to Reddit-only demand scoring when hit.
3. **Gap Score is a signal, not a guarantee.** Always validate manually before writing a book.
