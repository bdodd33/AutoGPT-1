#!/usr/bin/env python3
"""
Opportunity scoring engine for the Website Rental (Rank & Rent) business.

Reads data/niches.csv and data/cities.csv, scores every niche x city
combination (20 x 20 = 400 combos), and writes data/opportunity_matrix.csv
ranked best-to-worst. Also prints the Top 25 combos and the best niche +
best city overall.

Scoring is intentionally weighted toward what produces CASH IN 30 DAYS:
  - "rankability" (how easy it is to rank a brand-new site/GBP fast)
  - "urgency"     (emergency / fast-close niches pay out immediately)
without ignoring long-term value (job size) and raw demand (lead flow).

No third-party dependencies. Run:  python3 tools/opportunity_score.py
"""

import csv
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")

# ---- Weights (must sum to 1.0 within each group) -------------------------
NICHE_WEIGHTS = {
    "value_score": 0.25,       # job size / commission potential -> long-term ceiling
    "demand_score": 0.25,      # search volume / lead flow
    "rankability_score": 0.25, # how fast a NEW site/GBP can rank (speed to cash)
    "urgency_score": 0.25,     # emergency/fast-close -> revenue inside 30 days
}
CITY_WEIGHTS = {
    "growth_score": 0.25,      # tailwind: more new movers = more service demand
    "demand_score": 0.30,      # market size / lead volume
    "rankability_score": 0.35, # less SEO competition = rank faster (speed to cash)
    "affluence_score": 0.10,   # ability to pay premium job prices
}
# Final blend: niches matter a bit more than the city you put them in.
NICHE_BLEND = 0.60
CITY_BLEND = 0.40


def load(path):
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def niche_score(n):
    s = sum(float(n[k]) * w for k, w in NICHE_WEIGHTS.items())
    return round(s, 3)  # 0-10 scale


def city_score(c):
    s = sum(float(c[k]) * w for k, w in CITY_WEIGHTS.items())
    return round(s, 3)  # 0-10 scale


def est_monthly_rent(n, c):
    """Midpoint niche rent, modulated by city demand & affluence."""
    mid = (float(n["rent_low_usd"]) + float(n["rent_high_usd"])) / 2.0
    city_mult = 0.80 + 0.04 * (float(c["demand_score"]) + float(c["affluence_score"])) / 2.0
    return int(round(mid * city_mult / 50.0) * 50)  # round to nearest $50


def main():
    niches = load(os.path.join(DATA, "niches.csv"))
    cities = load(os.path.join(DATA, "cities.csv"))

    rows = []
    for n in niches:
        ns = niche_score(n)
        for c in cities:
            cs = city_score(c)
            combo = round((ns * NICHE_BLEND + cs * CITY_BLEND) * 10, 1)  # 0-100
            rows.append({
                "rank": 0,
                "niche": n["niche"],
                "city": f'{c["city"]}, {c["state"]}',
                "opportunity_score": combo,
                "niche_score": round(ns * 10, 1),
                "city_score": round(cs * 10, 1),
                "est_monthly_rent_usd": est_monthly_rent(n, c),
                "avg_job_value_usd": int(float(n["avg_job_value_usd"])),
                "best_lead_model": n["best_lead_model"],
            })

    rows.sort(key=lambda r: (-r["opportunity_score"], -r["est_monthly_rent_usd"]))
    for i, r in enumerate(rows, 1):
        r["rank"] = i

    out = os.path.join(DATA, "opportunity_matrix.csv")
    with open(out, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader()
        w.writerows(rows)

    # ---- Console report --------------------------------------------------
    print(f"Scored {len(rows)} niche x city combinations -> {out}\n")

    print("TOP 25 NICHE x CITY OPPORTUNITIES (speed-to-cash weighted)")
    print(f'{"#":>3}  {"Niche":<26}{"City":<24}{"Score":>6}{"Est.Rent":>10}')
    print("-" * 70)
    for r in rows[:25]:
        print(f'{r["rank"]:>3}  {r["niche"]:<26}{r["city"]:<24}'
              f'{r["opportunity_score"]:>6}${r["est_monthly_rent_usd"]:>8,}')

    # Best overall niche & city (by average combo score)
    def avg_by(key):
        agg = {}
        for r in rows:
            agg.setdefault(r[key], []).append(r["opportunity_score"])
        return sorted(((k, round(sum(v) / len(v), 1)) for k, v in agg.items()),
                      key=lambda x: -x[1])

    print("\nBEST NICHES OVERALL (avg score across all cities):")
    for k, v in avg_by("niche")[:5]:
        print(f"  {v:>5}  {k}")
    print("\nBEST CITIES OVERALL (avg score across all niches):")
    for k, v in avg_by("city")[:5]:
        print(f"  {v:>5}  {k}")


if __name__ == "__main__":
    main()
