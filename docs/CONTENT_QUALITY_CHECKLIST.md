# Content Quality Checklist

Use this checklist to keep storefront content free from demo data and placeholder assets after seed or editorial updates.

## 1. Product Data
- Product names must be real commercial names, not generic placeholders like `Box`, `Set`, or `Bundle`.
- Product images must not show `Temporary image` or similar placeholder copy.
- Each product should have at least one clear main image and one short usage-focused description.
- Pricing must be coherent: `compare_at_price` should be greater than `price` when a discount is shown.

## 2. Blog / News Data
- Titles and excerpts must reflect the real article content.
- Cover images should match the agricultural topic and avoid generic demo vectors when real imagery exists.
- Publish date and author metadata should be present and consistently formatted.

## 3. Page Content
- Static pages should not mix in leftover English placeholder copy on a Vietnamese storefront.
- Q&A entries should reflect realistic buyer and grower questions.
- Location records must contain usable address and contact information.

## 4. CTA Consistency
- Hero: consult and contact intent.
- Intro: discover plus conversion intent.
- Product and spotlight blocks: detail and order intent.
- Do not force the same CTA copy across every block when intent differs.

## 5. Visual QA Before Release
- No horizontal overflow on desktop, tablet, or mobile.
- CTA controls must have visible focus states and at least 44px touch height.
- No placeholder text such as `Temporary`, `demo`, or `updating` in key public sections.

## 6. Operational Rule
- When `SEED_ON_START=true`, run `005_content_quality.sql` after promotions and users refresh on an existing database.
- After major content updates, run smoke checks for homepage, collections, and blog pages.
