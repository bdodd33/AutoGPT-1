# 06 — Pricing & Contracts

How to price so the contractor says yes *and* you maximize revenue — plus the
agreement that makes it official.

---

## 1. The golden rule: the 10× value anchor

Price the rent at roughly **10% of the business value you send** (i.e., give the
contractor a **10× return**). It's an easy yes and still excellent for you.

**The formula:**
```
Monthly business value to client = leads/mo × close-rate × avg-job-value
Monthly rent                     = ~10% of that value   (5%–15% range)
```

**Worked example (water damage, Houston):**
- 12 qualified leads/month × 35% close × $3,500 avg job = **$14,700** of value.
- Rent at ~10% = **~$1,500/month.** The contractor nets ~$13,200. Easy yes.

Use the calculator: `python3 tools/pricing_calculator.py --leads 12
--close-rate 0.35 --job-value 3500`.

## 2. Pick the billing model per deal

| Model | Charge | When to use | Pros / Cons |
|---|---|---|---|
| **Flat monthly rent** | Fixed (e.g. $1,500/mo) | Proven, steady lead flow | + Predictable, passive. − Needs ranking/volume first |
| **Pay-per-lead (PPL)** | $25–$150 per qualified lead | New sites, fast start, emergency niches | + Bill from day 1, easy yes. − Variable, more tracking |
| **Pay-per-call** | $15–$80 per call > 60s | Phone-driven (towing, garage door, auto glass) | + Dead simple. − Need call-duration filtering |
| **Revenue share** | 5–15% of closed job | High-ticket (roofing, solar, remodel) with trust | + Huge upside per deal. − Requires honest job reporting |
| **Hybrid (recommended)** | Setup fee + (flat or PPL) | Month 1 cash + recurring | + Cash today *and* recurring. Best of both |

### The month-1 cash hack: the setup/launch fee
Charging a **one-time $750–$1,500 setup/launch fee** (site, GBP, tracking,
onboarding) is normal, collected upfront, and gets you to $6K **without waiting
on lead volume**. Always pair it with first month's rent collected on the same
call.

## 3. Typical monthly rent by niche (sanity ranges)

| Niche tier | Examples | Typical monthly rent |
|---|---|---|
| Entry / smaller-ticket | Junk removal, pressure washing, dumpster | $500–$1,200 |
| Mid-ticket service | Garage door, auto glass, tree, pest, fence | $800–$2,200 |
| High-ticket / emergency | Water damage, mold, HVAC, concrete | $1,200–$3,500 |
| Premium high-ticket | Roofing, foundation, solar, remodel | $1,500–$5,000 |

PPL equivalents: small/local job ≈ $25–$50/lead; mid ≈ $50–$100/lead;
high-ticket ≈ $100–$300/lead (roofing/solar leads command the most).

## 4. Pricing principles that protect your margin

- **Anchor on their job value, not your costs.** A roofer paying $2,000 for
  leads that close $40,000 of work doesn't care what your hosting costs.
- **Sell exclusivity.** "One contractor per service per city" justifies premium
  pricing and prevents a race to the bottom.
- **Start with a free trial, then never give leads away again.** Free *first
  leads* to prove value — then everything is paid.
- **Bill in advance** (1st of month) and automate it (Stripe subscription).
- **Raise rent as volume grows.** Quarterly: "We're at 18 leads/mo now, up from
  10 — let's adjust to $1,800."
- **Keep the kill-switch.** You own the number and the site. Non-payment = reroute
  the leads. That leverage is why this is "renting," not "consulting."

## 5. The rental agreement

Use [`templates/rank-and-rent-agreement.md`](../templates/rank-and-rent-agreement.md).
Key clauses:
- **You retain ownership** of the domain, website, phone number, GBP, and all
  rankings/leads.
- **Exclusive license** to the leads for one contractor, one service, one area.
- **Fee + billing terms**, billed in advance, auto-renewing month-to-month.
- **Non-payment** = immediate suspension/rerouting of leads.
- **Qualified-lead definition** (for PPL) — what counts, what doesn't (spam,
  wrong number, out-of-area, < 30–60s calls).
- **30-day cancellation**, no long lock-in (lowers their resistance; your leads
  keep them anyway).
- **No warranty on lead volume** — you provide access to leads, not guaranteed
  jobs.

> Have a local attorney review before scaling. This template is a starting
> point, not legal advice — see [`09-LEGAL-AND-RISK.md`](09-LEGAL-AND-RISK.md).
