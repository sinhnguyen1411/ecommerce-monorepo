package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AdminLoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AdminProfile struct {
	ID    int    `json:"id"`
	Email string `json:"email"`
	Name  string `json:"name"`
	Role  string `json:"role"`
}

func (s *Server) AdminLogin(c *gin.Context) {
	var input AdminLoginInput
	if !s.bindJSONWithLimit(c, &input, "Invalid login payload") {
		return
	}

	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || input.Password == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Email and password are required")
		return
	}

	ipKey := rateLimitKey("admin_login:ip", c.ClientIP())
	if !s.enforceRateLimit(c, ipKey, s.Config.LoginIPRateLimitMax, s.Config.LoginIPRateLimitWindow, "login_rate_limited", "Too many login attempts") {
		return
	}

	emailKey := rateLimitKey("admin_login:email", hashIdentifier(email))
	if !s.enforceRateLimit(c, emailKey, s.Config.LoginIDRateLimitMax, s.Config.LoginIDRateLimitWindow, "login_rate_limited", "Too many login attempts") {
		return
	}

	var admin AdminProfile
	var hash string
	var failedAttempts int
	var lockedUntil sql.NullTime
	row := s.DB.QueryRow(`SELECT id, email, name, role, password_hash, failed_login_attempts, locked_until FROM admin_users WHERE email = ?`, email)
	if err := row.Scan(&admin.ID, &admin.Email, &admin.Name, &admin.Role, &hash, &failedAttempts, &lockedUntil); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load admin")
		return
	}

	if lockedUntil.Valid && lockedUntil.Time.After(time.Now()) {
		retryAfter := time.Until(lockedUntil.Time)
		if retryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
		}
		respondErrorWithRetryAt(c, http.StatusTooManyRequests, "account_locked", "Account is temporarily locked", lockedUntil.Time)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(input.Password)); err != nil {
		attempts := failedAttempts + 1
		var newLockedUntil sql.NullTime
		if s.Config.LoginMaxAttempts > 0 && attempts >= s.Config.LoginMaxAttempts {
			lockTime := time.Now().Add(s.Config.LoginLockoutDuration)
			newLockedUntil = sql.NullTime{Time: lockTime, Valid: true}
			if retryAfter := time.Until(lockTime); retryAfter > 0 {
				c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
			}
			_, _ = s.DB.Exec(`UPDATE admin_users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`, attempts, newLockedUntil, admin.ID)
			respondErrorWithRetryAt(c, http.StatusTooManyRequests, "account_locked", "Account is temporarily locked", lockTime)
			return
		}

		_, _ = s.DB.Exec(`UPDATE admin_users SET failed_login_attempts = ?, locked_until = NULL WHERE id = ?`, attempts, admin.ID)
		if s.Config.LoginWarnAttempts > 0 && attempts >= s.Config.LoginWarnAttempts {
			respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials. Too many failed attempts may temporarily lock your account.")
			return
		}
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
		return
	}

	if _, err := s.DB.Exec(`UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?`, time.Now(), admin.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update admin login state")
		return
	}

	token, err := s.signToken(admin.ID, "admin", s.Config.AdminTokenTTL)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue token")
		return
	}
	s.setAdminCookie(c, token)

	respondOK(c, gin.H{"token": token, "admin": admin})
}

func (s *Server) AdminMe(c *gin.Context) {
	adminID := c.MustGet("user_id").(int)
	row := s.DB.QueryRow(`SELECT id, email, name, role FROM admin_users WHERE id = ?`, adminID)
	var admin AdminProfile
	if err := row.Scan(&admin.ID, &admin.Email, &admin.Name, &admin.Role); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load admin")
		return
	}

	respondOK(c, admin)
}

func (s *Server) AdminLogout(c *gin.Context) {
	s.clearAdminCookie(c)
	respondOK(c, gin.H{"logged_out": true})
}
