ALTER TABLE users
  MODIFY email VARCHAR(255) NULL,
  CHANGE name full_name VARCHAR(255),
  CHANGE phone phone_e164 VARCHAR(32),
  ADD COLUMN phone_national VARCHAR(32),
  ADD COLUMN is_email_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN is_phone_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN password_hash VARCHAR(255),
  ADD COLUMN birthdate DATE,
  ADD COLUMN address VARCHAR(512),
  ADD COLUMN status VARCHAR(32) DEFAULT 'active',
  ADD COLUMN failed_login_attempts INT DEFAULT 0,
  ADD COLUMN locked_until DATETIME NULL,
  ADD COLUMN last_login_at DATETIME NULL;

CREATE UNIQUE INDEX uniq_users_phone_e164 ON users (phone_e164);
CREATE INDEX idx_users_status ON users (status);

CREATE TABLE IF NOT EXISTS auth_identities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  provider VARCHAR(32) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_provider_user (provider, provider_user_id),
  UNIQUE KEY uniq_user_provider (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO auth_identities (user_id, provider, provider_user_id)
SELECT id, 'google', google_id FROM users WHERE google_id IS NOT NULL
ON DUPLICATE KEY UPDATE provider_user_id = provider_user_id;

CREATE TABLE IF NOT EXISTS otp_verifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  channel VARCHAR(16) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  code_hash CHAR(64) NOT NULL,
  purpose VARCHAR(32) NOT NULL,
  expires_at DATETIME NOT NULL,
  consumed_at DATETIME NULL,
  attempts_count INT DEFAULT 0,
  last_sent_at DATETIME NOT NULL,
  completed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_otp_destination_purpose ON otp_verifications (destination, purpose);
CREATE INDEX idx_otp_expires_at ON otp_verifications (expires_at);

CREATE TABLE IF NOT EXISTS refresh_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  refresh_token_hash CHAR(64) NOT NULL,
  user_agent VARCHAR(512),
  ip VARCHAR(64),
  device_id VARCHAR(128),
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_refresh_token (refresh_token_hash),
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_expires (expires_at),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  action VARCHAR(64) NOT NULL,
  ip VARCHAR(64),
  meta_json JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_action (action),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS rate_limits (
  rate_key VARCHAR(128) PRIMARY KEY,
  window_start DATETIME NOT NULL,
  count INT NOT NULL
);

UPDATE users
SET is_email_verified = TRUE
WHERE email IS NOT NULL;
