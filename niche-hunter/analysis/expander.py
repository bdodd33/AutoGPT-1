"""
analysis/expander.py
Generates long-tail keyword variants from seed keywords by applying
audience, format, and qualifier modifiers.
"""

_AUDIENCE_MODIFIERS = ["for beginners", "for women", "for men", "for teens", "for seniors", "for kids"]
_FORMAT_MODIFIERS   = ["workbook", "journal", "guide", "handbook"]
_QUALIFIER_MODIFIERS = ["how to", "the complete", "simple"]

# Words whose presence means the seed already has a modifier — skip expansion
_MODIFIER_WORDS = {
    "beginners", "beginner", "women", "men", "teens", "teen",
    "seniors", "senior", "kids", "kid",
    "workbook", "journal", "guide", "handbook",
    "complete", "simple",
}

_TOTAL_CAP = 50
_PER_SEED_CAP = 10


def _has_modifier(keyword: str) -> bool:
    words = set(keyword.lower().split())
    return bool(words & _MODIFIER_WORDS)


def expand_keywords(seeds: list[str]) -> list[str]:
    """
    For each seed keyword, generate up to 10 long-tail variants covering
    audience, format, and qualifier modifiers — unless the seed already
    contains a modifier word.

    Rules:
    - Skip expansion when seed already contains a modifier word
    - Cap at 10 variants per seed
    - Deduplicate across all seeds (case-insensitive)
    - Return seeds + all variants as a flat list
    - Cap total output at 50 keywords
    """
    seen: set[str] = set()
    result: list[str] = []

    def _add(kw: str) -> bool:
        norm = kw.lower().strip()
        if norm not in seen:
            seen.add(norm)
            result.append(kw)
            return True
        return False

    for seed in seeds:
        _add(seed)

    for seed in seeds:
        if _has_modifier(seed):
            continue

        variants: list[str] = []
        for mod in _AUDIENCE_MODIFIERS:
            variants.append(f"{seed} {mod}")
        for mod in _FORMAT_MODIFIERS:
            variants.append(f"{seed} {mod}")
        for mod in _QUALIFIER_MODIFIERS:
            variants.append(f"{mod} {seed}")

        count = 0
        for v in variants:
            if count >= _PER_SEED_CAP:
                break
            if _add(v):
                count += 1

        if len(result) >= _TOTAL_CAP:
            break

    return result[:_TOTAL_CAP]
