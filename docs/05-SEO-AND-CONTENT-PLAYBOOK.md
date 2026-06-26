# MWFaith — SEO & Content Playbook

## 1. What's already built into the theme (technical SEO)

- **Semantic structure:** one `<h1>` per page, logical headings, `<main>` landmark, skip-to-content link.
- **Meta + social:** dynamic `<title>`/meta description, **Open Graph** + **Twitter Card** tags (`snippets/meta-tags.liquid`).
- **Structured data (JSON-LD):** `Organization`, `WebSite` (+ Sitelinks search box) on the homepage; `Product` (price/availability) on product pages; `Article` on blog posts. This drives rich results.
- **Performance:** font preconnect/preload, `fetchpriority` on hero/LCP images, responsive `srcset`/`sizes`, lazy-loaded below-the-fold images, minimal dependency-free JS, `prefers-reduced-motion` support.
- **Canonical URLs** on every page; `robots` set to index/follow with large image preview.
- **Accessibility:** aria labels on icon buttons, alt text on images, focus-visible inputs, color contrast in the luxury palette.

> Shopify auto-generates `/sitemap.xml` and `robots.txt`. Submit the sitemap in Google Search Console after launch.

## 2. Post-launch SEO actions (you do these)

1. **Per-product:** write unique 150–160 char meta descriptions; include the verse + design name; set image alt text; use the SEO handles from the catalog (`docs/03-...`).
2. **Collections:** add 100–200 word intro copy targeting head terms ("Christian streetwear", "minimalist faith t-shirts", "scripture tees").
3. **Google Search Console + Bing Webmaster:** verify domain, submit sitemap.
4. **Google Merchant Center:** feed products for free listings + Shopping.
5. **Reviews:** install a reviews app (adds `AggregateRating` to product schema → star rich results).
6. **Internal linking:** link blog posts → relevant products/collections.

## 3. Keyword map (seed)

| Intent | Target keywords | Landing page |
|---|---|---|
| Category | christian t shirts, faith apparel, christian clothing brand | Home / All collections |
| Style | christian streetwear, minimalist christian shirt, aesthetic faith tee | Streetwear / Minimalist collections |
| Verse | philippians 4:13 shirt, psalm 23 tee, faith over fear shirt | Respective products |
| Gift | christian gifts for her, blessed mama shirt, christian mom gift | Women's collection / products |
| Informational | what to wear to church, bible verses about strength | Blog articles |

## 4. Blog ("The Journal") — launch content calendar

The blog section is live on the homepage and at the blog template. Publish 1–2 posts/week. Mix **devotional/community** (brand affinity) with **commercial/SEO** (buying guides that link to products).

| # | Title | Type | Primary keyword |
|---|---|---|---|
| 1 | Welcome to MWFaith: Why We Build Faith Apparel That Lasts | Brand | christian clothing brand |
| 2 | 10 Bible Verses About Strength (and How to Wear Them) | SEO+devotional | bible verses about strength |
| 3 | The Rise of Christian Streetwear in 2026 | SEO | christian streetwear |
| 4 | Minimalist Faith: Styling the "Quiet Faith" Wardrobe | SEO+style | minimalist christian shirt |
| 5 | What Does Hesed Mean? The Hebrew Word Behind the Tee | Devotional+product | hesed meaning |
| 6 | A Guide to Christian Gifts She'll Actually Wear | Commercial | christian gifts for her |
| 7 | Ichthys: The Story of the Early Church's Secret Symbol | Devotional+product | ichthys meaning |
| 8 | Faith Over Fear: A 7-Day Devotional | Community | faith over fear |
| 9 | How Our Print-on-Demand Tees Are Made (and Why It Matters) | Brand/sustainability | sustainable christian apparel |
| 10 | The MWFaith Rewards Guide: How to Earn & Redeem | Retention | faith rewards |

**Each post should:** target one primary keyword in the title/H1/URL/first paragraph, include 1 hero image (alt text), link to 2–3 products/collections, and end with a community signup CTA. Enable comments for community engagement (the article template supports them).

## 5. Off-page & social

- **TikTok/Instagram → product tags** drive both sales and brand search volume.
- **Influencer/affiliate** via the rewards referral program (faith + lifestyle creators).
- **Backlinks:** guest devotionals, faith-blog features, podcast mentions.
- **Email/SMS** isn't SEO but compounds retention + repeat search/branded traffic.
