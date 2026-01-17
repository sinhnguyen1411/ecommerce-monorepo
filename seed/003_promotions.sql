INSERT INTO coupons (code, description, discount_type, discount_value, max_discount, min_subtotal, starts_at, ends_at, usage_limit, status)
VALUES
  ('WELCOME50', 'Welcome discount 50k', 'amount', 50000, NULL, 200000, NOW(), DATE_ADD(NOW(), INTERVAL 90 DAY), 500, 'active'),
  ('FRESH10', '10% off orders', 'percent', 10, 80000, 0, NOW(), DATE_ADD(NOW(), INTERVAL 60 DAY), NULL, 'active'),
  ('SAVE10', 'Save 10k for orders from 259k', 'amount', 10000, NULL, 259000, NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 100, 'active'),
  ('SAVE20', 'Save 20k for orders from 399k', 'amount', 20000, NULL, 399000, NOW(), DATE_ADD(NOW(), INTERVAL 5 DAY), 100, 'active'),
  ('SAVE40', 'Save 40k for orders from 699k', 'amount', 40000, NULL, 699000, NOW(), DATE_ADD(NOW(), INTERVAL 2 DAY), 50, 'active')
ON DUPLICATE KEY UPDATE
  description = VALUES(description),
  discount_type = VALUES(discount_type),
  discount_value = VALUES(discount_value),
  max_discount = VALUES(max_discount),
  min_subtotal = VALUES(min_subtotal),
  starts_at = VALUES(starts_at),
  ends_at = VALUES(ends_at),
  usage_limit = VALUES(usage_limit),
  status = VALUES(status);
