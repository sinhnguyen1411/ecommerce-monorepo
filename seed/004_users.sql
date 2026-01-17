INSERT INTO users (email, full_name, phone_e164, phone_national, is_email_verified, is_phone_verified, password_hash, address, status)
VALUES ('buyer@tambo.local', 'Buyer Test', '+84900000002', '0900000002', TRUE, TRUE,
  '$argon2id$v=19$m=65536,t=3,p=2$80Ho4mBLwUovLetXqVQdSQ$zHBkXO/qyU0uDJO8iYbLPrP89ZF69XUzL/8oCBLhpMY',
  '12 Test Street, District 3, Ho Chi Minh', 'active')
ON DUPLICATE KEY UPDATE
  full_name = VALUES(full_name),
  phone_e164 = VALUES(phone_e164),
  phone_national = VALUES(phone_national),
  is_email_verified = VALUES(is_email_verified),
  is_phone_verified = VALUES(is_phone_verified),
  password_hash = VALUES(password_hash),
  address = VALUES(address),
  status = VALUES(status);

DELETE FROM user_addresses
WHERE user_id = (SELECT id FROM users WHERE email = 'buyer@tambo.local');

INSERT INTO user_addresses (user_id, full_name, phone, address_line, province, district, is_default)
SELECT id, 'Buyer Test', '0900000002', '12 Test Street', 'Ho Chi Minh', 'District 3', TRUE
FROM users
WHERE email = 'buyer@tambo.local'
LIMIT 1;
