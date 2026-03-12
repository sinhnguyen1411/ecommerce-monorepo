ALTER TABLE users
  ADD COLUMN onboarding_completed_at DATETIME NULL AFTER last_login_at;

UPDATE users
SET onboarding_completed_at = COALESCE(onboarding_completed_at, NOW())
WHERE onboarding_completed_at IS NULL
  AND full_name IS NOT NULL
  AND TRIM(full_name) <> ''
  AND birthdate IS NOT NULL
  AND password_hash IS NOT NULL
  AND TRIM(password_hash) <> ''
  AND (
    (phone_national IS NOT NULL AND TRIM(phone_national) <> '')
    OR (phone_e164 IS NOT NULL AND TRIM(phone_e164) <> '')
  )
  AND EXISTS (
    SELECT 1
    FROM user_addresses
    WHERE user_addresses.user_id = users.id
      AND user_addresses.is_default = TRUE
      AND TRIM(user_addresses.full_name) <> ''
      AND TRIM(user_addresses.phone) <> ''
      AND TRIM(user_addresses.address_line) <> ''
      AND TRIM(IFNULL(user_addresses.province, '')) <> ''
      AND TRIM(IFNULL(user_addresses.district, '')) <> ''
  );
