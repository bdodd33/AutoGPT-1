# Lead & Pipeline Tracker (Google Sheet Schema)

Two free tabs in a Google Sheet run the whole operation in month 1. Copy the
headers below. Upgrade to a CRM only once you have 3+ assets.

---

## Tab 1 — `Leads` (the proof + billing record)

| Column | Example | Notes |
|---|---|---|
| Lead ID | L-001 | Auto/sequential |
| Date/Time | 2026-07-03 14:22 | When it came in |
| Asset/Site | houstonwaterdamagepros.com | Which property |
| Niche | Water Damage | |
| City/Area | Houston / Katy | |
| Source | Google Ads / LSA / GBP / Yard Sign / Organic | Channel attribution |
| Type | Call / Form | |
| Caller name | Jane D. | |
| Caller phone | 281-555-0142 | |
| Call length (s) | 145 | For "qualified" threshold |
| Qualified? | Yes/No | Per contract definition |
| Recording link | (url) | Your sales proof |
| Routed to (client) | ABC Restoration | |
| Billable? | Yes/No | For PPL deals |
| Lead price | $50 | |
| Job closed? | Yes/Pending/No | Ask the client |
| Job value | $3,400 | For value/ROI proof & upsell |
| Notes | after-hours, urgent | |

> The `Recording link`, `Qualified?`, and `Job value` columns are what you show on
> sales/renewal calls — they prove value and justify raising rent.

---

## Tab 2 — `Pipeline` (the contractor CRM)

| Column | Example | Notes |
|---|---|---|
| Prospect ID | P-014 | |
| Company | ABC Restoration | |
| Contact | Mike | |
| Phone | 281-555-0199 | |
| Email | mike@abc.com | |
| Niche / City | Water Damage / Houston | |
| Reviews | 4.6★ (38) | Reputation check |
| Running ads? | Yes | Proven lead-buyer = hot |
| Status | New → Contacted → Sampled → Verbal → **Closed** → Lost | Pipeline stage |
| Last touch | 2026-07-05 | |
| Next action | Call 7/8 10am | Never let it go cold |
| Offer | $1,000 setup + $1,500/mo | |
| Setup fee | $1,000 | Collected? |
| MRR | $1,500 | Monthly recurring |
| Notes | wants exclusivity, busy season | |

---

## Quick dashboard formulas (put on a `Summary` tab)
- **Leads this month:** `=COUNTIF(Leads!B:B, ">="&EOMONTH(TODAY(),-1)+1)`
- **Qualified leads:** `=COUNTIFS(Leads!K:K,"Yes", ...)`
- **PPL revenue:** `=SUMIF(Leads!N:N,"Yes",Leads!O:O)`
- **Closed clients (MRR):** `=SUMIF(Pipeline!I:I,"Closed",Pipeline!M:M)`
- **Month-1 collected:** setup fees + first-month rent + PPL revenue — **track
  toward $6,000.**

Keep this open daily. The two numbers that matter in the sprint: **leads
delivered** (proof) and **dollars collected** (the goal).
