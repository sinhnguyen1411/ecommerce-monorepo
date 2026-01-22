INSERT IGNORE INTO users (email, full_name, phone_e164, phone_national, is_email_verified, is_phone_verified, password_hash, address, status)
VALUES ('buyer@tambo.local', 'Buyer Test', '+84900000002', '0900000002', TRUE, TRUE,
  '$argon2id$v=19$m=65536,t=3,p=2$80Ho4mBLwUovLetXqVQdSQ$zHBkXO/qyU0uDJO8iYbLPrP89ZF69XUzL/8oCBLhpMY',
  '12 Test Street, District 3, Ho Chi Minh', 'active')
;

INSERT INTO user_addresses (user_id, full_name, phone, address_line, province, district, is_default)
SELECT id, 'Buyer Test', '0900000002', '12 Test Street', 'Ho Chi Minh', 'District 3', TRUE
FROM users
WHERE email = 'buyer@tambo.local'
  AND NOT EXISTS (
    SELECT 1 FROM user_addresses WHERE user_id = users.id
  )
LIMIT 1;
