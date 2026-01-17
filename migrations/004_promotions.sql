CREATE TABLE IF NOT EXISTS coupons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL UNIQUE,
  description VARCHAR(255),
  discount_type VARCHAR(16) NOT NULL,
  discount_value DECIMAL(12,2) NOT NULL,
  max_discount DECIMAL(12,2),
  min_subtotal DECIMAL(12,2) DEFAULT 0,
  starts_at DATETIME,
  ends_at DATETIME,
  usage_limit INT,
  used_count INT DEFAULT 0,
  status VARCHAR(32) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

ALTER TABLE orders
  ADD COLUMN promo_code VARCHAR(64),
  ADD COLUMN shipping_method VARCHAR(32) DEFAULT 'standard';
