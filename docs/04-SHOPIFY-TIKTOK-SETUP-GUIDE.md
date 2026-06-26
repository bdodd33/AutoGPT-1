# MWFaith — Setup Guide: Theme, Shopify, TikTok Shop & Rewards

This guide walks you from zero to a live `mwfaith.com` store using the theme in `/mwfaith-theme`, your products, TikTok Shop, and the Faith Rewards program.

---

## Part A — Install the theme into Shopify

The `mwfaith-theme/` folder is a complete **Shopify Online Store 2.0** theme. Shopify uploads themes as a **.zip of the theme folder's contents**.

### Option 1 — Upload via Shopify Admin (no tools)
1. Zip the **contents** of `mwfaith-theme/` so the archive contains `assets/`, `config/`, `layout/`, `locales/`, `sections/`, `snippets/`, `templates/` at the **top level** (not nested inside a `mwfaith-theme/` folder).
   - From this repo: `cd mwfaith-theme && zip -r ../mwfaith-theme.zip .`
2. In Shopify Admin → **Online Store → Themes → Add theme → Upload zip file**.
3. Select `mwfaith-theme.zip`, then **Publish** when ready.

> Shopify requires the 7 folders at the archive root. If you zip the parent folder by mistake, the upload will be rejected.

### Option 2 — Shopify CLI (recommended for ongoing dev)
```bash
npm install -g @shopify/cli @shopify/theme
cd mwfaith-theme
shopify theme dev --store your-store.myshopify.com   # live local preview
shopify theme push                                    # upload to the store
```

### After upload — required setup in the theme editor
1. **Online Store → Navigation:** create a menu named **`main-menu`** (the header reads this). Suggested links: Shop / Best Sellers / Collections / The Journal (blog) / Community / Rewards / About / Contact. Create footer menus and point the footer columns at them.
2. **Theme editor → Theme settings:**
   - **Brand:** upload logo + favicon.
   - **Colors:** defaults are luxury black/ivory/gold — adjust if desired.
   - **Typography:** Cormorant Garamond + Inter load from Google Fonts by default; or pick Shopify fonts.
   - **Social & SEO:** add Instagram, TikTok, Facebook, YouTube URLs and a default social share image.
3. **Pages:** create pages and assign the matching template (Online Store → Pages → Theme template):
   - About → template **`page.about`**
   - Community → template **`page.community`** (handle `community`)
   - Rewards → template **`page.rewards`** (handle `rewards`)
   - Contact → template **`page.contact`**
4. **Blog:** create a blog (e.g. "The Journal"), then in the homepage's **Blog posts** section pick that blog.
5. **Collections:** create the three collections used on the homepage — **Minimalist Faith**, **Scripture & Verse**, **Streetwear Drops** (plus optional **Women's** and **Best Sellers**). Assign products by tag (the CSV tags products by collection) or use Smart Collections with the condition `Product tag = Minimalist Faith`, etc.
6. **Customer accounts:** Settings → Customer accounts → enable (classic accounts power the login/register/account templates and rewards). 

---

## Part B — Import the 20 products

1. **Bulk import:** Shopify Admin → **Products → Import** → upload `docs/mwfaith-products.csv` (290 variant rows, 20 products, Color × Size). Review and import.
2. **Connect print-on-demand:** install **Printify** or **Printful** from the Shopify App Store. Map each imported product to a blank:
   - Core tees → **Bella+Canvas 3001**
   - Garment-dyed → **Comfort Colors 1717**
   - Streetwear/oversized → a **heavyweight oversized** blank
   - Hoodies → **350–400 GSM** blank
   - Upload your print files (front/back) per the catalog in `docs/03-PRODUCT-CATALOG-20-DESIGNS.md`.
3. **Images:** add 2–3 lifestyle photos per product (lead with **Black** and **Vintage White**). Set variant images so swatches update the gallery.
4. **Smart Collections:** create collections that auto-fill by the tags in the CSV.

> Tip: POD apps usually create the product + variants for you. You can either import the CSV first and link, or let the POD app create products and just copy the catalog copy/SEO from the docs.

---

## Part C — TikTok Shop

The theme is TikTok-Shop-ready because it uses **standard Shopify product/variant structures** (clean variants, prices, SKUs, product schema/JSON-LD), which TikTok's catalog sync requires.

1. Install **TikTok** (TikTok for Business) app from the Shopify App Store.
2. Connect your **TikTok Shop** seller account and authorize catalog sync.
3. **Sync products** — your imported catalog flows into TikTok Shop. Confirm each product has: title, description, ≥1 image per variant, price, and accurate Size/Color options.
4. Set up **TikTok Shop shipping templates** and link your POD provider's fulfillment (Printify/Printful both support TikTok Shop order routing).
5. Enable **product showcase**, **LIVE shopping**, and **shoppable videos**. Tag products in organic content.
6. Content plan for the Streetwear/Gen-Z avatar: try-ons, "POV: wear your faith," drop teasers, UGC, fabric close-ups.

> Keep product data identical across Shopify and TikTok by treating Shopify as the source of truth and letting the app sync.

---

## Part D — Faith Rewards program

The theme ships with rewards **UI and messaging** (homepage promo, `/pages/rewards` page, account page, point callouts on product/cart). The **points engine** is provided by a loyalty app — pick one and connect:

1. Install a loyalty app: **Smile.io**, **Loyalty Lion**, or **Rivo** (all integrate with Shopify + POD + email).
2. Configure to match the theme copy (already written into the Rewards page):
   - **Earning:** 1 pt / $1; +200 account signup; +100 photo review; +500 referral; +50 social follow; +150 birthday.
   - **Tiers:** Believer (0) → Disciple (1,000) → Apostle (3,000), with the perks listed on the Rewards page.
   - **Redemption:** points → checkout discount.
3. Enable the app's **on-site widget** (launcher in the corner) — it overlays the theme without code changes.
4. Connect **referrals** and **email/SMS** (Klaviyo recommended) for the welcome flow (deliver the 200-point welcome + first-order incentive).

> The theme's "Earn X points" callouts assume **1 point per $1**. If you change the ratio, update the copy in `sections/main-product.liquid`, `sections/main-cart.liquid`, and the Rewards page.

---

## Part E — Domain, email & launch checklist

- **Domain:** Settings → Domains → connect `mwfaith.com` (buy via Shopify or point DNS from your registrar). Set it primary.
- **Email/marketing:** connect Shopify Email or Klaviyo; build the welcome + abandoned-cart + drop-alert flows. The community signup and password page feed your subscriber list (tagged `community`, `newsletter`).
- **Payments:** enable Shopify Payments (+ Shop Pay, Apple/Google Pay). TikTok Shop uses its own checkout.
- **Pre-launch "coming soon":** Online Store → Preferences → enable password protection. The included `layout/password.liquid` + `templates/password.liquid` give you a branded coming-soon + email capture page.

### Go-live checklist
- [ ] Theme uploaded & published
- [ ] `main-menu` + footer menus created
- [ ] Logo, favicon, colors, social links set
- [ ] About / Community / Rewards / Contact pages created with correct templates
- [ ] Blog created and connected to homepage
- [ ] 3+ collections created and populated
- [ ] 20 products imported and linked to POD with print files + images
- [ ] Customer accounts enabled
- [ ] TikTok Shop connected & catalog synced
- [ ] Loyalty app installed & configured to match Rewards page
- [ ] Email flows live (welcome, abandoned cart, drop alerts)
- [ ] `mwfaith.com` connected & primary
- [ ] Test order placed end-to-end (Shopify + TikTok)
- [ ] Submit sitemap to Google Search Console (`/sitemap.xml`)
