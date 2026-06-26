# MWFaith — Shopify Theme

A luxury, high-conversion **Shopify Online Store 2.0** theme for the MWFaith Christian apparel brand. Dark editorial palette, antique-gold accents, serif/sans pairing, built-in **blog**, **community signup**, and **Faith Rewards** UI. SEO, performance, and accessibility best-practices baked in. Built to sync cleanly with **TikTok Shop**.

## Install (quick)
```bash
cd mwfaith-theme
zip -r ../mwfaith-theme.zip .          # zip the CONTENTS (folders at archive root)
# Shopify Admin → Online Store → Themes → Add theme → Upload zip file → Publish
```
Or with the CLI: `shopify theme push` (see `../docs/04-SHOPIFY-TIKTOK-SETUP-GUIDE.md`).

> After upload you must create a navigation menu named **`main-menu`**, set theme settings (logo/colors/social), and assign page templates (`page.about`, `page.community`, `page.rewards`, `page.contact`). Full steps in the setup guide.

## Structure
```
mwfaith-theme/
├── assets/        base.css (design system), theme.js (cart drawer, variants, nav, reveal)
├── config/        settings_schema.json, settings_data.json (colors, fonts, social/SEO)
├── layout/        theme.liquid (SEO head, cart drawer), password.liquid (coming-soon)
├── locales/       en.default.json
├── sections/      hero, featured-collection, collection-list, image-with-text,
│                  value-props, testimonials, rewards-promo, rewards-program,
│                  blog-posts, community-signup, contact-form, header, footer,
│                  announcement-bar, and main-* sections for every template
├── snippets/      meta-tags (OG/Twitter/JSON-LD), product-card, article-card, icon
└── templates/     index, product, collection, list-collections, blog, article, cart,
                   page, page.about, page.community, page.rewards, page.contact,
                   search, 404, password, gift_card, customers/*
```

## Key features
- **Online Store 2.0** JSON templates — fully editable sections/blocks in the theme editor.
- **Custom cart drawer** + AJAX add-to-cart (`theme.js`), no external JS dependencies.
- **SEO:** dynamic meta, Open Graph, Twitter Cards, and Schema.org JSON-LD (Organization, WebSite, Product, Article).
- **Performance:** preconnect/preload, `fetchpriority` LCP, responsive `srcset`, lazy loading, reduced-motion support.
- **Blog/Journal**, **Community signup** (native Shopify customer form), and a full **Rewards** page + on-page point callouts.
- **TikTok-Shop-ready** standard product/variant structures.

## Customize
- Colors/fonts/width/radius/social → **Theme settings** (`config/settings_schema.json`).
- Section content → **Theme editor** (each section has a `{% schema %}`).
- Rewards point ratio copy lives in `sections/main-product.liquid`, `sections/main-cart.liquid`, and the rewards page.

See `../docs/` for brand strategy, market research, the 20-design catalog, the product import CSV, and the SEO playbook.
