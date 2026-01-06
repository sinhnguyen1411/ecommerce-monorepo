# Storefront UI (apps/web)

This document summarizes the UI work for the storefront and how to run it locally.

## Quick start

From the monorepo root:

```bash
cd apps/web
npm install
npm run dev
```

Then open `http://localhost:3000`.

## Implemented UI

- Layout system
  - Topbar + sticky header with search and cart button
  - Mobile menu (Sheet)
  - Footer with ecommerce-style columns and newsletter block
  - Floating social buttons (Zalo/Messenger/Facebook)
- Home
  - Tighter hero section
  - Category highlights
  - Featured storefront grid
  - Latest posts
  - Newsletter and contact blocks
- Products
  - Filter chips, sort dropdown, pagination UI
  - Product card with sale badge, compare-at price, quick view
  - Product detail gallery, price block, tabs (Description/Return/Terms)
  - Related products + recently viewed
- Cart
  - Cart drawer (Sheet) from header
  - Full cart page with quantity controls, notes, promo code placeholder
  - Free shipping progress and minimum order gating
  - Delivery time selection
- Checkout
  - Shipping and payment options
  - Promo code placeholder
  - Minimum order enforcement before submit
  - Thank-you page with bank transfer QR and proof upload
- Blog
  - List + detail with sidebar latest posts
  - Related posts on detail
- Static pages
  - About us, Return policy, Terms of service
  - Q&A as accordion
  - Locations search page

## State and data

- Zustand store for cart (persisted to localStorage)
- Data fetched directly from existing REST endpoints via `NEXT_PUBLIC_API_URL`
- No backend API contract changes

## Notes

- Styles are built with Tailwind and shadcn/ui primitives
- The layout is responsive across mobile/tablet/desktop
