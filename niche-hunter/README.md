# Niche Hunter

Find underserved book niches on Amazon KDP before anyone else does.

## What it does

Scans Amazon, Google Trends, Reddit, Google Books, and Open Library.
Computes a **Gap Score** (0–100) for each keyword:

> High demand + Low supply + Weak competition = publishing opportunity

```
Gap Score = (Demand × 0.40) + (Supply × 0.35) + (Competition × 0.25)
```

---

## Setup

### 1. Clone the repo

```bash
git clone <repo-url>
cd niche-hunter
```

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

| Key | Where to get it | Effect |
|-----|----------------|--------|
| `REDDIT_CLIENT_ID` / `REDDIT_CLIENT_SECRET` | reddit.com/prefs/apps | Better Reddit data |
| `GOOGLE_BOOKS_API_KEY` | console.cloud.google.com | Higher rate limits |
| `PROXY_URL` | Your proxy provider | Reduces Amazon blocks |

Without API keys the tool still works — Reddit falls back to the public
JSON endpoint and Google Books uses the anonymous quota.

---

## Usage

```bash
# Analyse specific keywords
python main.py --keywords "gratitude journal for men, anxiety workbook for teens"

# Auto-discover from Google Trends
python main.py --auto

# Load keywords from a CSV file
python main.py --file my_keywords.csv

# Expand keywords with audience/format variations
python main.py --keywords "stoicism" --expand

# Fast mode: skip Amazon scraping
python main.py --keywords "stoicism" --expand --no-amazon

# Bypass cache for fresh data
python main.py --keywords "journaling" --no-cache

# Limit analysis to top N keywords
python main.py --auto --limit 10

# Custom output directory
python main.py --keywords "bullet journal" --output my_results/
```

### All options

```
Options:
  --keywords TEXT    Comma-separated seed keywords
  --file PATH        CSV file with one keyword per row
  --auto             Discover keywords from Google Trends automatically
  --expand           Expand each keyword with audience/format variations
  --output DIR       Output directory (default: results/)
  --no-amazon        Skip Amazon scraping (faster, less accurate)
  --no-cache         Bypass cache and fetch fresh data
  --limit INT        Max keywords to analyse (default: 50)
  --help             Show this message and exit
```

---

## Understanding the Gap Score

| Score | Meaning |
|-------|---------|
| 80–100 | Exceptional opportunity — move fast |
| 70–79 | Strong opportunity ⭐ PRIORITY |
| 50–69 | Moderate — worth investigating |
| < 50 | Saturated or low demand |

A niche is flagged **⭐ PRIORITY** when ALL four conditions are met:
- Gap Score ≥ 70
- Amazon results < 100
- Google Trends 90-day avg ≥ 40
- Avg reviews of top 3 books < 50

---

## CSV File Format

Both formats are supported:

```
# Format A: no header
gratitude journal for men
anxiety workbook for teens

# Format B: with header
keyword
gratitude journal for men
anxiety workbook for teens
```

---

## Data Sources & Accuracy

| Source | What it measures | Notes |
|--------|-----------------|-------|
| Amazon | Real competition (BSR, reviews) | May be blocked occasionally |
| Google Trends | 90-day search interest, Books category | Unofficial API, may rate-limit |
| Reddit | Reader demand (5 subreddits, 12 months) | No auth needed for read-only |
| Google Books | Total published volume count | API key optional |
| Open Library | Open-access work count | Free, no auth required |

---

## Limitations

1. **Amazon blocks scrapers.** Playwright with delays buys time but isn't
   permanent. Use `--no-amazon` for faster runs, or consider Publisher
   Rocket / Helium 10 for production-scale Amazon data.

2. **pytrends rate limits.** Google Trends is an unofficial API. When
   rate-limited, the tool falls back to Reddit-only demand scoring.

3. **Gap Score is a signal, not a guarantee.** Always validate a PRIORITY
   niche manually before writing a book — check the actual Amazon search
   results yourself.

---

## Output Files

```
results/
├── YYYY-MM-DD_niche_report.csv    # Full data for all keywords
├── YYYY-MM-DD_niche_report.json   # Machine-readable
└── YYYY-MM-DD_summary.md          # Human-readable with book ideas + series clusters
```

---

## Project Structure

```
niche-hunter/
├── main.py              # CLI entry point
├── config.py            # All settings and thresholds
├── requirements.txt
├── .env.example
├── scrapers/            # Data collection (one file per source)
│   ├── amazon.py        # Playwright-based
│   ├── google_trends.py # pytrends
│   ├── google_books.py  # REST API
│   ├── open_library.py  # REST API
│   └── reddit.py        # Public JSON + PRAW fallback
├── analysis/            # Scoring, expansion, clustering, reporting
│   ├── gap_score.py     # Core algorithm
│   ├── expander.py      # Long-tail keyword generation
│   ├── clustering.py    # Series opportunity detection
│   └── report.py        # Rich table + CSV/JSON/MD export
├── utils/               # Shared helpers
│   ├── cache.py         # Disk JSON cache with TTL
│   ├── rate_limiter.py  # Random sleep delays
│   └── user_agents.py   # UA rotation pool
└── tests/
    └── test_gap_score.py
```
