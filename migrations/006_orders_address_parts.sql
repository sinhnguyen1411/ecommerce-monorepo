ALTER TABLE orders
  ADD COLUMN address_line VARCHAR(255) NULL AFTER address,
  ADD COLUMN district VARCHAR(255) NULL AFTER address_line,
  ADD COLUMN province VARCHAR(255) NULL AFTER district;
