# 05 — Sales Playbook: Find, Pitch & Close the Renter

The website is half the business. The other half is putting a paying contractor
on the other end of the phone line. This is how you find them, pitch them, and
close them — fast.

---

## 1. Who you're looking for (the ideal renter)

Rank prospects by *hunger*, not size:

- **Hungry, growth-minded, but bad at marketing** — page 2–3 of Google, few
  reviews, no website or a terrible one. They need leads most.
- **Already buying leads** — anyone running Google/LSA ads, on Angi/Thumbtack,
  buying from HomeAdvisor. They've *proven* they pay for leads; you just offer
  better/exclusive ones.
- **Has capacity to take more jobs** — a solo operator or small crew that wants
  to grow, not a saturated big player.
- **Decent reputation** — you want them to close the leads so the deal renews.

Avoid: the cheapest bidder, businesses with terrible reviews (your leads will
churn), and giant companies with in-house marketing.

## 2. Where to find them (build a 40–60 list before week 1)

Google Maps, Yelp, Angi, Thumbtack, Facebook local groups, Nextdoor, BBB,
Instagram local hashtags, and the Google **ads** results (those are buyers). Log
each in the [lead tracker](../templates/lead-tracker-schema.md): name, phone,
email, reviews, running ads? (Y/N), notes.

## 3. The offer that makes closing easy

> **"I generate {service} leads in {City}. I'll send you the first few **free**.
> If they turn into jobs, we set up a simple monthly arrangement. No long
> contract, cancel anytime."**

Why it works: **zero risk** for them, and once real customers are calling their
phone, *not* paying you feels like turning off the faucet. Lead with proof, not
promises.

### The "live lead" close (highest converting)
Call a prospect *while you have an actual lead in hand*:
> "Hi, this is ___. I run {citywaterdamage}.com — I've got a homeowner in
> {neighborhood} with a burst pipe who needs help today. Want the job? …Great,
> here's their number. If you like these, I send 10–15 a month."
A paying customer on the line closes better than any pitch.

## 4. The 4-touch outreach cadence (book the meeting)

Use [`templates/cold-email-sequences.md`](../templates/cold-email-sequences.md)
and [`templates/cold-sms-and-voicemail.md`](../templates/cold-sms-and-voicemail.md).

1. **Touch 1 — Call/SMS** (best): "Got {service} leads in {City}, want the first
   couple free?"
2. **Touch 2 — Email** (day 1): short, proof-led, one CTA (book 15 min).
3. **Touch 3 — SMS/voicemail** (day 3): "Sent you a water-damage lead's details —
   still want it?"
4. **Touch 4 — Email** (day 6): scarcity — "Lining up one contractor for {City};
   want first right of refusal before I call the next shop?"

Target **15 fresh contacts/day.** Exclusivity ("only one contractor per city")
creates real urgency — and it's true, because exclusivity is what you're selling.

## 5. The closing call (15 minutes)

**Structure:**
1. **Confirm fit** — "How many {service} jobs could you handle a month? What's a
   job worth to you on average?"
2. **Show proof** — share recorded calls / form leads from your tracking line.
3. **Anchor on value** — "These leads are worth ~$X in jobs to you. Let's make it
   exclusive so your competitors can't get them."
4. **Present the number** — from [`pricing_calculator.py`](../tools/pricing_calculator.py).
   Offer the **hybrid:** small setup/launch fee **+** flat monthly *or*
   per-lead.
5. **Collect on the call** — Stripe link / invoice for setup + first month. Sign
   the [agreement](../templates/rank-and-rent-agreement.md). **Don't leave money
   for "later."**

## 6. Objection handling

| They say | You say |
|---|---|
| "Too expensive." | "One {service} job is worth ~$X. This pays for itself with a single close — and it's exclusive in {City}." |
| "I already get leads from Angi." | "Those are shared with 4 competitors and you chase them. Mine ring *your* phone, exclusively. Want to A/B it for two weeks?" |
| "Let me think about it." | "Totally — let's just run the free trial leads so you're deciding on real results, not a pitch. Cool if I send the next one your way?" |
| "Are these exclusive?" | "Yes — one contractor per service per city. That's the whole point. First to commit locks {City}." |
| "What if the leads are junk?" | "Every call's recorded. We only count qualified ones — you don't pay for spam or wrong numbers. Fair?" |
| "Can I just buy the website?" | "I can sell it outright for $X (≈20–40× monthly), or you rent and stay flexible. Most start by renting." |

## 7. Make it stick (renewals = the real business)

- **Deliver visibly:** forward leads instantly, send a weekly recap ("12 calls,
  4 form leads this week").
- **Tie to their wins:** "You closed 3 of last week's leads — that's ~$X. Let's
  keep it going."
- **Upsell PPL → flat** once volume is proven (predictable for both sides).
- **Quarterly check-in** to raise rent as rankings/volume grow.

> A signed renter who closes your leads will pay you for *years* and refer you to
> contractors in other niches. **Acquisition gets you to $6K; retention builds
> the empire.**
