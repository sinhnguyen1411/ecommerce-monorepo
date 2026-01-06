# Handover Guide

## Daily operations

- Orders are stored in the MySQL database (orders, order_items).
- Payment proofs are saved in the uploads directory mounted to the api_uploads volume.
- The website pulls products, posts, and pages from the database.
---
## File uploads

- Uploads are stored under the api_uploads Docker volume.
- Exposed publicly through /uploads/ via the API and Nginx.

## Content updates (Phase 1)

Phase 1 does not include an admin UI. Use a database tool (MySQL Workbench, DBeaver) to manage content.

Tables to update:
- categories
- products
- product_images
- product_categories
- posts
- pages
- qna
- locations

About page content uses pages.slug = about-us.

## Example: add a product

1) Insert product row in products.
2) Insert product image in product_images with product_id.
3) Link category in product_categories.

## Backup

See docs/README_DEPLOY.md for MySQL backup and restore commands.

## Next phase notes

## Phase 2 (implemented)

- Google OAuth login for users.
- Account pages: profile, addresses, order history.
- Admin dashboard with CRUD for products, posts, Q&A, and payment settings.
- Admin order management: status, payment verification, internal notes.

Admin login (local seed):
- Email: admin@ttc.local
- Password: admin123

## Phase 3 (planned)

- Store search enhancements and promotions.
