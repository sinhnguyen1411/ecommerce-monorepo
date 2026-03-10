ALTER TABLE admin_users
  ADD COLUMN failed_login_attempts INT DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL,
  ADD COLUMN last_login_at DATETIME NULL;
