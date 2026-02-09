ALTER TABLE payment_settings
  ADD COLUMN bank_id VARCHAR(32) NULL,
  ADD COLUMN bank_qr_template VARCHAR(32) DEFAULT 'compact2';

ALTER TABLE orders
  ADD COLUMN transfer_content VARCHAR(64) NULL,
  ADD COLUMN qr_method VARCHAR(16) NULL,
  ADD COLUMN qr_template VARCHAR(32) NULL,
  ADD COLUMN qr_value TEXT NULL,
  ADD COLUMN qr_created_at DATETIME NULL;
