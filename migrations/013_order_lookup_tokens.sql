SET NAMES utf8mb4;

ALTER TABLE orders
  ADD COLUMN order_lookup_token_hash CHAR(64) NULL AFTER order_number,
  ADD COLUMN order_lookup_token_issued_at DATETIME NULL AFTER order_lookup_token_hash,
  ADD COLUMN order_lookup_token_last_used_at DATETIME NULL AFTER order_lookup_token_issued_at;

CREATE INDEX idx_orders_lookup_token_hash ON orders(order_lookup_token_hash);
