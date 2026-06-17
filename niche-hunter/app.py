"""
app.py
Niche Hunter — Streamlit web UI for the Amazon KDP Gap Finder.

Run with:
    cd niche-hunter && streamlit run app.py
"""

import io
import json
import os
import sys
from datetime import date

import pandas as pd
import plotly.graph_objects as go
import streamlit as st

# ── Make local modules importable ─────────────────────────────────────────────
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from scrapers.google_trends import get_trend_score
from scrapers.google_books import count_books
from scrapers.open_library import count_works
from scrapers.reddit import search_reddit, score_demand_from_reddit
from scrapers.amazon import search_amazon
from analysis.gap_score import calculate_gap_score
from analysis.clustering import cluster_niches
from utils.cache import disable_cache


# ── Page config (must be first Streamlit call) ────────────────────────────────
st.set_page_config(
    page_title="Niche Hunter — KDP Gap Finder",
    page_icon="🔍",
    layout="wide",
    initial_sidebar_state="expanded",
)


# ── Session state initialisation ──────────────────────────────────────────────
def _init_state() -> None:
    defaults = {
        "results": [],
        "clusters": [],
        "running": False,
        "theme": "dark",
        "progress_lines": [],
    }
    for key, val in defaults.items():
        if key not in st.session_state:
            st.session_state[key] = val


_init_state()


# ── Theme CSS ─────────────────────────────────────────────────────────────────
DARK_THEME = {
    "bg":         "#0e1117",
    "surface":    "#1a1d2e",
    "border":     "#2d3250",
    "text":       "#e8eaf0",
    "text_sec":   "#8892a4",
    "accent":     "#4ade80",
}

LIGHT_THEME = {
    "bg":         "#f0f2f6",
    "surface":    "#ffffff",
    "border":     "#e2e8f0",
    "text":       "#1a202c",
    "text_sec":   "#4a5568",
    "accent":     "#16a34a",
}


def _get_theme() -> dict:
    return DARK_THEME if st.session_state.theme == "dark" else LIGHT_THEME


def _inject_css() -> None:
    t = _get_theme()
    is_dark = st.session_state.theme == "dark"
    st.markdown(
        f"""
        <style>
        /* ── Base overrides ────────────────────────────────────────────────── */
        .stApp {{
            background-color: {t['bg']};
            color: {t['text']};
        }}
        section[data-testid="stSidebar"] {{
            background-color: {t['surface']};
            border-right: 1px solid {t['border']};
        }}
        section[data-testid="stSidebar"] * {{
            color: {t['text']} !important;
        }}
        /* Tighten main block padding */
        .block-container {{
            padding-top: 1.5rem;
            padding-bottom: 2rem;
            max-width: 1200px;
        }}

        /* ── Metric cards ──────────────────────────────────────────────────── */
        .metric-card {{
            background: {t['surface']};
            border: 1px solid {t['border']};
            border-radius: 12px;
            padding: 1.1rem 1.4rem;
            box-shadow: 0 2px 8px rgba(0,0,0,{'0.35' if is_dark else '0.08'});
            text-align: center;
            height: 100%;
        }}
        .metric-label {{
            font-size: 0.75rem;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: {t['text_sec']};
            margin-bottom: 0.4rem;
        }}
        .metric-value {{
            font-size: 2.2rem;
            font-weight: 800;
            color: {t['accent']};
            line-height: 1.1;
        }}
        .metric-sub {{
            font-size: 0.78rem;
            color: {t['text_sec']};
            margin-top: 0.3rem;
        }}

        /* ── Feature / hero cards ──────────────────────────────────────────── */
        .feature-card {{
            background: {t['surface']};
            border: 1px solid {t['border']};
            border-radius: 12px;
            padding: 1.5rem;
            text-align: center;
            height: 100%;
        }}
        .feature-card .feature-icon {{
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }}
        .feature-card h3 {{
            font-size: 1rem;
            font-weight: 700;
            color: {t['text']};
            margin: 0 0 0.5rem 0;
        }}
        .feature-card p {{
            font-size: 0.85rem;
            color: {t['text_sec']};
            margin: 0;
        }}

        /* ── Priority niche cards ──────────────────────────────────────────── */
        .niche-card {{
            background: {t['surface']};
            border: 1px solid {t['border']};
            border-radius: 12px;
            padding: 1.2rem 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,{'0.3' if is_dark else '0.07'});
        }}
        .niche-card.priority {{
            border-left: 4px solid #22c55e;
        }}
        .niche-card-header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.8rem;
        }}
        .niche-title {{
            font-size: 1.05rem;
            font-weight: 700;
            color: {t['text']};
        }}

        /* ── Gap score badges ──────────────────────────────────────────────── */
        .badge {{
            display: inline-block;
            padding: 0.25rem 0.65rem;
            border-radius: 999px;
            font-size: 0.8rem;
            font-weight: 700;
            letter-spacing: 0.03em;
        }}
        .badge-green  {{ background: #14532d; color: #22c55e; }}
        .badge-amber  {{ background: #451a03; color: #f59e0b; }}
        .badge-red    {{ background: #450a0a; color: #ef4444; }}

        /* ── Mini progress bar row ─────────────────────────────────────────── */
        .score-row {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
            margin-bottom: 0.3rem;
        }}
        .score-label {{
            font-size: 0.72rem;
            color: {t['text_sec']};
            width: 80px;
            flex-shrink: 0;
        }}
        .score-bar-bg {{
            flex: 1;
            height: 6px;
            background: {t['border']};
            border-radius: 3px;
            overflow: hidden;
        }}
        .score-bar-fill {{
            height: 100%;
            border-radius: 3px;
        }}
        .score-val {{
            font-size: 0.72rem;
            color: {t['text_sec']};
            width: 32px;
            text-align: right;
            flex-shrink: 0;
        }}

        /* ── Section headers in sidebar ────────────────────────────────────── */
        .sidebar-section {{
            font-size: 0.68rem;
            font-weight: 700;
            letter-spacing: 0.12em;
            text-transform: uppercase;
            color: {t['text_sec']};
            padding: 0.6rem 0 0.2rem 0;
            border-top: 1px solid {t['border']};
            margin-top: 0.5rem;
        }}

        /* ── Progress / status box ─────────────────────────────────────────── */
        .progress-box {{
            background: {t['surface']};
            border: 1px solid {t['border']};
            border-radius: 10px;
            padding: 1rem 1.2rem;
            font-family: 'Courier New', monospace;
            font-size: 0.82rem;
            line-height: 1.7;
            white-space: pre-wrap;
            color: {t['text']};
        }}

        /* ── Tab styling ────────────────────────────────────────────────────── */
        .stTabs [data-baseweb="tab-list"] {{
            gap: 4px;
            background: transparent;
            border-bottom: 2px solid {t['border']};
        }}
        .stTabs [data-baseweb="tab"] {{
            border-radius: 8px 8px 0 0;
            padding: 0.4rem 1rem;
            font-weight: 600;
            font-size: 0.88rem;
            background: transparent;
            border: none;
            color: {t['text_sec']};
        }}
        .stTabs [aria-selected="true"] {{
            background: {t['surface']};
            color: {t['accent']} !important;
            border-bottom: 2px solid {t['accent']};
        }}

        /* ── Legend box ─────────────────────────────────────────────────────── */
        .legend-box {{
            display: flex;
            gap: 1.5rem;
            align-items: center;
            margin: 0.8rem 0;
        }}
        .legend-item {{
            display: flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.82rem;
            color: {t['text_sec']};
        }}
        .legend-dot {{
            width: 12px;
            height: 12px;
            border-radius: 50%;
            flex-shrink: 0;
        }}

        /* ── Download section ───────────────────────────────────────────────── */
        .dl-card {{
            background: {t['surface']};
            border: 1px solid {t['border']};
            border-radius: 10px;
            padding: 1.2rem;
            text-align: center;
        }}
        .dl-card .dl-label {{
            font-size: 0.78rem;
            color: {t['text_sec']};
            margin-top: 0.4rem;
        }}

        /* ── Button overrides ───────────────────────────────────────────────── */
        .stButton > button {{
            border-radius: 8px;
            font-weight: 600;
            transition: all 0.15s ease;
        }}
        .stButton > button:hover {{
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(74, 222, 128, 0.25);
        }}
        .stDownloadButton > button {{
            border-radius: 8px;
            font-weight: 600;
        }}

        /* ── Hero section ────────────────────────────────────────────────────── */
        .hero-title {{
            font-size: 3rem;
            font-weight: 900;
            color: {t['text']};
            text-align: center;
            margin-bottom: 0.5rem;
            line-height: 1.1;
        }}
        .hero-title span {{
            color: {t['accent']};
        }}
        .hero-tagline {{
            font-size: 1.05rem;
            color: {t['text_sec']};
            text-align: center;
            margin-bottom: 2rem;
        }}
        .hero-prompt {{
            font-size: 0.9rem;
            color: {t['text_sec']};
            text-align: center;
            margin-top: 2rem;
            padding: 0.8rem;
            border: 1px dashed {t['border']};
            border-radius: 8px;
        }}
        </style>
        """,
        unsafe_allow_html=True,
    )


# ── Utility helpers ───────────────────────────────────────────────────────────

def _gap_badge(score: float) -> str:
    if score >= 70:
        cls = "badge-green"
    elif score >= 50:
        cls = "badge-amber"
    else:
        cls = "badge-red"
    star = " ⭐" if score >= 70 else ""
    return f'<span class="badge {cls}">{score:.1f}{star}</span>'


def _score_bar_html(label: str, value: float, color: str = "#4ade80") -> str:
    pct = max(0.0, min(100.0, value))
    return (
        f'<div class="score-row">'
        f'  <span class="score-label">{label}</span>'
        f'  <div class="score-bar-bg">'
        f'    <div class="score-bar-fill" style="width:{pct}%; background:{color};"></div>'
        f'  </div>'
        f'  <span class="score-val">{value:.0f}</span>'
        f'</div>'
    )


def _bar_color(score: float) -> str:
    if score >= 70:
        return "#22c55e"
    if score >= 50:
        return "#f59e0b"
    return "#ef4444"


def _load_keywords_from_csv_text(text: str) -> list[str]:
    """Parse CSV/text content (already decoded string) into keyword list."""
    keywords: list[str] = []
    for line in text.splitlines():
        kw = line.strip().strip('"').strip("'")
        if not kw or kw.startswith("#") or kw.lower() == "keyword":
            continue
        # Handle comma-separated values within a line
        for part in kw.split(","):
            part = part.strip()
            if part:
                keywords.append(part)
    return keywords


def _deduplicate(keywords: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for kw in keywords:
        norm = kw.lower().strip()
        if norm not in seen and norm:
            seen.add(norm)
            result.append(kw)
    return result


# ── Export helpers (in-memory) ────────────────────────────────────────────────

def _export_csv_bytes(results: list[dict]) -> bytes:
    rows = []
    for r in results:
        row = dict(r)
        row["top_book_titles"] = " | ".join(row.get("top_book_titles") or [])
        row["book_ideas"] = " | ".join(row.get("book_ideas") or [])
        rows.append(row)
    buf = io.StringIO()
    pd.DataFrame(rows).to_csv(buf, index=False)
    return buf.getvalue().encode()


def _export_json_bytes(results: list[dict]) -> bytes:
    sorted_results = sorted(results, key=lambda r: r.get("gap_score", 0), reverse=True)
    return json.dumps(sorted_results, indent=2, default=str).encode()


def _export_md_bytes(results: list[dict], clusters: list[dict]) -> bytes:
    today = date.today().isoformat()
    sorted_results = sorted(results, key=lambda r: r.get("gap_score", 0), reverse=True)
    priority = [r for r in sorted_results if r.get("is_priority")]
    lines = [f"# Niche Hunter Report — {today}", ""]

    lines.append("## PRIORITY NICHES")
    lines.append("")
    if not priority:
        lines.append("_No priority niches found in this run._")
        lines.append("")
    else:
        for rank, r in enumerate(priority, 1):
            kw          = r.get("keyword", "")
            gap         = r.get("gap_score", 0)
            demand      = r.get("demand_score", 0)
            supply      = r.get("supply_score", 0)
            competition = r.get("competition_score", 0)
            amz_count   = r.get("amazon_result_count", 0)
            avg_rev     = r.get("avg_reviews")
            book_ideas  = r.get("book_ideas") or []
            top_titles  = r.get("top_book_titles") or []

            lines.append(f"### {rank}. {kw} — Gap Score: {gap}")
            lines.append("")
            lines.append("**Why this is an opportunity:**")
            lines.append(f"- Demand score: {demand}/100")
            lines.append(f"- Supply score: {supply}/100 ({amz_count} books on Amazon)")
            avg_str = f"{avg_rev:.0f}" if avg_rev is not None else "unknown"
            lines.append(f"- Competition score: {competition}/100 (avg {avg_str} reviews)")
            lines.append("")
            lines.append("**Suggested book angles:**")
            for i, idea in enumerate(book_ideas, 1):
                lines.append(f"{i}. {idea}")
            lines.append("")
            if top_titles:
                lines.append("**Top existing books:**")
                for title in top_titles:
                    lines.append(f"- {title}")
                lines.append("")
            lines.append("---")
            lines.append("")

    if clusters:
        series = [c for c in clusters if c.get("is_series_opportunity")]
        if series:
            lines.append("## SERIES OPPORTUNITIES")
            lines.append("")
            for c in series:
                name = c["cluster_name"].title()
                avg  = c["avg_gap_score"]
                lines.append(f"### {name} Cluster (avg gap: {avg})")
                for kw in c["keywords"]:
                    gap_val = next((r["gap_score"] for r in results if r["keyword"] == kw), 0)
                    lines.append(f"- {kw} (gap: {gap_val})")
                lines.append("")
            lines.append("")

    lines.append("## ALL NICHES ANALYSED")
    lines.append("")
    lines.append("| Keyword | Gap Score | Priority | Amazon # | Trend |")
    lines.append("| --- | --- | --- | --- | --- |")
    for r in sorted_results:
        kw   = r.get("keyword", "")
        gap  = r.get("gap_score", 0)
        pri  = "YES" if r.get("is_priority") else ""
        amz  = r.get("amazon_result_count", 0)
        trnd = r.get("trend_score", 0)
        lines.append(f"| {kw} | {gap} | {pri} | {amz} | {trnd} |")
    lines.append("")

    return "\n".join(lines).encode()


# ── Progress renderer ─────────────────────────────────────────────────────────

def _render_progress() -> str:
    t = _get_theme()
    inner = "\n".join(st.session_state.progress_lines)
    return f'<div class="progress-box">{inner}</div>'


# ── Plotly chart ──────────────────────────────────────────────────────────────

def _build_chart(results: list[dict]) -> go.Figure:
    is_dark = st.session_state.theme == "dark"
    template = "plotly_dark" if is_dark else "plotly_white"
    t = _get_theme()

    sorted_r = sorted(results, key=lambda r: r.get("gap_score", 0))
    keywords = [r.get("keyword", "") for r in sorted_r]
    gaps     = [r.get("gap_score", 0) for r in sorted_r]
    colors   = [_bar_color(g) for g in gaps]

    customdata = [
        [
            r.get("demand_score", 0),
            r.get("supply_score", 0),
            r.get("competition_score", 0),
            r.get("trend_score", 0),
            r.get("amazon_result_count", 0),
            r.get("avg_reviews") or "—",
        ]
        for r in sorted_r
    ]

    fig = go.Figure(
        go.Bar(
            x=gaps,
            y=keywords,
            orientation="h",
            marker=dict(
                color=colors,
                line=dict(width=0),
            ),
            customdata=customdata,
            hovertemplate=(
                "<b>%{y}</b><br>"
                "Gap Score: <b>%{x:.1f}</b><br>"
                "Demand: %{customdata[0]:.1f} | "
                "Supply: %{customdata[1]:.1f} | "
                "Competition: %{customdata[2]:.1f}<br>"
                "Trend: %{customdata[3]:.1f} | "
                "Amazon #: %{customdata[4]} | "
                "Avg Reviews: %{customdata[5]}"
                "<extra></extra>"
            ),
        )
    )
    fig.update_layout(
        template=template,
        plot_bgcolor=t["surface"],
        paper_bgcolor=t["bg"],
        font=dict(color=t["text"], size=12),
        xaxis=dict(
            title="Gap Score",
            range=[0, 105],
            gridcolor=t["border"],
            zeroline=False,
        ),
        yaxis=dict(
            title=None,
            gridcolor=t["border"],
            tickfont=dict(size=11),
        ),
        margin=dict(l=10, r=20, t=20, b=40),
        height=max(350, len(results) * 30 + 80),
        bargap=0.35,
        hoverlabel=dict(
            bgcolor=t["surface"],
            bordercolor=t["border"],
            font=dict(color=t["text"]),
        ),
        shapes=[
            dict(type="line", x0=70, x1=70, y0=-0.5, y1=len(results) - 0.5,
                 line=dict(color="#22c55e", width=1.5, dash="dash")),
            dict(type="line", x0=50, x1=50, y0=-0.5, y1=len(results) - 0.5,
                 line=dict(color="#f59e0b", width=1.5, dash="dot")),
        ],
    )
    return fig


# ── Results DataFrame ─────────────────────────────────────────────────────────

def _build_dataframe(results: list[dict]) -> pd.DataFrame:
    rows = []
    for r in results:
        rows.append({
            "Keyword":     r.get("keyword", ""),
            "Gap Score":   r.get("gap_score", 0.0),
            "Priority":    "⭐ YES" if r.get("is_priority") else "no",
            "Demand":      r.get("demand_score", 0.0),
            "Supply":      r.get("supply_score", 0.0),
            "Competition": r.get("competition_score", 0.0),
            "Amazon #":    r.get("amazon_result_count", 0),
            "Trend":       r.get("trend_score", 0.0),
            "Avg Reviews": r.get("avg_reviews") if r.get("avg_reviews") is not None else 0,
        })
    return pd.DataFrame(rows)


def _style_gap(val: float) -> str:
    if val >= 70:
        return "color: #22c55e; font-weight: bold"
    if val >= 50:
        return "color: #f59e0b; font-weight: bold"
    return "color: #ef4444"


# ── Pipeline runner ───────────────────────────────────────────────────────────

def run_pipeline(
    keywords: list[str],
    skip_amazon: bool,
    bypass_cache: bool,
    progress_bar,
    status_placeholder,
) -> list[dict]:
    """Execute the full analysis pipeline with live UI updates."""
    if bypass_cache:
        disable_cache()

    results: list[dict] = []
    total = len(keywords)

    for idx, kw in enumerate(keywords, 1):
        st.session_state.progress_lines.append(
            f"<span style='color:#4ade80;font-weight:700;'>[{idx}/{total}]</span> "
            f"<span style='font-weight:600;'>{kw}</span>"
        )
        status_placeholder.markdown(_render_progress(), unsafe_allow_html=True)

        # Google Trends
        trend_score = 0.0
        try:
            trend_score = get_trend_score(kw) or 0.0
            st.session_state.progress_lines.append(
                f"  <span style='color:#22c55e;'>✓</span> Google Trends  "
                f"<span style='color:#8892a4;'>(score: {trend_score:.0f})</span>"
            )
        except Exception as e:
            st.session_state.progress_lines.append(
                f"  <span style='color:#ef4444;'>✗</span> Google Trends  "
                f"<span style='color:#8892a4;'>(error: {e})</span>"
            )
        status_placeholder.markdown(_render_progress(), unsafe_allow_html=True)

        # Google Books
        gbooks_count = 0
        try:
            gbooks_count = count_books(kw) or 0
            st.session_state.progress_lines.append(
                f"  <span style='color:#22c55e;'>✓</span> Google Books   "
                f"<span style='color:#8892a4;'>({gbooks_count:,} books)</span>"
            )
        except Exception as e:
            st.session_state.progress_lines.append(
                f"  <span style='color:#ef4444;'>✗</span> Google Books   "
                f"<span style='color:#8892a4;'>(error: {e})</span>"
            )
        status_placeholder.markdown(_render_progress(), unsafe_allow_html=True)

        # Open Library
        oplib_count = 0
        try:
            oplib_count = count_works(kw) or 0
            st.session_state.progress_lines.append(
                f"  <span style='color:#22c55e;'>✓</span> Open Library   "
                f"<span style='color:#8892a4;'>({oplib_count:,} works)</span>"
            )
        except Exception as e:
            st.session_state.progress_lines.append(
                f"  <span style='color:#ef4444;'>✗</span> Open Library   "
                f"<span style='color:#8892a4;'>(error: {e})</span>"
            )
        status_placeholder.markdown(_render_progress(), unsafe_allow_html=True)

        # Reddit
        reddit_posts  = []
        reddit_demand = 0.0
        try:
            reddit_posts  = search_reddit(kw) or []
            reddit_demand = score_demand_from_reddit(reddit_posts)
            st.session_state.progress_lines.append(
                f"  <span style='color:#22c55e;'>✓</span> Reddit         "
                f"<span style='color:#8892a4;'>({len(reddit_posts)} posts, "
                f"demand: {reddit_demand:.0f})</span>"
            )
        except Exception as e:
            st.session_state.progress_lines.append(
                f"  <span style='color:#ef4444;'>✗</span> Reddit         "
                f"<span style='color:#8892a4;'>(error: {e})</span>"
            )
        status_placeholder.markdown(_render_progress(), unsafe_allow_html=True)

        # Amazon
        amazon_data = {}
        if skip_amazon:
            st.session_state.progress_lines.append(
                "  <span style='color:#8892a4;'>–</span> Amazon         "
                "<span style='color:#8892a4;'>(skipped)</span>"
            )
        else:
            try:
                amazon_data = search_amazon(kw) or {}
                amz_count   = amazon_data.get("total_results", 0)
                amz_blocked = amazon_data.get("blocked", False)
                if amz_blocked:
                    st.session_state.progress_lines.append(
                        "  <span style='color:#f59e0b;'>!</span> Amazon         "
                        "<span style='color:#8892a4;'>(blocked — CAPTCHA)</span>"
                    )
                else:
                    top_bsr_vals = [b["bsr"] for b in amazon_data.get("top_books", []) if b.get("bsr")]
                    top_bsr_str  = f"{min(top_bsr_vals):,}" if top_bsr_vals else "n/a"
                    st.session_state.progress_lines.append(
                        f"  <span style='color:#22c55e;'>✓</span> Amazon         "
                        f"<span style='color:#8892a4;'>({amz_count:,} results, "
                        f"top BSR: {top_bsr_str})</span>"
                    )
            except Exception as e:
                st.session_state.progress_lines.append(
                    f"  <span style='color:#ef4444;'>✗</span> Amazon         "
                    f"<span style='color:#8892a4;'>(error: {e})</span>"
                )
        status_placeholder.markdown(_render_progress(), unsafe_allow_html=True)

        # Calculate gap score
        top_books   = amazon_data.get("top_books") or []
        amz_count   = amazon_data.get("total_results", 0)
        amz_blocked = amazon_data.get("blocked", False) or skip_amazon

        metrics = {
            "keyword":             kw,
            "trend_score":         trend_score,
            "reddit_demand_score": reddit_demand,
            "amazon_result_count": amz_count,
            "top_books":           top_books,
            "amazon_blocked":      amz_blocked,
            "google_books_count":  gbooks_count,
            "open_library_count":  oplib_count,
        }
        try:
            scored = calculate_gap_score(metrics)
        except Exception as e:
            st.error(f"Gap score error for '{kw}': {e}")
            progress_bar.progress(idx / total)
            continue

        # Mark insufficient data
        if (trend_score == 0 and reddit_demand == 0 and
                gbooks_count == 0 and oplib_count == 0 and amz_count == 0):
            scored["insufficient_data"] = True

        results.append(scored)
        gap = scored["gap_score"]
        pri = " ⭐" if scored["is_priority"] else ""
        insuf = " <span style='color:#8892a4;'>(Insufficient Data)</span>" if scored.get("insufficient_data") else ""
        color = _bar_color(gap)
        st.session_state.progress_lines.append(
            f"  <span style='color:#60a5fa;font-weight:700;'>→ Gap Score: "
            f"<span style='color:{color};'>{gap:.1f}</span>{pri}</span>{insuf}"
        )
        st.session_state.progress_lines.append("")  # blank spacer
        progress_bar.progress(idx / total)
        status_placeholder.markdown(_render_progress(), unsafe_allow_html=True)

    return sorted(results, key=lambda r: r.get("gap_score", 0), reverse=True)


# ── Sidebar ───────────────────────────────────────────────────────────────────

def render_sidebar() -> tuple[list[str], bool, bool, bool, bool, int]:
    """Render sidebar and return (keywords, run_clicked, clear_clicked, skip_amazon, bypass_cache, max_kw)."""
    with st.sidebar:
        # Logo
        st.markdown(
            """
            <div style="padding: 0.2rem 0 0.5rem 0;">
              <div style="font-size:1.45rem;font-weight:900;letter-spacing:0.04em;">
                🔍 NICHE HUNTER
              </div>
              <div style="font-size:0.75rem;color:#8892a4;margin-top:0.2rem;">
                Amazon KDP Gap Finder
              </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Theme toggle
        col_l, col_r = st.columns([3, 1])
        with col_l:
            st.markdown(
                f"<span style='font-size:0.8rem;color:#8892a4;'>Theme: "
                f"{'Dark' if st.session_state.theme == 'dark' else 'Light'}</span>",
                unsafe_allow_html=True,
            )
        with col_r:
            icon = "☀️" if st.session_state.theme == "dark" else "🌙"
            if st.button(icon, key="theme_toggle", help="Toggle light/dark theme"):
                st.session_state.theme = "light" if st.session_state.theme == "dark" else "dark"
                st.rerun()

        # Keywords section
        st.markdown('<div class="sidebar-section">── KEYWORDS ──</div>', unsafe_allow_html=True)

        kw_text = st.text_area(
            "Keywords (comma-separated or one per line)",
            placeholder="anxiety workbook for teens\nbudget planner for families\nstoicism for beginners",
            height=130,
            label_visibility="collapsed",
            key="kw_text_input",
        )

        uploaded_file = st.file_uploader(
            "Upload CSV / TXT",
            type=["csv", "txt"],
            help="One keyword per line, or comma-separated. Header row 'keyword' is ignored.",
            label_visibility="visible",
        )

        # Options section
        st.markdown('<div class="sidebar-section">── OPTIONS ──</div>', unsafe_allow_html=True)

        bypass_cache = st.toggle("Bypass Cache", value=False, help="Ignore cached data and fetch fresh results")
        skip_amazon  = st.toggle("Skip Amazon", value=False, help="Skip Amazon scraping (faster, less accurate)")
        expand_kw    = st.toggle("Expand Keywords", value=False, help="Auto-expand each keyword with audience/format variants")

        max_kw = st.slider(
            "Max Keywords",
            min_value=5,
            max_value=50,
            value=20,
            step=5,
            help="Maximum number of keywords to analyse",
        )

        st.markdown("<br>", unsafe_allow_html=True)

        run_clicked = st.button(
            "🔍 Run Analysis",
            type="primary",
            use_container_width=True,
            disabled=st.session_state.running,
        )

        clear_clicked = st.button(
            "🗑️ Clear Results",
            use_container_width=True,
            disabled=st.session_state.running,
        )

    # Parse keywords from text input and upload
    keywords: list[str] = []
    if kw_text:
        for line in kw_text.replace(",", "\n").splitlines():
            part = line.strip()
            if part:
                keywords.append(part)

    if uploaded_file is not None:
        try:
            content = uploaded_file.getvalue().decode("utf-8")
            keywords += _load_keywords_from_csv_text(content)
        except Exception as e:
            st.sidebar.error(f"Could not read uploaded file: {e}")

    keywords = _deduplicate(keywords)

    # Optional expand
    if expand_kw and keywords:
        try:
            from analysis.expander import expand_keywords
            before = len(keywords)
            keywords = _deduplicate(expand_keywords(keywords))
        except Exception:
            pass

    keywords = keywords[:max_kw]

    return keywords, run_clicked, clear_clicked, skip_amazon, bypass_cache, max_kw


# ── Landing state ─────────────────────────────────────────────────────────────

def render_landing() -> None:
    t = _get_theme()
    st.markdown(
        """
        <div class="hero-title">Find Your <span>KDP</span> Goldmine</div>
        <div class="hero-tagline">Find underserved book niches before anyone else does</div>
        """,
        unsafe_allow_html=True,
    )

    c1, c2, c3 = st.columns(3)
    cards = [
        ("📈", "Demand Analysis", "Combines Google Trends & Reddit signals to measure how hungry readers are for a topic."),
        ("📚", "Supply Mapping", "Cross-references Google Books, Open Library, and Amazon to quantify how crowded the shelf already is."),
        ("⚔️", "Competition Score", "Analyses BSR and review counts of existing top books — low reviews = opportunity."),
    ]
    for col, (icon, title, desc) in zip([c1, c2, c3], cards):
        with col:
            st.markdown(
                f"""
                <div class="feature-card">
                  <div class="feature-icon">{icon}</div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.markdown("<br>", unsafe_allow_html=True)

    # Gap score legend
    st.markdown(
        """
        <div style="text-align:center;margin-bottom:0.3rem;font-size:0.78rem;color:#8892a4;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;">Gap Score Legend</div>
        <div class="legend-box" style="justify-content:center;">
          <div class="legend-item"><div class="legend-dot" style="background:#22c55e;"></div> ≥ 70 — Priority Niche ⭐</div>
          <div class="legend-item"><div class="legend-dot" style="background:#f59e0b;"></div> 50–69 — Moderate Opportunity</div>
          <div class="legend-item"><div class="legend-dot" style="background:#ef4444;"></div> &lt; 50 — Crowded / Low Demand</div>
        </div>
        """,
        unsafe_allow_html=True,
    )

    st.markdown(
        '<div class="hero-prompt">← Enter keywords in the sidebar to begin</div>',
        unsafe_allow_html=True,
    )


# ── Running state ─────────────────────────────────────────────────────────────

def render_running(keywords: list[str], skip_amazon: bool, bypass_cache: bool) -> None:
    st.markdown("### Analysis in Progress…")
    progress_bar = st.progress(0.0, text="Initialising scrapers…")
    status_placeholder = st.empty()

    st.session_state.progress_lines = []
    st.session_state.running = True

    try:
        results = run_pipeline(
            keywords=keywords,
            skip_amazon=skip_amazon,
            bypass_cache=bypass_cache,
            progress_bar=progress_bar,
            status_placeholder=status_placeholder,
        )
        clusters = cluster_niches(results)
        st.session_state.results  = results
        st.session_state.clusters = clusters
        progress_bar.progress(1.0, text="Complete!")
    except Exception as e:
        st.error(f"Pipeline error: {e}")
    finally:
        st.session_state.running = False

    st.rerun()


# ── Results state ─────────────────────────────────────────────────────────────

def render_results() -> None:
    results  = st.session_state.results
    clusters = st.session_state.clusters

    if not results:
        st.info("No results available. Run the analysis first.")
        return

    # ── 4 Metric cards ────────────────────────────────────────────────────────
    total     = len(results)
    priority  = sum(1 for r in results if r.get("is_priority"))
    top_score = max(r.get("gap_score", 0) for r in results)
    series    = sum(1 for c in clusters if c.get("is_series_opportunity"))

    m1, m2, m3, m4 = st.columns(4)
    for col, label, value, sub in [
        (m1, "Keywords Analysed",    str(total),           "total in this run"),
        (m2, "Priority Niches ⭐",   str(priority),        "above gap score 70"),
        (m3, "Top Gap Score",        f"{top_score:.1f}",   "highest opportunity"),
        (m4, "Series Opportunities", str(series),          "multi-book clusters"),
    ]:
        with col:
            st.markdown(
                f"""
                <div class="metric-card">
                  <div class="metric-label">{label}</div>
                  <div class="metric-value">{value}</div>
                  <div class="metric-sub">{sub}</div>
                </div>
                """,
                unsafe_allow_html=True,
            )

    st.markdown("<br>", unsafe_allow_html=True)

    # ── Tabs ──────────────────────────────────────────────────────────────────
    tab_overview, tab_priority, tab_all, tab_download = st.tabs(
        ["📊 Overview", "⭐ Priority Niches", "📋 All Results", "💾 Download"]
    )

    # ── Tab: Overview ─────────────────────────────────────────────────────────
    with tab_overview:
        st.markdown("#### Gap Score Overview")
        fig = _build_chart(results)
        st.plotly_chart(fig, use_container_width=True)

        # Legend
        st.markdown(
            """
            <div class="legend-box">
              <div class="legend-item"><div class="legend-dot" style="background:#22c55e;"></div> ≥ 70 Priority</div>
              <div class="legend-item"><div class="legend-dot" style="background:#f59e0b;"></div> 50–69 Moderate</div>
              <div class="legend-item"><div class="legend-dot" style="background:#ef4444;"></div> &lt; 50 Crowded</div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        # Cluster / series summary
        if clusters:
            st.markdown("---")
            st.markdown("#### Keyword Clusters")
            for c in clusters:
                icon = "📚" if c.get("is_series_opportunity") else "🔗"
                label = f"{icon} **{c['cluster_name'].title()} cluster** — avg gap {c['avg_gap_score']:.1f}"
                if c.get("is_series_opportunity"):
                    label += " ⭐ Series Opportunity"
                with st.expander(label, expanded=False):
                    kws_in_cluster = c.get("keywords", [])
                    for kw in kws_in_cluster:
                        kw_result = next((r for r in results if r["keyword"] == kw), None)
                        if kw_result:
                            g = kw_result["gap_score"]
                            st.markdown(
                                f"- {kw} — {_gap_badge(g)}",
                                unsafe_allow_html=True,
                            )
                        else:
                            st.markdown(f"- {kw}")
                    if c.get("series_note"):
                        st.info(c["series_note"])

    # ── Tab: Priority Niches ─────────────────────────────────────────────────
    with tab_priority:
        priority_results = sorted(
            [r for r in results if r.get("is_priority")],
            key=lambda r: r.get("gap_score", 0),
            reverse=True,
        )

        if not priority_results:
            st.markdown(
                """
                <div style="text-align:center;padding:3rem 1rem;">
                  <div style="font-size:2.5rem;margin-bottom:1rem;">🔍</div>
                  <div style="font-size:1.1rem;font-weight:600;margin-bottom:0.5rem;">No Priority Niches Found</div>
                  <div style="color:#8892a4;font-size:0.9rem;">Try these tips:</div>
                  <ul style="text-align:left;display:inline-block;margin-top:0.8rem;color:#8892a4;font-size:0.88rem;">
                    <li>Use more specific, long-tail keywords (3+ words)</li>
                    <li>Try niche sub-topics rather than broad categories</li>
                    <li>Enable "Skip Amazon" for faster results and less noise</li>
                    <li>Check that your keywords have real search demand</li>
                  </ul>
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            for r in priority_results:
                kw          = r.get("keyword", "")
                gap         = r.get("gap_score", 0.0)
                demand      = r.get("demand_score", 0.0)
                supply      = r.get("supply_score", 0.0)
                competition = r.get("competition_score", 0.0)
                book_ideas  = r.get("book_ideas") or []
                top_titles  = r.get("top_book_titles") or []

                demand_color     = "#22c55e" if demand >= 60 else "#f59e0b"
                supply_color     = "#22c55e" if supply >= 60 else "#f59e0b"
                competition_color = "#22c55e" if competition >= 60 else "#f59e0b"

                bars_html = (
                    _score_bar_html("Demand",      demand,      demand_color) +
                    _score_bar_html("Supply",       supply,      supply_color) +
                    _score_bar_html("Competition",  competition, competition_color)
                )

                ideas_html = "".join(f"<li>{idea}</li>" for idea in book_ideas)
                titles_html = ""
                if top_titles:
                    titles_html = (
                        "<div style='margin-top:0.8rem;'>"
                        "<div style='font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#8892a4;margin-bottom:0.3rem;'>Top Existing Books</div>"
                        "<ul style='margin:0;padding-left:1.1rem;font-size:0.85rem;'>"
                        + "".join(f"<li>{t}</li>" for t in top_titles)
                        + "</ul></div>"
                    )

                st.markdown(
                    f"""
                    <div class="niche-card priority">
                      <div class="niche-card-header">
                        <div class="niche-title">{kw}</div>
                        {_gap_badge(gap)}
                      </div>
                      {bars_html}
                      <div style="margin-top:0.9rem;">
                        <div style="font-size:0.78rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#8892a4;margin-bottom:0.3rem;">
                          Suggested Book Angles
                        </div>
                        <ul style="margin:0;padding-left:1.1rem;font-size:0.85rem;">
                          {ideas_html}
                        </ul>
                      </div>
                      {titles_html}
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

    # ── Tab: All Results ─────────────────────────────────────────────────────
    with tab_all:
        min_gap = st.slider(
            "Filter: Minimum Gap Score",
            min_value=0,
            max_value=100,
            value=0,
            step=5,
            key="all_results_filter",
        )

        filtered = [r for r in results if r.get("gap_score", 0) >= min_gap]
        df = _build_dataframe(filtered)

        if df.empty:
            st.info(f"No results with gap score ≥ {min_gap}.")
        else:
            styled = (
                df.style
                .applymap(_style_gap, subset=["Gap Score"])
                .format({
                    "Gap Score":   "{:.1f}",
                    "Demand":      "{:.1f}",
                    "Supply":      "{:.1f}",
                    "Competition": "{:.1f}",
                    "Trend":       "{:.1f}",
                    "Avg Reviews": "{:.0f}",
                })
            )
            st.dataframe(styled, use_container_width=True, hide_index=True)
            st.caption(f"Showing {len(filtered)} of {len(results)} keywords.")

    # ── Tab: Download ────────────────────────────────────────────────────────
    with tab_download:
        today = date.today().isoformat()

        # Pre-compute all three
        csv_bytes  = _export_csv_bytes(results)
        json_bytes = _export_json_bytes(results)
        md_bytes   = _export_md_bytes(results, clusters)

        d1, d2, d3 = st.columns(3)

        with d1:
            st.markdown('<div class="dl-card">', unsafe_allow_html=True)
            st.download_button(
                label="📥 Download CSV",
                data=csv_bytes,
                file_name=f"{today}_niche_report.csv",
                mime="text/csv",
                use_container_width=True,
            )
            st.markdown(
                f'<div class="dl-label">{len(csv_bytes) / 1024:.1f} KB · {len(results)} rows</div>',
                unsafe_allow_html=True,
            )
            st.markdown("</div>", unsafe_allow_html=True)

        with d2:
            st.markdown('<div class="dl-card">', unsafe_allow_html=True)
            st.download_button(
                label="📥 Download JSON",
                data=json_bytes,
                file_name=f"{today}_niche_report.json",
                mime="application/json",
                use_container_width=True,
            )
            st.markdown(
                f'<div class="dl-label">{len(json_bytes) / 1024:.1f} KB · {len(results)} records</div>',
                unsafe_allow_html=True,
            )
            st.markdown("</div>", unsafe_allow_html=True)

        with d3:
            st.markdown('<div class="dl-card">', unsafe_allow_html=True)
            st.download_button(
                label="📥 Download Summary MD",
                data=md_bytes,
                file_name=f"{today}_summary.md",
                mime="text/markdown",
                use_container_width=True,
            )
            st.markdown(
                f'<div class="dl-label">{len(md_bytes) / 1024:.1f} KB · Markdown report</div>',
                unsafe_allow_html=True,
            )
            st.markdown("</div>", unsafe_allow_html=True)


# ── Main entrypoint ───────────────────────────────────────────────────────────

def main() -> None:
    _inject_css()

    keywords, run_clicked, clear_clicked, skip_amazon, bypass_cache, max_kw = render_sidebar()

    # Clear action
    if clear_clicked:
        st.session_state.results        = []
        st.session_state.clusters       = []
        st.session_state.progress_lines = []
        st.session_state.running        = False
        st.rerun()

    # Dispatch to the correct state
    if st.session_state.running:
        render_running(keywords, skip_amazon, bypass_cache)

    elif run_clicked:
        if not keywords:
            st.error("Please enter at least one keyword in the sidebar before running.")
        else:
            st.session_state.running = True
            render_running(keywords, skip_amazon, bypass_cache)

    elif st.session_state.results:
        render_results()

    else:
        render_landing()


if __name__ == "__main__":
    main()
