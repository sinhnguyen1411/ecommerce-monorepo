INSERT INTO categories (name, slug, description, sort_order) VALUES
  ('Fresh Harvest', 'fresh-harvest', 'Seasonal vegetables and greens.', 1),
  ('Fruit Market', 'fruit-market', 'Tropical and orchard fruit.', 2),
  ('Pantry Staples', 'pantry-staples', 'Grains, spices, and pantry goods.', 3),
  ('Garden Tools', 'garden-tools', 'Tools for field and home gardens.', 4);

INSERT INTO products (name, slug, description, price, compare_at_price, featured, status) VALUES
  ('Morning Greens Box', 'morning-greens-box', 'A crisp mix of leafy greens from partner farms.', 180000, 220000, true, 'published'),
  ('Sweet Mango Set', 'sweet-mango-set', 'Sun-ripened mangoes packed the same day.', 240000, 0, true, 'published'),
  ('Aromatic Pepper Bundle', 'aromatic-pepper-bundle', 'Aromatic peppercorns curated for daily cooking.', 90000, 120000, false, 'published'),
  ('Farmers Rice Pack', 'farmers-rice-pack', 'Fragrant rice milled weekly for freshness.', 150000, 0, true, 'published'),
  ('Garden Starter Kit', 'garden-starter-kit', 'Hand tools and gloves for new growers.', 320000, 390000, false, 'published');

INSERT INTO product_images (product_id, url, sort_order) VALUES
  (1, 'https://images.unsplash.com/photo-1506806732259-39c2d0268443?auto=format&fit=crop&w=1200&q=80', 1),
  (2, 'https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=1200&q=80', 1),
  (3, 'https://images.unsplash.com/photo-1509358273864-3f7d5d2048a8?auto=format&fit=crop&w=1200&q=80', 1),
  (4, 'https://images.unsplash.com/photo-1502740479091-635887520276?auto=format&fit=crop&w=1200&q=80', 1),
  (5, 'https://images.unsplash.com/photo-1444392061186-9fc38f84f726?auto=format&fit=crop&w=1200&q=80', 1);

INSERT INTO product_categories (product_id, category_id) VALUES
  (1, 1),
  (2, 2),
  (3, 3),
  (4, 3),
  (5, 4);

INSERT INTO posts (title, slug, excerpt, content, cover_image, status, published_at) VALUES
  ('Harvest Notes: Early Autumn', 'harvest-notes-early-autumn', 'A look at the first autumn harvest and what to cook with it.', '<p>Autumn brings deeper flavors and heartier greens. This week we focus on leafy mixes, fragrant herbs, and root vegetables from partner farms.</p>', 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?auto=format&fit=crop&w=1200&q=80', 'published', NOW()),
  ('Farm Visit: Cooperative Growers', 'farm-visit-cooperative-growers', 'Inside the cooperative that supplies our weekly produce boxes.', '<p>We visited the cooperative to learn how they keep produce fresh from field to market. Their focus on soil health and fair wages keeps quality consistent.</p>', 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1200&q=80', 'published', NOW());

INSERT INTO pages (title, slug, content) VALUES
  ('About Us', 'about-us', '<p>We are a modern agricultural marketplace connecting farmers and families across the region. Our mission is to deliver fresh harvests with full traceability.</p>'),
  ('Return Policy', 'return-policy', '<p>If your order arrives damaged or incomplete, contact us within 24 hours for a replacement or refund.</p>'),
  ('Terms of Service', 'terms-of-service', '<p>Orders are confirmed upon payment or COD confirmation. Delivery schedules are subject to weather and harvest conditions.</p>');

INSERT INTO qna (question, answer, status, sort_order) VALUES
  ('How do you keep produce fresh?', 'We pack on the day of harvest and store in temperature-controlled transit boxes.', 'published', 1),
  ('Do you deliver outside the city?', 'We currently deliver within the metro area. Pickup partners are available for nearby provinces.', 'published', 2);

INSERT INTO locations (name, province, district, address, phone, hours, sort_order) VALUES
  ('City Center Pickup', 'Ho Chi Minh', 'District 1', '123 Rural Road, District 1', '0900000000', '08:00-18:00', 1),
  ('North Hub', 'Ha Noi', 'Cau Giay', '88 Field Lane, Cau Giay', '0900000001', '08:30-17:30', 2);
