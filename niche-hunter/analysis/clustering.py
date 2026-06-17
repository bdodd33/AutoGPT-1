"""
analysis/clustering.py
Groups related high-scoring niches into keyword clusters.
A cluster with 3+ related keywords is flagged as a "SERIES OPPORTUNITY".
"""

from collections import defaultdict, Counter

from config import PRIORITY_GAP_SCORE

_STOP_WORDS = {"for", "the", "a", "an", "to", "how", "and", "of", "in", "with"}


def _meaningful_words(keyword: str) -> list[str]:
    """Return non-stop words from a keyword string."""
    return [w for w in keyword.lower().split() if w not in _STOP_WORDS and len(w) > 1]


def cluster_niches(results: list[dict]) -> list[dict]:
    """
    Group PRIORITY niches (gap_score >= PRIORITY_GAP_SCORE) by shared
    meaningful words. Returns a list of cluster dicts sorted by avg_gap_score.

    Each cluster:
    {
        "cluster_name": str,              # most common shared word
        "keywords": list[str],
        "avg_gap_score": float,
        "is_series_opportunity": bool,    # True if 3+ keywords
        "series_note": str,
    }
    """
    priority = [r for r in results if r.get("gap_score", 0) >= PRIORITY_GAP_SCORE]
    if not priority:
        return []

    # Build inverted index: word → list of keyword strings
    word_to_kws: dict[str, list[str]] = defaultdict(list)
    kw_scores: dict[str, float] = {}

    for r in priority:
        kw = r["keyword"]
        kw_scores[kw] = r["gap_score"]
        for word in _meaningful_words(kw):
            word_to_kws[word].append(kw)

    # Only keep words that appear in 2+ keywords
    cluster_words = {w: kws for w, kws in word_to_kws.items() if len(kws) >= 2}
    if not cluster_words:
        return []

    # Assign each keyword to its best cluster (highest membership word)
    assigned: set[str] = set()
    clusters: list[dict] = []

    for word, kws in sorted(cluster_words.items(), key=lambda x: -len(x[1])):
        members = [k for k in kws if k not in assigned]
        if len(members) < 2:
            continue
        for k in members:
            assigned.add(k)
        avg_gap = sum(kw_scores[k] for k in members) / len(members)
        is_series = len(members) >= 3
        clusters.append({
            "cluster_name": word,
            "keywords": members,
            "avg_gap_score": round(avg_gap, 2),
            "is_series_opportunity": is_series,
            "series_note": (
                f"Write {max(3, len(members) + 1)}-{max(5, len(members) + 2)} books in this cluster. "
                "Each book cross-promotes the others. Dominate the niche shelf."
                if is_series else ""
            ),
        })

    return sorted(clusters, key=lambda c: -c["avg_gap_score"])
