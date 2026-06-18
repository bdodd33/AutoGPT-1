# HUBBY HELPER — MASTER INDEX

> Claude Code prompt series for building the Hubby Helper mobile app.
> Run each part in a fresh Claude Code session, in order, starting with Part 1.
> Do not skip parts. Do not combine parts into one session.

---

## WHAT YOU ARE BUILDING

Hubby Helper is a React Native mobile app (iOS + Android) that helps husbands
and boyfriends become more attentive, intentional partners. It reminds users
of important dates, prompts them to send romantic and encouraging messages,
generates AI-powered poems and songs, finds personalized gift ideas via the
ChatAds affiliate network, and surfaces Bible verses for any mood or moment.

**Tech stack:** React Native + Expo SDK 51, Expo Router, Supabase (auth + database + Edge Functions), Zustand, React Hook Form, React Native Reanimated, Expo Notifications.

**Revenue model:** Affiliate commissions via ChatAds on Gift Finder purchases.

**Target user:** Husbands and boyfriends who want to love their partner better but need structure, prompts, and tools to do it consistently.

---

## HOW TO USE THIS SERIES

1. Open the file for the current part
2. Copy the entire contents of the code block
3. Paste into a fresh Claude Code session
4. Let Claude Code execute completely
5. Verify every item in the Definition of Done checklist before moving on
6. Open the next part file and repeat

**Do not move to the next part until the current part's Definition of Done is fully checked.**
Skipping the verification step creates compounding errors that are harder to debug in later parts.

---

## PART OVERVIEW

| Part | File | What Gets Built | Run Order |
|------|------|-----------------|-----------|
| **Index** | `INDEX.md` | This file — read first, run first | 0 |
| **Part 1** | `hubby-helper-part1.md` | Project scaffold, design system, Supabase schema, all stub screens | 1 |
| **Part 2** | `hubby-helper-part2.md` | Auth (email + magic link), onboarding, partner profile, profile tab | 2 |
| **Part 3** | `hubby-helper-part3.md` | Poem Writer, Song Writer, Bible Verses, Claude AI Edge Functions | 3 |
| **Part 4** | `hubby-helper-part4.md` | Important Dates, Message Prompts, push notifications | 4 |
| **Part 5** | `hubby-helper-part5.md` | Gift Finder with ChatAds affiliate integration | 5 |
| **Part 6** | `hubby-helper-part6.md` | Dashboard, app hardening, App Store submission prep | 6 |

---

## WHY 6 PARTS?

Claude Code performs best when each session has a single, bounded objective.
One long prompt causes context to fill up and quality to degrade mid-build.
Six focused prompts keep each session sharp and produce clean, testable output.

Each part ends with a Definition of Done checklist. These are not optional.
They exist because bugs introduced in Part 2 that go undetected will cause
silent failures in Part 4 that are difficult to trace back to their source.

---

## BEFORE YOU START PART 1

You need these accounts and credentials ready. Do not start Part 1 without them.

### Required

- **Expo account** — [expo.dev](https://expo.dev) — free tier is fine
- **Supabase project** — [supabase.com](https://supabase.com) — free tier is fine
  - Note your Project URL and anon/public API key
- **Anthropic API key** — [console.anthropic.com](https://console.anthropic.com) — for Claude AI features in Part 3
- **ChatAds account** — for affiliate Gift Finder integration in Part 5

### Optional but recommended

- Apple Developer account (needed for iOS push notifications and App Store submission)
- Google Play Developer account (needed for Android distribution)

### Environment variables you will set in Part 1

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
ANTHROPIC_API_KEY=
CHATADS_API_KEY=
```

---

## DEFINITION OF DONE — INDEX (Part 0)

Before starting Part 1, confirm:

- [ ] You have read this entire file
- [ ] You have all required accounts created
- [ ] You have your Supabase Project URL and anon key ready to paste
- [ ] You have your Anthropic API key ready
- [ ] You understand the 6-part structure and will not skip parts
- [ ] You will run each part in a **fresh** Claude Code session
