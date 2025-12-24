# Directus Setup

This project reads data directly from Directus, so the collection schema matters.

## Collections

1) categories
- id (integer, auto)
- name (string)
- slug (string, unique)
- sort (integer)

2) products
- id (integer, auto)
- name (string)
- slug (string, unique)
- price (decimal)
- compare_at_price (decimal, nullable)
- description (text, nullable)
- featured (boolean)
- status (string or Directus status)

3) product_images
- id (integer, auto)
- product (many-to-one -> products)
- image (file)
- sort (integer)

4) product_categories (junction table)
- product (many-to-one -> products)
- category (many-to-one -> categories)

5) posts
- id (integer, auto)
- title (string)
- slug (string, unique)
- content (rich text or markdown)
- cover_image (file)
- status (string or Directus status)
- published_at (datetime)

## Notes
- The frontend only shows records with status = "published".
- product_images.sort controls the gallery order.
- cover_image and product_images.image should use Directus file storage.
- Use the field name product_images on products for the one-to-many relationship.

## Public read access

Option A: enable Public role for read-only
1) Settings -> Roles & Permissions -> Public
2) Enable read permissions for:
   - categories
   - products
   - product_images
   - product_categories
   - posts
   - directus_files
3) Leave create, update, delete disabled.

Option B: use a static token
1) Create a role with read-only permissions.
2) Create a static token for that role.
3) Set NEXT_PUBLIC_DIRECTUS_PUBLIC_TOKEN in apps/web/.env.local.

## Quick verification

- Ping the server: http://localhost:8055/server/ping
- Test products: http://localhost:8055/items/products
