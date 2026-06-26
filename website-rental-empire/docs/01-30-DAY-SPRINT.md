# 01 — The 30-Day Sprint to $6,000

This is the engine. Follow it day by day. The goal is **$6,000 collected within
30 days**, with a passive-income asset still standing when the sprint ends.

## The core idea behind hitting $6K fast

You cannot reliably *rank* a new site #1 in 30 days. So you don't sell rankings —
**you sell leads, and you manufacture those leads with channels that turn on in
days, not months:**

1. **Google Business Profile** (map pack) — can surface fast in lower-competition
   suburbs/secondary cities.
2. **Google Local Services Ads (LSA)** — "Google Guaranteed," pay-per-lead, top
   of the page, live in ~1 week.
3. **Search/Meta ad arbitrage** — you spend $X on ads, generate leads, sell them
   for $Y > X.
4. **QR-code yard signs + flyers** — near-free local leads (Koerner's tactic).
5. **Pre-selling** — sign the contractor *before* leads are flowing, on a
   pay-per-lead promise, so you have a guaranteed buyer.

Then you bill **per lead / per call** so revenue starts on day ~7–10, not day 90.

### The math you're solving for
$6,000 in 30 days is **any** of these (see [`07-FINANCIAL-MODEL.md`](07-FINANCIAL-MODEL.md)):

| Path | What it looks like |
|---|---|
| **A — Flat retainers** | 4 contractors × $1,500/mo = **$6,000** |
| **B — Pay-per-lead** | 120 qualified leads × $50 = **$6,000** (≈4/day) |
| **C — Hybrid (recommended)** | 3 retainers ($4,500) + 30 PPL leads ($1,500) = **$6,000** |
| **D — Setup + rent** | 3 clients × ($1,000 setup + $1,000 first month) = **$6,000** |

Path **D is the cheat code for month 1**: charge a one-time "site setup / launch
fee" *plus* first month's rent. Setup fees are normal, collected upfront, and
get you to $6K without waiting for lead volume. Use D + C together.

---

## Week 0 (Days -2 to 0): Setup — 2–3 hours

- [ ] **Pick your market.** Run `python3 tools/opportunity_score.py`, open
  [`02-NICHE-CITY-MATRIX.md`](02-NICHE-CITY-MATRIX.md). Choose **one emergency /
  fast-close niche** in a **growing, lower-competition city or suburb.** Best
  starters for 30-day cash: **Water Damage Restoration, HVAC Repair, Garage Door
  Repair, Towing, Junk Removal.**
- [ ] **Buy the domain.** `{service}{city}.com` or `{city}{service}pros.com`
  (~$12). E.g. `boisewaterdamagepros.com`.
- [ ] **Set up the stack** ([`08-TOOLS-AND-STACK.md`](08-TOOLS-AND-STACK.md)):
  hosting/site builder, a **call-tracking number** (CallRail free trial /
  Callsling), a Google account, a simple CRM (free: Google Sheet —
  [`templates/lead-tracker-schema.md`](../templates/lead-tracker-schema.md)).
- [ ] **Build a prospect list** of 40–60 contractors in your niche+city
  (Google Maps, Yelp, Angi, Nextdoor, Facebook groups). Capture name, phone,
  email, # of reviews, whether they run ads. Prioritize the *hungry* ones:
  page 2–3 of Google, few reviews, no ads = they need leads most.

---

## Week 1 (Days 1–7): Build the asset + ignite fast leads

**Goal: a live, lead-capturing property and the first calls flowing.**

- [ ] **Day 1–2 — Build the site.** Deploy the template in
  [`templates/site/index.html`](../templates/site/index.html). 5–8 pages:
  Home, Service, Service-Area (×3 nearby towns), About, Contact/Quote. Big
  click-to-call header with the **tracking number**. AI-write the copy fast
  (see [`03-SITE-BUILD-PLAYBOOK.md`](03-SITE-BUILD-PLAYBOOK.md)).
- [ ] **Day 2 — Stand up Google Business Profile** (if you can legitimately —
  read [`09-LEGAL-AND-RISK.md`](09-LEGAL-AND-RISK.md)). Categories, service area,
  hours, photos, services, first post.
- [ ] **Day 3 — Turn on Local Services Ads** (Google Guaranteed) and/or a small
  **Google Search ad** ($30–60/day) on high-intent emergency keywords
  (`emergency water removal`, `24 hour {service}`). This is your fastest tap.
- [ ] **Day 3 — Plant QR yard signs / flyers** at high-traffic spots, hardware
  stores, community boards, and (with permission) busy intersections. QR → your
  quote page. Near-zero cost, real local leads.
- [ ] **Day 4–5 — Start outreach** to the prospect list (the contractors who
  will *buy* the leads). Use [`05-SALES-PLAYBOOK.md`](05-SALES-PLAYBOOK.md) and
  [`templates/cold-email-sequences.md`](../templates/cold-email-sequences.md).
  Goal: **10 conversations booked.** Pitch: *"I generate {service} leads in
  {city}. First 3 leads free — if they're good, we set up a simple monthly
  arrangement."* Risk-free offers book meetings.
- [ ] **Day 6–7 — Index + citations.** Submit the GBP, build the top 10 citations
  (Google, Bing, Yelp, Apple, Angi, BBB, Nextdoor…), request indexing. This is
  the SEO seed that pays off in weeks 4–8.

**End of Week 1 target:** site live, ads/GBP/signs producing the first few
leads, 8–10 contractor conversations in the pipeline.

---

## Week 2 (Days 8–14): Prove leads + line up buyers

**Goal: provable lead flow and 5+ contractors ready to say yes.**

- [ ] **Capture & log every lead** with the call-tracking recordings. Screenshots
  + recordings are your *sales proof*.
- [ ] **Tune the ad targeting** to lower cost-per-lead. Pause losing keywords,
  scale winners. Aim for cost-per-lead well under your sell price.
- [ ] **Deliver "free sample" leads** to your top 3–5 prospects in real time
  ("Hi, got a water-damage call in {neighborhood}, want it?"). A live, paying
  customer on the phone is the most powerful close there is.
- [ ] **Book closing calls.** Move warm prospects to a 15-minute "let's make this
  official" call. Bring the [`pricing_calculator.py`](../tools/pricing_calculator.py)
  number.

**End of Week 2 target:** 10–25 leads delivered/sampled, 5+ contractors verbally
in.

---

## Week 3 (Days 15–21): CLOSE — this is where the $6K is made

**Goal: signed agreements + money collected.**

- [ ] **Close 3–5 contractors.** Use the hybrid offer:
  - **Setup/launch fee $750–$1,500** (collected today), **plus**
  - **$1,000–$1,800/month** flat, *or* **$40–$75/qualified lead**.
- [ ] **Sign the agreement** ([`templates/rank-and-rent-agreement.md`](../templates/rank-and-rent-agreement.md))
  and **collect via Stripe/invoice on the call.** Setup fee + first month up
  front. *Money in the door before you hang up.*
- [ ] **Forward the tracked number** to the paying contractor; keep recording for
  attribution and disputes.

**Worked example to $6K by Day 21:**
> 3 clients × ($1,000 setup + $1,000 month-1) = **$6,000 collected.**
> *Or* 4 clients × $1,500 flat = **$6,000.**
> *Or* 2 retainers ($3,000) + 60 PPL leads at $50 ($3,000) = **$6,000.**

---

## Week 4 (Days 22–30): Optimize, upsell, and bank it

**Goal: secure recurring revenue and seed the next asset.**

- [ ] **Keep leads flowing** so month-2 renews. Renewal is the whole game.
- [ ] **Upsell PPL clients to flat monthly** ("you're paying ~$1,400 in leads;
  lock unlimited for $1,500/mo"). Predictable revenue for both sides.
- [ ] **Ask for results + a testimonial** ("how many jobs did you close from
  these?"). This becomes your closing proof for asset #2.
- [ ] **Reinvest.** Take part of the $6K and start **asset #2** (new niche or
  neighboring city) using the exact same checklist.
- [ ] **Let SEO catch up.** By now GBP is climbing and citations are indexing —
  your *cost per lead drops*, fattening margins on the rent you're already
  charging.

**End of Month 1 target: $6,000+ collected, ≥3 recurring clients, asset #2 begun.**

---

## Daily operating rhythm (pin this)

> **Morning (30 min):** check overnight leads, deliver/forward them, reply to
> contractor messages.
> **Midday (60–90 min):** outreach — 15 new contractors contacted, follow up
> yesterday's.
> **Afternoon (30–60 min):** optimize a channel (ads, GBP post, a new
> service-area page, one citation, one review request).

15 contractor touches/day × ~25 days ≈ **375 touches.** At a modest 1.5% close,
that alone is ~5–6 clients — independent of inbound. Activity is the safety net
under the whole sprint.

---

## If you're behind on Day 20 (the recovery levers)

1. **Add a second niche** in the same city (you already have the audience and the
   ad account) — e.g. add "mold remediation" alongside "water damage."
2. **Widen the offer:** drop setup fee, go pure PPL at a *low* price ($35) to
   close volume, raise later.
3. **Sell leads to multiple contractors** (rotate / first-come) instead of
   exclusivity — more buyers, more cash now.
4. **Pitch the site as a flip:** some contractors will pay $2–4K to *own* a
   ready-ranked site outright. One sale can be half your goal.
5. **Go where the money already is:** call contractors *already* running Google
   ads in your niche — they've proven they'll pay for leads.

> **The single biggest failure mode is waiting for SEO and not selling.** Sell
> the ringing phone from week one. The rankings are the bonus, not the
> prerequisite.
