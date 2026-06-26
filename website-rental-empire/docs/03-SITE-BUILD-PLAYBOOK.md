# 03 — Site Build & Ranking Playbook

How to build a lead-gen "property" that looks legit, converts visitors into
calls, and climbs Google over weeks 4–12. Budget: an afternoon to launch, then
30–60 min/day of signals.

---

## 1. Pick the domain

- Format: `{service}{city}.com`, `{city}{service}pros.com`, or
  `{service}of{city}.com`. Examples: `boisegaragedoorpros.com`,
  `houstonwaterdamagepros.com`.
- Exact-match-ish local domains still help a little and read as trustworthy to
  the contractor you'll rent to. Keep it brandable, avoid hyphens/numbers.
- Cost ≈ $12/yr (Namecheap, Cloudflare, Porkbull).

## 2. Build the site (an afternoon)

Use the included template ([`templates/site/index.html`](../templates/site/index.html))
or any builder (WordPress + Astra/GeneratePress, Webflow, Carrd, 10Web, Framer).

**Pages (5–8 to start):**
1. **Home** — hero with the offer + click-to-call + quote form above the fold.
2. **Service page(s)** — the money pages (`Water Damage Restoration in {City}`).
3. **Service-area pages** — one per nearby town/suburb (`{Service} in {Suburb}`).
   This is how you multiply rankings cheaply. Start with 3, grow to 10+.
4. **About** — local, trustworthy, "family-owned, serving {City} since…".
5. **Reviews/Testimonials** — social proof (seed a few honest ones).
6. **Contact / Free Quote** — form + map + phone + hours.

**Every page must have (the conversion non-negotiables):**
- Phone number (the **call-tracking number**) in the header, sticky on mobile,
  click-to-call.
- A short quote form (Name, Phone, Service needed, Zip). Fewer fields = more
  leads.
- Trust signals: "Licensed & Insured," "24/7 Emergency," "Free Estimates,"
  response-time promise, review stars, service-area map.
- One clear primary action per screen. Speed + mobile-first (most local-service
  searches are mobile and urgent).

## 3. Write the copy fast (AI)

Use ChatGPT/Claude to draft every page in minutes. Prompt pattern:

> "Write a high-converting home page for a {service} company serving {city} and
> nearby {suburbs}. Tone: trustworthy, local, urgent. Include H1, 3 benefit
> blocks, an FAQ of 6 questions with local keywords, and 2 calls-to-action to
> call {number}. Target the keyword '{service} {city}' naturally, no keyword
> stuffing."

Then humanize it: add real local landmarks, neighborhoods, and specifics. Thin,
generic AI content does **not** rank in 2026 — *useful, specific, locally-grounded*
content does.

## 4. On-page SEO checklist (per page)

- [ ] Title tag: `{Service} in {City} | {Brand}` (≤ 60 chars)
- [ ] Meta description with the keyword + a CTA + phone
- [ ] One H1 with `{Service} {City}`; H2s for subtopics/FAQ
- [ ] City + nearby towns mentioned naturally in body and image alt text
- [ ] **LocalBusiness schema** (JSON-LD) with NAP, geo, hours, service area
- [ ] **NAP consistency** — Name/Address/Phone identical sitewide and in every
      citation (use your *citation* number; route calls via the tracking number —
      see [`04-LEAD-GEN-CHANNELS.md`](04-LEAD-GEN-CHANNELS.md))
- [ ] Internal links: home ↔ service ↔ service-area pages
- [ ] Fast load, mobile-first, HTTPS, compressed images

## 5. Google Business Profile (GBP) — your #1 local lever

The map pack drives the majority of local-service clicks. If you can stand up a
legitimate profile (read [`09-LEGAL-AND-RISK.md`](09-LEGAL-AND-RISK.md) first —
fake listings violate Google's terms and get nuked):

- [ ] Accurate business name, **primary category** = the niche, relevant
      secondary categories
- [ ] Service-area set to your city + suburbs; complete hours (24/7 if emergency)
- [ ] 10+ real photos, full services list with descriptions
- [ ] Weekly **GBP posts** (offers, tips) — activity signals
- [ ] **Reviews are the heaviest map-pack factor** — get real ones flowing early
      and respond to each
- [ ] Put the tracking number in the *primary* phone slot and your citation
      number as a secondary, so call attribution stays clean

> **The honest order of impact for fast local visibility:** GBP/map pack >
> Local Services Ads > paid search > organic page rankings. Weeks 1–4 lean on the
> first three; organic compounds underneath and lowers your cost over weeks
> 4–12.

## 6. Citations + authority (weeks 1–6)

- **Top citations first:** Google, Bing Places, Apple Business Connect, Yelp,
  Facebook, Angi, BBB, Nextdoor, Yellow Pages, niche/industry directories.
- Keep **NAP identical** everywhere.
- A handful of relevant local links (chamber, local blogs, sponsorships) beats a
  pile of spam links.
- Steady **reviews** + fresh **GBP posts** + new **service-area pages** are the
  three signals that move you up over the following weeks.

## 7. Call tracking (do this before you sell anything)

Set up a tracked number (CallRail, Callsling, Nimbata) that **records and logs
every call**, then forwards to wherever you want (you during the sample phase,
the contractor once they pay).

Why it's non-negotiable:
- It's your **proof of value** on the sales call ("here are 14 recorded calls
  last week").
- It enables **pay-per-lead / pay-per-call** billing with no disputes.
- You can **switch the forwarding target instantly** — if a contractor stops
  paying, you reroute the leads. *This is the source of your leverage as the
  landlord.*

## 8. Realistic ranking timeline (set expectations honestly)

| Window | What actually happens |
|---|---|
| Days 1–14 | Indexing, GBP live, citations submitted. **Rankings barely move** — leads come from ads/GBP/yard signs, not organic |
| Weeks 3–6 | GBP impressions climb, long-tail/service-area pages start ranking, first organic calls trickle in |
| Weeks 6–12 | Reviews + content + citations compound; primary keywords climb; organic becomes a meaningful share of leads |
| Months 3–6 | Map-pack + organic can carry the asset; ad spend becomes optional; margins fatten |

**Anyone promising organic #1 in a competitive market in 30 days is selling
fiction.** That's exactly why the [30-day sprint](01-30-DAY-SPRINT.md) monetizes
with fast channels first and lets SEO mature into passive margin.
