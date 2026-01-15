package handlers

import (
	"database/sql"
	"errors"
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
	channelSMS   = "sms"

	purposeSignup      = "signup"
	purposeReset       = "reset_password"
	purposeChangeEmail = "change_email"
	purposeChangePhone = "change_phone"
)

type OTPRequestInput struct {
	Channel string `json:"channel"`
	Email   string `json:"email"`
	Phone   string `json:"phone"`
}

type OTPVerifyInput struct {
	RequestID int    `json:"request_id"`
	Code      string `json:"code"`
}

type SignupCompleteInput struct {
	VerificationToken string `json:"verification_token"`
	Password          string `json:"password"`
	FullName          string `json:"full_name"`
	AvatarURL         string `json:"avatar_url"`
	Address           string `json:"address"`
}

type LoginInput struct {
	Identifier string `json:"identifier"`
	Password   string `json:"password"`
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

type LinkEmailInput struct {
	Email string `json:"email"`
}

type LinkPhoneInput struct {
	Phone string `json:"phone"`
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

func (s *Server) SignupRequestOTP(c *gin.Context) {
	var input OTPRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload")
		return
	}

	destination, _, err := s.normalizeDestination(input.Channel, input.Email, input.Phone)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_destination", err.Error())
		return
	}

	if exists, err := s.userExistsByDestination(input.Channel, destination); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate destination")
		return
	} else if exists {
		respondError(c, http.StatusConflict, "already_exists", "Account already exists")
		return
	}

	requestID, cooldown, err := s.sendOTP(c, input.Channel, destination, purposeSignup)
	if err != nil {
		s.handleOTPSendError(c, err)
		return
	}

	respondOK(c, gin.H{"request_id": requestID, "cooldown_seconds": int(cooldown.Seconds())})
}

func (s *Server) SignupVerifyOTP(c *gin.Context) {
	s.verifyOTPForPurpose(c, purposeSignup)
}

func (s *Server) SignupComplete(c *gin.Context) {
	var input SignupCompleteInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid signup payload")
		return
	}
	if input.VerificationToken == "" {
		respondError(c, http.StatusBadRequest, "missing_token", "Verification token is required")
		return
	}
	if err := auth.ValidatePassword(input.Password, s.Config.PasswordMinLength); err != nil {
		respondError(c, http.StatusBadRequest, "weak_password", "Password does not meet requirements")
		return
	}

	claims, err := s.parseVerificationToken(input.VerificationToken)
	if err != nil || claims.Purpose != purposeSignup {
		respondError(c, http.StatusBadRequest, "invalid_token", "Invalid verification token")
		return
	}

	otpRecord, err := s.getOTPRecord(claims.OTPID)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.Purpose != purposeSignup {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.ConsumedAt == nil {
		respondError(c, http.StatusBadRequest, "otp_not_verified", "OTP not verified")
		return
	}
	if otpRecord.CompletedAt != nil {
		respondError(c, http.StatusBadRequest, "otp_already_used", "Verification already completed")
		return
	}

	if exists, err := s.userExistsByDestination(otpRecord.Channel, otpRecord.Destination); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate destination")
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

	fullName := strings.TrimSpace(input.FullName)
	avatarURL := strings.TrimSpace(input.AvatarURL)
	address := strings.TrimSpace(input.Address)

	var email any = nil
	var phoneE164 any = nil
	var phoneNational any = nil
	isEmailVerified := false
	isPhoneVerified := false

	if otpRecord.Channel == channelEmail {
		email = otpRecord.Destination
		isEmailVerified = true
	} else {
		phoneE164 = otpRecord.Destination
		phoneNational = otpRecord.DestinationNational
		isPhoneVerified = true
	}

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create account")
		return
	}
	defer tx.Rollback()

	result, err := tx.Exec(`
    INSERT INTO users (email, phone_e164, phone_national, is_email_verified, is_phone_verified,
      password_hash, full_name, avatar_url, address, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')
  `, email, phoneE164, phoneNational, isEmailVerified, isPhoneVerified, passwordHash, fullName, avatarURL, address)
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
    `, userID, fullName, phoneNational, address); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to save address")
			return
		}
	}

	if _, err := tx.Exec(`UPDATE otp_verifications SET completed_at = ? WHERE id = ?`, time.Now(), otpRecord.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to finalize verification")
		return
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

	user, err := s.loadUserByID(userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}

	s.logAudit(c, &userID, "signup_completed", map[string]any{
		"channel": otpRecord.Channel,
	})

	respondOK(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          authUserResponse(user),
	})
}

func (s *Server) Login(c *gin.Context) {
	var input LoginInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid login payload")
		return
	}

	identifier := strings.TrimSpace(input.Identifier)
	if identifier == "" || input.Password == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Identifier and password are required")
		return
	}

	var user *userAuthRecord
	var err error
	usingEmail := false

	if strings.Contains(identifier, "@") {
		normalized, err := auth.NormalizeEmail(identifier)
		if err != nil {
			respondError(c, http.StatusBadRequest, "invalid_identifier", "Invalid email address")
			return
		}
		usingEmail = true
		user, err = s.loadUserByEmail(normalized)
	} else {
		normalized, _, err := auth.NormalizeVNPhone(identifier)
		if err != nil {
			respondError(c, http.StatusBadRequest, "invalid_identifier", "Invalid phone number")
			return
		}
		user, err = s.loadUserByPhone(normalized)
	}

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

	if usingEmail && !user.IsEmailVerified {
		respondError(c, http.StatusForbidden, "email_not_verified", "Email is not verified")
		return
	}
	if !usingEmail && !user.IsPhoneVerified {
		respondError(c, http.StatusForbidden, "phone_not_verified", "Phone is not verified")
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

	s.logAudit(c, &user.ID, "login_success", nil)

	respondOK(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": refreshToken,
		"user":          authUserResponse(user),
	})
}

func (s *Server) Logout(c *gin.Context) {
	var input LogoutInput
	if err := c.ShouldBindJSON(&input); err != nil || strings.TrimSpace(input.RefreshToken) == "" {
		respondError(c, http.StatusBadRequest, "missing_token", "Refresh token is required")
		return
	}

	hash := auth.HashToken(strings.TrimSpace(input.RefreshToken))
	_, _ = s.DB.Exec(`UPDATE refresh_sessions SET revoked_at = ? WHERE refresh_token_hash = ? AND revoked_at IS NULL`, time.Now(), hash)
	respondOK(c, gin.H{"revoked": true})
}

func (s *Server) Refresh(c *gin.Context) {
	var input RefreshInput
	if err := c.ShouldBindJSON(&input); err != nil || strings.TrimSpace(input.RefreshToken) == "" {
		respondError(c, http.StatusBadRequest, "missing_token", "Refresh token is required")
		return
	}

	refreshToken := strings.TrimSpace(input.RefreshToken)
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
		respondError(c, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}

	if revokedAt.Valid {
		s.logAudit(c, &userID, "refresh_reuse", nil)
		_, _ = s.DB.Exec(`UPDATE refresh_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL`, time.Now(), userID)
		respondError(c, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}

	if time.Now().After(expiresAt) {
		respondError(c, http.StatusUnauthorized, "expired_token", "Refresh token expired")
		return
	}

	var status string
	if err := s.DB.QueryRow(`SELECT status FROM users WHERE id = ?`, userID).Scan(&status); err != nil {
		respondError(c, http.StatusUnauthorized, "invalid_token", "Invalid refresh token")
		return
	}
	if status != "active" {
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

	respondOK(c, gin.H{
		"access_token":  accessToken,
		"refresh_token": newRefreshToken,
	})
}

func (s *Server) ForgotPasswordRequestOTP(c *gin.Context) {
	var input OTPRequestInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload")
		return
	}

	destination, _, err := s.normalizeDestination(input.Channel, input.Email, input.Phone)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_destination", err.Error())
		return
	}

	if exists, err := s.userExistsByDestination(input.Channel, destination); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate destination")
		return
	} else if !exists {
		respondOK(c, gin.H{"request_id": 0, "cooldown_seconds": int(s.Config.OTPCooldown.Seconds())})
		return
	}

	requestID, cooldown, err := s.sendOTP(c, input.Channel, destination, purposeReset)
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

	var user *userAuthRecord
	if otpRecord.Channel == channelEmail {
		user, err = s.loadUserByEmail(otpRecord.Destination)
	} else {
		user, err = s.loadUserByPhone(otpRecord.Destination)
	}
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

func (s *Server) LinkEmailRequestOTP(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input LinkEmailInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload")
		return
	}

	email, err := auth.NormalizeEmail(input.Email)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_email", "Invalid email address")
		return
	}

	if exists, err := s.userExistsByDestination(channelEmail, email); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate email")
		return
	} else if exists {
		respondError(c, http.StatusConflict, "already_exists", "Email already in use")
		return
	}

	requestID, cooldown, err := s.sendOTP(c, channelEmail, email, purposeChangeEmail)
	if err != nil {
		s.handleOTPSendError(c, err)
		return
	}

	s.logAudit(c, &userID, "link_email_requested", map[string]any{
		"email_hint": maskEmail(email),
	})

	respondOK(c, gin.H{"request_id": requestID, "cooldown_seconds": int(cooldown.Seconds())})
}

func (s *Server) LinkEmailVerifyOTP(c *gin.Context) {
	s.verifyOTPForPurpose(c, purposeChangeEmail)
}

func (s *Server) LinkEmailComplete(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input ForgotResetInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid payload")
		return
	}
	if input.VerificationToken == "" {
		respondError(c, http.StatusBadRequest, "missing_token", "Verification token is required")
		return
	}

	claims, err := s.parseVerificationToken(input.VerificationToken)
	if err != nil || claims.Purpose != purposeChangeEmail {
		respondError(c, http.StatusBadRequest, "invalid_token", "Invalid verification token")
		return
	}

	otpRecord, err := s.getOTPRecord(claims.OTPID)
	if err != nil || otpRecord.Channel != channelEmail {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.Purpose != purposeChangeEmail {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.ConsumedAt == nil {
		respondError(c, http.StatusBadRequest, "otp_not_verified", "OTP not verified")
		return
	}

	if exists, err := s.userExistsByDestination(channelEmail, otpRecord.Destination); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate email")
		return
	} else if exists {
		respondError(c, http.StatusConflict, "already_exists", "Email already in use")
		return
	}

	if _, err := s.DB.Exec(`UPDATE users SET email = ?, is_email_verified = TRUE WHERE id = ?`, otpRecord.Destination, userID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to link email")
		return
	}

	s.logAudit(c, &userID, "link_email_completed", map[string]any{
		"email_hint": maskEmail(otpRecord.Destination),
	})

	respondOK(c, gin.H{"linked": true})
}

func (s *Server) LinkPhoneRequestOTP(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input LinkPhoneInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid request payload")
		return
	}

	phoneE164, _, err := auth.NormalizeVNPhone(input.Phone)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
		return
	}

	if exists, err := s.userExistsByDestination(channelSMS, phoneE164); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate phone")
		return
	} else if exists {
		respondError(c, http.StatusConflict, "already_exists", "Phone already in use")
		return
	}

	requestID, cooldown, err := s.sendOTP(c, channelSMS, phoneE164, purposeChangePhone)
	if err != nil {
		s.handleOTPSendError(c, err)
		return
	}

	s.logAudit(c, &userID, "link_phone_requested", map[string]any{
		"phone_hint": maskPhone(phoneE164),
	})

	respondOK(c, gin.H{"request_id": requestID, "cooldown_seconds": int(cooldown.Seconds())})
}

func (s *Server) LinkPhoneVerifyOTP(c *gin.Context) {
	s.verifyOTPForPurpose(c, purposeChangePhone)
}

func (s *Server) LinkPhoneComplete(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input ForgotResetInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid payload")
		return
	}
	if input.VerificationToken == "" {
		respondError(c, http.StatusBadRequest, "missing_token", "Verification token is required")
		return
	}

	claims, err := s.parseVerificationToken(input.VerificationToken)
	if err != nil || claims.Purpose != purposeChangePhone {
		respondError(c, http.StatusBadRequest, "invalid_token", "Invalid verification token")
		return
	}

	otpRecord, err := s.getOTPRecord(claims.OTPID)
	if err != nil || otpRecord.Channel != channelSMS {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.Purpose != purposeChangePhone {
		respondError(c, http.StatusBadRequest, "invalid_request", "Invalid verification request")
		return
	}
	if otpRecord.ConsumedAt == nil {
		respondError(c, http.StatusBadRequest, "otp_not_verified", "OTP not verified")
		return
	}

	if exists, err := s.userExistsByDestination(channelSMS, otpRecord.Destination); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to validate phone")
		return
	} else if exists {
		respondError(c, http.StatusConflict, "already_exists", "Phone already in use")
		return
	}

	if _, err := s.DB.Exec(`UPDATE users SET phone_e164 = ?, phone_national = ?, is_phone_verified = TRUE WHERE id = ?`, otpRecord.Destination, otpRecord.DestinationNational, userID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to link phone")
		return
	}

	s.logAudit(c, &userID, "link_phone_completed", map[string]any{
		"phone_hint": maskPhone(otpRecord.Destination),
	})

	respondOK(c, gin.H{"linked": true})
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

func (s *Server) normalizeDestination(channel, email, phone string) (string, string, error) {
	switch channel {
	case channelEmail:
		normalized, err := auth.NormalizeEmail(email)
		return normalized, "", err
	case channelSMS:
		return auth.NormalizeVNPhone(phone)
	default:
		return "", "", errors.New("invalid channel")
	}
}

func (s *Server) userExistsByDestination(channel, destination string) (bool, error) {
	var count int
	var err error
	if channel == channelEmail {
		row := s.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE email = ?`, destination)
		err = row.Scan(&count)
	} else {
		row := s.DB.QueryRow(`SELECT COUNT(*) FROM users WHERE phone_e164 = ?`, destination)
		err = row.Scan(&count)
	}
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

type otpRecord struct {
	ID                  int
	Channel             string
	Destination         string
	DestinationNational string
	CodeHash            string
	Purpose             string
	ExpiresAt           time.Time
	ConsumedAt          *time.Time
	CompletedAt         *time.Time
	AttemptsCount       int
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
	if record.Channel == channelSMS {
		if _, national, err := auth.NormalizeVNPhone(record.Destination); err == nil {
			record.DestinationNational = national
		}
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

func (s *Server) sendOTP(c *gin.Context, channel, destination, purpose string) (int, time.Duration, error) {
	if channel != channelEmail && channel != channelSMS {
		return 0, 0, errors.New("invalid channel")
	}

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
  `, channel, destination, codeHash, purpose, expiresAt, now)
	if err != nil {
		return 0, 0, errors.New("failed to store code")
	}

	requestID64, err := result.LastInsertId()
	if err != nil {
		return 0, 0, errors.New("failed to store code")
	}
	requestID := int(requestID64)

	message := "Your verification code is " + code + ". It expires in " + strconv.Itoa(int(s.Config.OTPTTL.Minutes())) + " minutes."
	if channel == channelEmail {
		if err := s.EmailSender.Send(destination, "Your verification code", message); err != nil {
			_, _ = s.DB.Exec(`UPDATE otp_verifications SET consumed_at = ? WHERE id = ?`, time.Now(), requestID)
			return 0, 0, errors.New("failed to send email")
		}
	} else {
		if err := s.SMSSender.Send(destination, message); err != nil {
			_, _ = s.DB.Exec(`UPDATE otp_verifications SET consumed_at = ? WHERE id = ?`, time.Now(), requestID)
			return 0, 0, errors.New("failed to send sms")
		}
	}

	s.logAudit(c, nil, "otp_sent", map[string]any{
		"purpose": purpose,
		"channel": channel,
		"dest":    maskDestination(channel, destination),
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

func isDuplicateErr(err error) bool {
	var mysqlErr *mysql.MySQLError
	if errors.As(err, &mysqlErr) {
		return mysqlErr.Number == 1062
	}
	return false
}
