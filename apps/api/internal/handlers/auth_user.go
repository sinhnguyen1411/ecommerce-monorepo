package handlers

import (
	"database/sql"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/go-sql-driver/mysql"

	"ecommerce-monorepo/apps/api/internal/auth"
)

const (
	channelEmail = "email"

	purposeReset             = "reset_password"
	purposeEmailVerification = "verify_email"
)

type EmailRequestInput struct {
	Email string `json:"email"`
}

type OTPVerifyInput struct {
	RequestID int    `json:"request_id"`
	Code      string `json:"code"`
}

type RegisterInput struct {
	Email           string `json:"email"`
	Name            string `json:"name"`
	DOB             string `json:"dob"`
	Phone           string `json:"phone"`
	Address         string `json:"address"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`
}

type LoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type EmailOTPVerifyInput struct {
	OTP string `json:"otp"`
}

type RefreshInput struct {
	RefreshToken string `json:"refresh_token"`
}

type LogoutInput struct {
	RefreshToken string `json:"refresh_token"`
}

type ForgotResetInput struct {
	VerificationToken string `json:"verification_token"`
	NewPassword       string `json:"new_password"`
}

type ChangePasswordInput struct {
	OldPassword string `json:"old_password"`
	NewPassword string `json:"new_password"`
}

type RefreshSessionInfo struct {
	ID        int        `json:"id"`
	UserAgent *string    `json:"user_agent,omitempty"`
	IP        *string    `json:"ip,omitempty"`
	DeviceID  *string    `json:"device_id,omitempty"`
	ExpiresAt time.Time  `json:"expires_at"`
	RevokedAt *time.Time `json:"revoked_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
}

func (s *Server) Register(c *gin.Context) {
	var input RegisterInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid registration payload")
		return
	}

	email, err := auth.NormalizeEmail(input.Email)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_email", "Invalid email address")
		return
	}

	name := strings.TrimSpace(input.Name)
	address := strings.TrimSpace(input.Address)
	if name == "" || address == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Name and address are required")
		return
	}

	if strings.TrimSpace(input.Password) == "" || strings.TrimSpace(input.PasswordConfirm) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Password and confirmation are required")
		return
	}
	if input.Password != input.PasswordConfirm {
		respondError(c, http.StatusBadRequest, "password_mismatch", "Passwords do not match")
		return
	}
	if err := auth.ValidatePassword(input.Password, s.Config.PasswordMinLength); err != nil {
		respondError(c, http.StatusBadRequest, "weak_password", "Password does not meet requirements")
		return
	}

	dob := strings.TrimSpace(input.DOB)
	if dob == "" {
		respondError(c, http.StatusBadRequest, "invalid_dob", "DOB must be YYYY-MM-DD")
		return
	}
	birthdate, err := time.Parse("2006-01-02", dob)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_dob", "DOB must be YYYY-MM-DD")
		return
	}
	if !isAtLeastAge(birthdate, 13) {
		respondError(c, http.StatusBadRequest, "underage", "User must be at least 13 years old")
		return
	}

	phone := strings.TrimSpace(input.Phone)
	var phoneE164 any = nil
	var phoneNational any = nil
	if phone != "" {
		normalized, national, err := auth.NormalizeVNPhone(phone)
		if err != nil {
			respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
			return
		}
		phoneE164 = normalized
		phoneNational = national
	}

	if exists, err := s.userExistsByEmail(email); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate email")
		return
	} else if exists {
		respondError(c, http.StatusConflict, "already_exists", "Account already exists")
		return
	}

	passwordHash, err := auth.HashPassword(input.Password, auth.DefaultPasswordParams)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "hash_error", "Failed to secure password")
		return
	}

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create account")
		return
	}
	defer tx.Rollback()

	result, err := tx.Exec(`
    INSERT INTO users (email, phone_e164, phone_national, is_email_verified, is_phone_verified,
      password_hash, full_name, address, birthdate, status)
    VALUES (?, ?, ?, FALSE, FALSE, ?, ?, ?, ?, 'active')
  `, email, phoneE164, phoneNational, passwordHash, name, address, birthdate)
	if err != nil {
		if isDuplicateErr(err) {
			respondError(c, http.StatusConflict, "already_exists", "Account already exists")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create account")
		return
	}

	userID64, err := result.LastInsertId()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create account")
		return
	}
	userID := int(userID64)

	if address != "" && phoneNational != nil {
		if _, err := tx.Exec(`
      INSERT INTO user_addresses (user_id, full_name, phone, address_line, is_default)
      VALUES (?, ?, ?, ?, TRUE)
    `, userID, name, phoneNational, address); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to save address")
			return
		}
	}

	if err := tx.Commit(); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to finalize account")
		return
	}

	accessToken, refreshToken, err := s.issueTokens(c, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue tokens")
		return
	}
	s.setAuthCookies(c, accessToken, refreshToken)

	user, err := s.loadUserByID(userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}

	s.logAudit(c, &userID, "register", nil)

	respondOK(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          authUserResponse(user),
	})
}

func (s *Server) SendEmailOTP(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	row := s.DB.QueryRow(`SELECT email, is_email_verified FROM users WHERE id = ?`, userID)
	var email sql.NullString
	var verified bool
	if err := row.Scan(&email, &verified); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load email")
		return
	}

	if verified {
		respondOK(c, gin.H{
			"sent":                    false,
			"emailVerificationStatus": emailVerificationStatus(true),
		})
		return
	}

	if !email.Valid || strings.TrimSpace(email.String) == "" {
		respondOK(c, gin.H{
			"sent":                    true,
			"cooldown_seconds":        int(s.Config.OTPCooldown.Seconds()),
			"emailVerificationStatus": emailVerificationStatus(false),
		})
		return
	}

	cooldownKey := fmt.Sprintf("email_otp:cooldown:user:%d", userID)
	allowed, retryAfter, err := s.checkRateLimit(cooldownKey, 1, s.Config.OTPCooldown)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "rate_limit_error", "Rate limit check failed")
		return
	}
	if !allowed {
		if retryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
		}
		respondError(c, http.StatusTooManyRequests, "otp_cooldown", "OTP cooldown active")
		return
	}

	userKey := fmt.Sprintf("email_otp:user:%d", userID)
	allowed, retryAfter, err = s.checkRateLimit(userKey, 5, time.Hour)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "rate_limit_error", "Rate limit check failed")
		return
	}
	if !allowed {
		if retryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
		}
		respondError(c, http.StatusTooManyRequests, "otp_rate_limited", "OTP send rate limit exceeded")
		return
	}

	ipKey := fmt.Sprintf("email_otp:ip:%s", c.ClientIP())
	allowed, retryAfter, err = s.checkRateLimit(ipKey, 5, time.Hour)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "rate_limit_error", "Rate limit check failed")
		return
	}
	if !allowed {
		if retryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
		}
		respondError(c, http.StatusTooManyRequests, "otp_rate_limited", "OTP send rate limit exceeded")
		return
	}

	code, err := auth.GenerateOTPCode()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "otp_failed", "Failed to generate OTP")
		return
	}

	_, _ = s.DB.Exec(`UPDATE otp_verifications SET consumed_at = ? WHERE destination = ? AND purpose = ? AND consumed_at IS NULL`,
		time.Now(), email.String, purposeEmailVerification)

	codeHash := auth.HashOTP(code, email.String, purposeEmailVerification, s.Config.OTPSecret)
	now := time.Now()
	expiresAt := now.Add(s.Config.OTPTTL)

	result, err := s.DB.Exec(`
    INSERT INTO otp_verifications (channel, destination, code_hash, purpose, expires_at, last_sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, channelEmail, email.String, codeHash, purposeEmailVerification, expiresAt, now)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to store OTP")
		return
	}

	requestID64, err := result.LastInsertId()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to store OTP")
		return
	}
	requestID := int(requestID64)

	message := "Your email verification code is " + code + ". It expires in " + strconv.Itoa(int(s.Config.OTPTTL.Minutes())) + " minutes."
	if err := s.EmailSender.Send(email.String, "Verify your email", message); err != nil {
		_, _ = s.DB.Exec(`DELETE FROM otp_verifications WHERE id = ?`, requestID)
		respondError(c, http.StatusInternalServerError, "email_send_failed", "Failed to send verification email")
		return
	}

	s.logAudit(c, &userID, "otp_sent", map[string]any{
		"purpose": purposeEmailVerification,
		"channel": channelEmail,
		"dest":    maskEmail(email.String),
	})

	respondOK(c, gin.H{
		"sent":                    true,
		"cooldown_seconds":        int(s.Config.OTPCooldown.Seconds()),
		"emailVerificationStatus": emailVerificationStatus(false),
	})
}

func (s *Server) VerifyEmailOTP(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input EmailOTPVerifyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid verification payload")
		return
	}

	code := strings.TrimSpace(input.OTP)
	if code == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "OTP is required")
		return
	}

	row := s.DB.QueryRow(`SELECT email, is_email_verified FROM users WHERE id = ?`, userID)
	var email sql.NullString
	var verified bool
	if err := row.Scan(&email, &verified); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load email")
		return
	}

	if verified {
		respondOK(c, gin.H{
			"emailVerificationStatus": emailVerificationStatus(true),
		})
		return
	}

	if !email.Valid || strings.TrimSpace(email.String) == "" {
		respondError(c, http.StatusBadRequest, "email_missing", "Email is required for verification")
		return
	}

	var recordID int
	var codeHash string
	var expiresAt time.Time
	var attemptsCount int
	row = s.DB.QueryRow(`
    SELECT id, code_hash, expires_at, attempts_count
    FROM otp_verifications
    WHERE destination = ? AND purpose = ? AND consumed_at IS NULL
    ORDER BY last_sent_at DESC
    LIMIT 1
  `, email.String, purposeEmailVerification)
	if err := row.Scan(&recordID, &codeHash, &expiresAt, &attemptsCount); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(c, http.StatusBadRequest, "otp_not_found", "OTP not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load OTP")
		return
	}

	if auth.OTPExpired(expiresAt) {
		respondError(c, http.StatusBadRequest, "otp_expired", "OTP expired")
		return
	}
	if auth.OTPAttemptsExceeded(attemptsCount, s.Config.OTPMaxAttempts) {
		respondError(c, http.StatusTooManyRequests, "otp_attempts", "Too many attempts")
		return
	}

	if !auth.VerifyOTP(code, email.String, purposeEmailVerification, s.Config.OTPSecret, codeHash) {
		attemptsCount++
		_, _ = s.DB.Exec(`UPDATE otp_verifications SET attempts_count = ? WHERE id = ?`, attemptsCount, recordID)
		if auth.OTPAttemptsExceeded(attemptsCount, s.Config.OTPMaxAttempts) {
			respondError(c, http.StatusTooManyRequests, "otp_attempts", "Too many attempts")
			return
		}
		respondError(c, http.StatusBadRequest, "invalid_code", "Invalid verification code")
		return
	}

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to verify email")
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`UPDATE users SET is_email_verified = TRUE WHERE id = ?`, userID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to verify email")
		return
	}
	if _, err := tx.Exec(`DELETE FROM otp_verifications WHERE id = ?`, recordID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to clear OTP")
		return
	}
	if err := tx.Commit(); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to verify email")
		return
	}

	s.logAudit(c, &userID, "otp_verified", map[string]any{
		"purpose": purposeEmailVerification,
		"channel": channelEmail,
		"dest":    maskEmail(email.String),
	})

	respondOK(c, gin.H{
		"emailVerificationStatus": emailVerificationStatus(true),
	})
}

func (s *Server) Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid login payload")
		return
	}

	emailRaw := strings.TrimSpace(input.Email)
	if emailRaw == "" || input.Password == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Email and password are required")
		return
	}

	normalized, err := auth.NormalizeEmail(emailRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_email", "Invalid email address")
		return
	}

	user, err := s.loadUserByEmail(normalized)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load account")
		return
	}

	if user.Status != "active" {
		respondError(c, http.StatusForbidden, "account_locked", "Account is not active")
		return
	}

	if user.LockedUntil.Valid && user.LockedUntil.Time.After(time.Now()) {
		respondError(c, http.StatusTooManyRequests, "account_locked", "Account is temporarily locked")
		return
	}

	if !user.PasswordHash.Valid {
		respondError(c, http.StatusUnauthorized, "password_not_set", "Password is not set for this account")
		return
	}

	ok, err := auth.VerifyPassword(user.PasswordHash.String, input.Password)
	if err != nil || !ok {
		s.handleLoginFailure(c, user)
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
		return
	}

	if _, err := s.DB.Exec(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?`, time.Now(), user.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update login state")
		return
	}

	accessToken, refreshToken, err := s.issueTokens(c, user.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue tokens")
		return
	}
	s.setAuthCookies(c, accessToken, refreshToken)

	s.logAudit(c, &user.ID, "login_success", nil)

	respondOK(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          authUserResponse(user),
	})
}

func (s *Server) Logout(c *gin.Context) {
	var input LogoutInput
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&input); err != nil {
			respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid logout payload")
			return
		}
	}

	refreshToken := strings.TrimSpace(input.RefreshToken)
	if refreshToken == "" {
		refreshToken = getCookie(c, refreshTokenCookie)
	}

	if refreshToken != "" {
		hash := auth.HashToken(refreshToken)
		_, _ = s.DB.Exec(`UPDATE refresh_sessions SET revoked_at = ? WHERE refresh_token_hash = ? AND revoked_at IS NULL`, time.Now(), hash)
	}

	s.clearAuthCookies(c)
	respondOK(c, gin.H{"revoked": true})
}

func (s *Server) Refresh(c *gin.Context) {
	var input RefreshInput
	if c.Request.ContentLength > 0 {
		if err := c.ShouldBindJSON(&input); err != nil {
			respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid refresh payload")
			return
		}
	}

	refreshToken := strings.TrimSpace(input.RefreshToken)
	if refreshToken == "" {
		refreshToken = getCookie(c, refreshTokenCookie)
	}
	if refreshToken == "" {
		s.clearAuthCookies(c)
		respondError(c, http.StatusBadRequest, "missing_token", "Refresh token is required")
		return
	}

	hash := auth.HashToken(refreshToken)

	var sessionID int
	var userID int
	var expiresAt time.Time
	var revokedAt sql.NullTime
	row := s.DB.QueryRow(`
    SELECT id, user_id, expires_at, revoked_at
    FROM refresh_sessions
    WHERE refresh_token_hash = ?
    LIMIT 1
  `, hash)
	if err := row.Scan(&sessionID, &userID, &expiresAt, &revokedAt); err != nil {
		s.clearAuthCookies(c)
		respondError(c, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}

	if revokedAt.Valid {
		s.logAudit(c, &userID, "refresh_reuse", nil)
		_, _ = s.DB.Exec(`UPDATE refresh_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`, time.Now(), userID)
		s.clearAuthCookies(c)
		respondError(c, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}

	if time.Now().After(expiresAt) {
		s.clearAuthCookies(c)
		respondError(c, http.StatusUnauthorized, "expired_token", "Refresh token expired")
		return
	}

	var status string
	if err := s.DB.QueryRow(`SELECT status FROM users WHERE id = ?`, userID).Scan(&status); err != nil {
		s.clearAuthCookies(c)
		respondError(c, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}
	if status != "active" {
		s.clearAuthCookies(c)
		respondError(c, http.StatusForbidden, "account_locked", "Account is not active")
		return
	}

	if _, err := s.DB.Exec(`UPDATE refresh_sessions SET revoked_at = ? WHERE id = ?`, time.Now(), sessionID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to rotate session")
		return
	}

	accessToken, newRefreshToken, err := s.issueTokens(c, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue tokens")
		return
	}
	s.setAuthCookies(c, accessToken, newRefreshToken)

	respondOK(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}

func (s *Server) ForgotPasswordRequestOTP(c *gin.Context) {
	var input EmailRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload")
		return
	}

	email, err := auth.NormalizeEmail(input.Email)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_email", "Invalid email address")
		return
	}

	if exists, err := s.userExistsByEmail(email); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate destination")
		return
	} else if !exists {
		respondOK(c, gin.H{"request_id": 0, "cooldown_seconds": int(s.Config.OTPCooldown.Seconds())})
		return
	}

	requestID, cooldown, err := s.sendOTP(c, email, purposeReset)
	if err != nil {
		s.handleOTPSendError(c, err)
		return
	}

	respondOK(c, gin.H{"request_id": requestID, "cooldown_seconds": int(cooldown.Seconds())})
}

func (s *Server) ForgotPasswordVerifyOTP(c *gin.Context) {
	s.verifyOTPForPurpose(c, purposeReset)
}

func (s *Server) ForgotPasswordReset(c *gin.Context) {
	var input ForgotResetInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid reset payload")
		return
	}
	if input.VerificationToken == "" {
		respondError(c, http.StatusBadRequest, "missing_token", "Verification token is required")
		return
	}
	if err := auth.ValidatePassword(input.NewPassword, s.Config.PasswordMinLength); err != nil {
		respondError(c, http.StatusBadRequest, "weak_password", "Password does not meet requirements")
		return
	}

	claims, err := s.parseVerificationToken(input.VerificationToken)
	if err != nil || claims.Purpose != purposeReset {
		respondError(c, http.StatusBadRequest, "invalid_token", "Invalid verification token")
		return
	}

	otpRecord, err := s.getOTPRecord(claims.OTPID)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.Purpose != purposeReset {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.ConsumedAt == nil {
		respondError(c, http.StatusBadRequest, "otp_not_verified", "OTP not verified")
		return
	}

	user, err := s.loadUserByEmail(otpRecord.Destination)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			respondOK(c, gin.H{"reset": true})
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to reset password")
		return
	}

	hash, err := auth.HashPassword(input.NewPassword, auth.DefaultPasswordParams)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "hash_error", "Failed to secure password")
		return
	}

	if _, err := s.DB.Exec(`UPDATE users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE id = ?`, hash, user.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to reset password")
		return
	}

	s.logAudit(c, &user.ID, "password_reset", nil)

	respondOK(c, gin.H{"reset": true})
}

func (s *Server) ChangePassword(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input ChangePasswordInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid payload")
		return
	}
	if input.OldPassword == "" || input.NewPassword == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Old and new passwords are required")
		return
	}
	if err := auth.ValidatePassword(input.NewPassword, s.Config.PasswordMinLength); err != nil {
		respondError(c, http.StatusBadRequest, "weak_password", "Password does not meet requirements")
		return
	}

	user, err := s.loadUserByID(userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load account")
		return
	}
	if !user.PasswordHash.Valid {
		respondError(c, http.StatusBadRequest, "password_not_set", "Password is not set")
		return
	}
	ok, err := auth.VerifyPassword(user.PasswordHash.String, input.OldPassword)
	if err != nil || !ok {
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
		return
	}

	hash, err := auth.HashPassword(input.NewPassword, auth.DefaultPasswordParams)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "hash_error", "Failed to secure password")
		return
	}
	if _, err := s.DB.Exec(`UPDATE users SET password_hash = ? WHERE id = ?`, hash, userID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update password")
		return
	}

	s.logAudit(c, &userID, "password_changed", nil)

	respondOK(c, gin.H{"changed": true})
}

func (s *Server) ListSessions(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	rows, err := s.DB.Query(`
    SELECT id, user_agent, ip, device_id, expires_at, revoked_at, created_at
    FROM refresh_sessions
    WHERE user_id = ?
    ORDER BY created_at DESC
  `, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load sessions")
		return
	}
	defer rows.Close()

	sessions := make([]RefreshSessionInfo, 0)
	for rows.Next() {
		var session RefreshSessionInfo
		var userAgent sql.NullString
		var ip sql.NullString
		var deviceID sql.NullString
		var revokedAt sql.NullTime
		if err := rows.Scan(&session.ID, &userAgent, &ip, &deviceID, &session.ExpiresAt, &revokedAt, &session.CreatedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to load sessions")
			return
		}
		if userAgent.Valid {
			session.UserAgent = &userAgent.String
		}
		if ip.Valid {
			session.IP = &ip.String
		}
		if deviceID.Valid {
			session.DeviceID = &deviceID.String
		}
		if revokedAt.Valid {
			session.RevokedAt = &revokedAt.Time
		}
		sessions = append(sessions, session)
	}

	respondOK(c, sessions)
}

func (s *Server) RevokeSession(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	sessionID, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_session", "Invalid session ID")
		return
	}
	result, err := s.DB.Exec(`UPDATE refresh_sessions SET revoked_at = ? WHERE id = ? AND user_id = ? AND revoked_at IS NULL`, time.Now(), sessionID, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to revoke session")
		return
	}
	affected, _ := result.RowsAffected()
	if affected == 0 {
		respondError(c, http.StatusNotFound, "not_found", "Session not found")
		return
	}

	respondOK(c, gin.H{"revoked": true})
}

func (s *Server) handleLoginFailure(c *gin.Context, user *userAuthRecord) {
	attempts := user.FailedLoginAttempts + 1
	var lockedUntil sql.NullTime
	if attempts >= s.Config.LoginMaxAttempts {
		lockedUntil = sql.NullTime{Time: time.Now().Add(s.Config.LoginLockoutDuration), Valid: true}
	}
	_, _ = s.DB.Exec(`UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`, attempts, lockedUntil, user.ID)

	s.logAudit(c, &user.ID, "login_failed", map[string]any{
		"attempts": attempts,
	})
}

func (s *Server) userExistsByEmail(email string) (bool, error) {
	var count int
	row := s.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE email = ?`, email)
	err := row.Scan(&count)
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

type otpRecord struct {
	ID            int
	Channel       string
	Destination   string
	CodeHash      string
	Purpose       string
	ExpiresAt     time.Time
	ConsumedAt    *time.Time
	CompletedAt   *time.Time
	AttemptsCount int
}

func (s *Server) getOTPRecord(id int) (*otpRecord, error) {
	var record otpRecord
	var consumedAt sql.NullTime
	var completedAt sql.NullTime
	row := s.DB.QueryRow(`
    SELECT id, channel, destination, code_hash, purpose, expires_at, consumed_at, completed_at, attempts_count
    FROM otp_verifications
    WHERE id = ?
  `, id)
	if err := row.Scan(&record.ID, &record.Channel, &record.Destination, &record.CodeHash, &record.Purpose, &record.ExpiresAt, &consumedAt, &completedAt, &record.AttemptsCount); err != nil {
		return nil, err
	}
	if consumedAt.Valid {
		record.ConsumedAt = &consumedAt.Time
	}
	if completedAt.Valid {
		record.CompletedAt = &completedAt.Time
	}
	return &record, nil
}

func (s *Server) verifyOTPForPurpose(c *gin.Context, purpose string) {
	var input OTPVerifyInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid verification payload")
		return
	}
	if input.RequestID == 0 || strings.TrimSpace(input.Code) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Request ID and code are required")
		return
	}

	record, err := s.getOTPRecord(input.RequestID)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if record.Purpose != purpose {
		respondError(c, http.StatusBadRequest, "invalid_purpose", "Invalid OTP purpose")
		return
	}
	if record.ConsumedAt != nil {
		respondError(c, http.StatusBadRequest, "otp_used", "OTP already used")
		return
	}
	if auth.OTPExpired(record.ExpiresAt) {
		respondError(c, http.StatusBadRequest, "otp_expired", "OTP expired")
		return
	}
	if auth.OTPAttemptsExceeded(record.AttemptsCount, s.Config.OTPMaxAttempts) {
		respondError(c, http.StatusTooManyRequests, "otp_attempts", "Too many attempts")
		return
	}

	if !auth.VerifyOTP(strings.TrimSpace(input.Code), record.Destination, record.Purpose, s.Config.OTPSecret, record.CodeHash) {
		_, _ = s.DB.Exec(`UPDATE otp_verifications SET attempts_count = attempts_count + 1 WHERE id = ?`, record.ID)
		respondError(c, http.StatusBadRequest, "invalid_code", "Invalid verification code")
		return
	}

	if _, err := s.DB.Exec(`UPDATE otp_verifications SET consumed_at = ?, attempts_count = attempts_count + 1 WHERE id = ?`, time.Now(), record.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to verify code")
		return
	}

	verificationToken, err := s.signVerificationToken(record.ID, record.Purpose, record.Channel, record.Destination)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue verification token")
		return
	}

	s.logAudit(c, nil, "otp_verified", map[string]any{
		"purpose": record.Purpose,
		"channel": record.Channel,
		"dest":    maskDestination(record.Channel, record.Destination),
	})

	respondOK(c, gin.H{"verification_token": verificationToken})
}

type otpSendError struct {
	Code       string
	Message    string
	RetryAfter time.Duration
}

func (e otpSendError) Error() string {
	return e.Message
}

func (s *Server) handleOTPSendError(c *gin.Context, err error) {
	var sendErr otpSendError
	if errors.As(err, &sendErr) {
		if sendErr.RetryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(int(sendErr.RetryAfter.Seconds())))
		}
		respondError(c, http.StatusTooManyRequests, sendErr.Code, sendErr.Message)
		return
	}
	respondError(c, http.StatusBadRequest, "otp_failed", err.Error())
}

func (s *Server) sendOTP(c *gin.Context, destination, purpose string) (int, time.Duration, error) {
	cooldownRemaining, err := s.otpCooldownRemaining(destination)
	if err != nil {
		return 0, 0, errors.New("rate limit check failed")
	}
	if cooldownRemaining > 0 {
		return 0, cooldownRemaining, otpSendError{
			Code:       "otp_cooldown",
			Message:    "OTP cooldown active",
			RetryAfter: cooldownRemaining,
		}
	}

	key := "otp_send:" + destination + ":" + purpose
	allowed, retryAfter, err := s.checkRateLimit(key, s.Config.OTPSendMax, s.Config.OTPSendWindow)
	if err != nil {
		return 0, 0, errors.New("rate limit check failed")
	}
	if !allowed {
		return 0, retryAfter, otpSendError{
			Code:       "otp_rate_limited",
			Message:    "OTP send rate limit exceeded",
			RetryAfter: retryAfter,
		}
	}

	code, err := auth.GenerateOTPCode()
	if err != nil {
		return 0, 0, errors.New("failed to generate code")
	}

	codeHash := auth.HashOTP(code, destination, purpose, s.Config.OTPSecret)
	now := time.Now()
	expiresAt := now.Add(s.Config.OTPTTL)

	result, err := s.DB.Exec(`
    INSERT INTO otp_verifications (channel, destination, code_hash, purpose, expires_at, last_sent_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, channelEmail, destination, codeHash, purpose, expiresAt, now)
	if err != nil {
		return 0, 0, errors.New("failed to store code")
	}

	requestID64, err := result.LastInsertId()
	if err != nil {
		return 0, 0, errors.New("failed to store code")
	}
	requestID := int(requestID64)

	message := "Your verification code is " + code + ". It expires in " + strconv.Itoa(int(s.Config.OTPTTL.Minutes())) + " minutes."
	if err := s.EmailSender.Send(destination, "Your verification code", message); err != nil {
		_, _ = s.DB.Exec(`UPDATE otp_verifications SET consumed_at = ? WHERE id = ?`, time.Now(), requestID)
		return 0, 0, errors.New("failed to send email")
	}

	s.logAudit(c, nil, "otp_sent", map[string]any{
		"purpose": purpose,
		"channel": channelEmail,
		"dest":    maskDestination(channelEmail, destination),
	})

	return requestID, s.Config.OTPCooldown, nil
}

func (s *Server) otpCooldownRemaining(destination string) (time.Duration, error) {
	row := s.DB.QueryRow(`
    SELECT last_sent_at
    FROM otp_verifications
    WHERE destination = ?
    ORDER BY last_sent_at DESC
    LIMIT 1
  `, destination)
	var lastSent time.Time
	if err := row.Scan(&lastSent); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return 0, nil
		}
		return 0, err
	}
	elapsed := time.Since(lastSent)
	if elapsed >= s.Config.OTPCooldown {
		return 0, nil
	}
	return s.Config.OTPCooldown - elapsed, nil
}

func (s *Server) issueTokens(c *gin.Context, userID int) (string, string, error) {
	accessToken, err := s.signToken(userID, "user", s.Config.UserTokenTTL)
	if err != nil {
		return "", "", err
	}

	refreshToken, err := auth.GenerateRefreshToken()
	if err != nil {
		return "", "", err
	}

	hash := auth.HashToken(refreshToken)
	expiresAt := time.Now().Add(s.Config.RefreshTokenTTL)

	userAgent := c.GetHeader("User-Agent")
	deviceID := c.GetHeader("X-Device-ID")
	ip := c.ClientIP()

	if _, err := s.DB.Exec(`
    INSERT INTO refresh_sessions (user_id, refresh_token_hash, user_agent, ip, device_id, expires_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `, userID, hash, userAgent, ip, deviceID, expiresAt); err != nil {
		return "", "", err
	}

	return accessToken, refreshToken, nil
}

func isAtLeastAge(birthdate time.Time, minAge int) bool {
	now := time.Now().UTC()
	years := now.Year() - birthdate.Year()
	if now.Month() < birthdate.Month() || (now.Month() == birthdate.Month() && now.Day() < birthdate.Day()) {
		years--
	}
	return years >= minAge
}

func isDuplicateErr(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) {
		return mysqlErr.Number == 1062
	}
	return false
}
