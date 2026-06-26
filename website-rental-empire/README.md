# 🏠 Website Rental Empire

**A complete, execute-ready "Rank & Rent" local lead-generation business in a box.**

Build simple websites that rank for local service searches (junk removal, water
damage, roofing, towing…), capture the phone calls and form leads, and **rent
those leads to local business owners for recurring monthly income** — the model
Chris Koerner popularized and that operators like "the Website Landlord" run to
$100K+/month.

This repo is the operating system for that business: the strategy, the data, the
scripts, the sales playbooks, and a **30-day sprint engineered to bank $6,000+.**

> ⚠️ **Reality check, up front.** Pure organic SEO rarely ranks a brand-new site
> to the top of Google in 30 days. So this plan **does not bet the first $6K on
> SEO.** It front-loads cash with channels that turn on in days — Google
> Business Profile, Local Services Ads, paid-ad arbitrage, QR yard signs, and
> *pre-selling* leads to hungry contractors — while the rank-and-rent asset
> matures behind it into passive income. See
> [`docs/01-30-DAY-SPRINT.md`](docs/01-30-DAY-SPRINT.md).

---

## 📦 What's inside

| File | What it gives you |
|---|---|
| [`docs/00-MASTER-PLAN.md`](docs/00-MASTER-PLAN.md) | The full business model, how the money works, and the 90-day arc |
| [`docs/01-30-DAY-SPRINT.md`](docs/01-30-DAY-SPRINT.md) | **Day-by-day playbook to $6,000 in 30 days** |
| [`docs/02-NICHE-CITY-MATRIX.md`](docs/02-NICHE-CITY-MATRIX.md) | The **20 best niches × 20 best cities**, scored and ranked |
| [`docs/03-SITE-BUILD-PLAYBOOK.md`](docs/03-SITE-BUILD-PLAYBOOK.md) | Build + rank a lead-gen site (on-page, GBP, citations, calls) |
| [`docs/04-LEAD-GEN-CHANNELS.md`](docs/04-LEAD-GEN-CHANNELS.md) | Every fast lead channel + the QR yard-sign tactic |
| [`docs/05-SALES-PLAYBOOK.md`](docs/05-SALES-PLAYBOOK.md) | Find, pitch, and close the contractor who rents your leads |
| [`docs/06-PRICING-AND-CONTRACTS.md`](docs/06-PRICING-AND-CONTRACTS.md) | The 10× pricing rule + a ready rental agreement |
| [`docs/07-FINANCIAL-MODEL.md`](docs/07-FINANCIAL-MODEL.md) | Unit economics, the math to $6K, and the path to $50K/mo |
| [`docs/08-TOOLS-AND-STACK.md`](docs/08-TOOLS-AND-STACK.md) | Exact software stack and what it costs (~$50–150/mo) |
| [`docs/09-LEGAL-AND-RISK.md`](docs/09-LEGAL-AND-RISK.md) | Compliance, Google ToS, and how not to get burned |
| [`tools/opportunity_score.py`](tools/opportunity_score.py) | Scores all 400 niche×city combos → ranked CSV |
| [`tools/pricing_calculator.py`](tools/pricing_calculator.py) | Quotes a fair, win-win monthly rent in 10 seconds |
| [`data/`](data/) | The niche/city datasets + generated opportunity matrix |
| [`templates/`](templates/) | Cold email/SMS scripts, the rental contract, a site template |

---

## 🚀 Quick start (today)

```bash
# 1. See the ranked opportunities for yourself (no dependencies, pure Python)
python3 tools/opportunity_score.py

# 2. Price a deal in your chosen niche/city
python3 tools/pricing_calculator.py --job-value 3500 --leads 12 --close-rate 0.35
```

Then:

1. **Pick your lane.** Open [`docs/02-NICHE-CITY-MATRIX.md`](docs/02-NICHE-CITY-MATRIX.md)
   and choose **one niche + one city** from the top of the list. (For a
   30-day cash goal, favor *emergency* niches — water damage, towing, garage
   door, HVAC — because they close same-day.)
2. **Run the sprint.** Follow [`docs/01-30-DAY-SPRINT.md`](docs/01-30-DAY-SPRINT.md)
   day by day.
3. **Bank $6K**, then reinvest into the next 2–3 assets.

---

## 🧠 The one-paragraph version

A local roofer doesn't want SEO lessons — they want their **phone to ring** with
jobs. You build a clean website for "Roofing in {City}," get it generating calls
and form fills (fast via ads/GBP/yard signs, durably via SEO), forward those
leads to one local contractor, and they pay you **$1,000–$3,000/month** for the
pipeline. Stack a handful of these and you've built a portfolio of digital rental
properties that pay you while you sleep. **You own the asset; they rent the
results.**

---

*Educational/business-planning material. Not legal, financial, or tax advice.
See [`docs/09-LEGAL-AND-RISK.md`](docs/09-LEGAL-AND-RISK.md). Inspired by the
work of Chris Koerner ([newsletter.chrisjkoerner.com](https://newsletter.chrisjkoerner.com),
The Koerner Office podcast).*
