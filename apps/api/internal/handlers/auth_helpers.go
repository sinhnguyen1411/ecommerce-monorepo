package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type userAuthRecord struct {
	ID                  int
	Email               sql.NullString
	PhoneE164           sql.NullString
	PhoneNational       sql.NullString
	FullName            sql.NullString
	AvatarURL           sql.NullString
	Address             sql.NullString
	Birthdate           sql.NullTime
	IsEmailVerified     bool
	IsPhoneVerified     bool
	Status              string
	PasswordHash        sql.NullString
	FailedLoginAttempts int
	LockedUntil         sql.NullTime
}

type AuthUserResponse struct {
	ID                      int     `json:"id"`
	Email                   *string `json:"email,omitempty"`
	Phone                   *string `json:"phone,omitempty"`
	FullName                *string `json:"full_name,omitempty"`
	AvatarURL               *string `json:"avatar_url,omitempty"`
	Address                 *string `json:"address,omitempty"`
	Birthdate               *string `json:"birthdate,omitempty"`
	IsEmailVerified         bool    `json:"is_email_verified"`
	IsPhoneVerified         bool    `json:"is_phone_verified"`
	EmailVerificationStatus string  `json:"emailVerificationStatus"`
	Status                  string  `json:"status"`
}

func (s *Server) loadUserByID(userID int) (*userAuthRecord, error) {
	row := s.DB.QueryRow(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until
    FROM users
    WHERE id = ?
  `, userID)
	return scanUserAuthRecord(row)
}

func (s *Server) loadUserByEmail(email string) (*userAuthRecord, error) {
	row := s.DB.QueryRow(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until
    FROM users
    WHERE email = ?
    LIMIT 1
  `, email)
	return scanUserAuthRecord(row)
}

func (s *Server) loadUserByPhone(phoneE164 string) (*userAuthRecord, error) {
	row := s.DB.QueryRow(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until
    FROM users
    WHERE phone_e164 = ?
    LIMIT 1
  `, phoneE164)
	return scanUserAuthRecord(row)
}

func scanUserAuthRecord(row *sql.Row) (*userAuthRecord, error) {
	var user userAuthRecord
	if err := row.Scan(
		&user.ID,
		&user.Email,
		&user.PhoneE164,
		&user.PhoneNational,
		&user.FullName,
		&user.AvatarURL,
		&user.Address,
		&user.Birthdate,
		&user.IsEmailVerified,
		&user.IsPhoneVerified,
		&user.Status,
		&user.PasswordHash,
		&user.FailedLoginAttempts,
		&user.LockedUntil,
	); err != nil {
		return nil, err
	}
	return &user, nil
}

func authUserResponse(user *userAuthRecord) AuthUserResponse {
	return AuthUserResponse{
		ID:                      user.ID,
		Email:                   nullStringPtr(user.Email),
		Phone:                   preferredPhone(user),
		FullName:                nullStringPtr(user.FullName),
		AvatarURL:               nullStringPtr(user.AvatarURL),
		Address:                 nullStringPtr(user.Address),
		Birthdate:               datePtr(user.Birthdate),
		IsEmailVerified:         user.IsEmailVerified,
		IsPhoneVerified:         user.IsPhoneVerified,
		EmailVerificationStatus: emailVerificationStatus(user.IsEmailVerified),
		Status:                  user.Status,
	}
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func preferredPhone(user *userAuthRecord) *string {
	if user.PhoneNational.Valid {
		return &user.PhoneNational.String
	}
	if user.PhoneE164.Valid {
		return &user.PhoneE164.String
	}
	return nil
}

func datePtr(value sql.NullTime) *string {
	if !value.Valid {
		return nil
	}
	formatted := value.Time.Format("2006-01-02")
	return &formatted
}

func emailVerificationStatus(verified bool) string {
	if verified {
		return "VERIFIED"
	}
	return "UNVERIFIED"
}

func (s *Server) ensureUserCanLogin(c *gin.Context, user *userAuthRecord) bool {
	if user.Status != "active" {
		respondError(c, http.StatusForbidden, "account_locked", "Account is not active")
		return false
	}
	if user.LockedUntil.Valid && user.LockedUntil.Time.After(time.Now()) {
		retryAfter := time.Until(user.LockedUntil.Time)
		if retryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
		}
		respondErrorWithRetryAt(c, http.StatusTooManyRequests, "account_locked", "Account is temporarily locked", user.LockedUntil.Time)
		return false
	}
	return true
}

func (s *Server) markLoginSuccess(userID int) error {
	_, err := s.DB.Exec(`UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?`, time.Now(), userID)
	return err
}

func (s *Server) upsertOAuthUser(email, fullName, avatarURL, googleID string) (*userAuthRecord, error) {
	user, err := s.loadUserByEmail(email)
	if err != nil {
		if !errors.Is(err, sql.ErrNoRows) {
			return nil, err
		}

		result, err := s.DB.Exec(`
      INSERT INTO users (email, full_name, avatar_url, is_email_verified, status, google_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `, email, nullIfEmpty(fullName), nullIfEmpty(avatarURL), true, "active", nullIfEmpty(googleID))
		if err != nil {
			return nil, err
		}
		id, err := result.LastInsertId()
		if err != nil {
			return nil, err
		}
		return s.loadUserByID(int(id))
	}

	updates := []string{}
	args := []any{}
	if !user.IsEmailVerified {
		updates = append(updates, "is_email_verified = ?")
		args = append(args, true)
	}
	if fullName != "" && (!user.FullName.Valid || strings.TrimSpace(user.FullName.String) == "") {
		updates = append(updates, "full_name = ?")
		args = append(args, fullName)
	}
	if avatarURL != "" && (!user.AvatarURL.Valid || strings.TrimSpace(user.AvatarURL.String) == "") {
		updates = append(updates, "avatar_url = ?")
		args = append(args, avatarURL)
	}
	if googleID != "" {
		updates = append(updates, "google_id = ?")
		args = append(args, googleID)
	}
	if len(updates) > 0 {
		args = append(args, user.ID)
		query := "UPDATE users SET " + strings.Join(updates, ", ") + " WHERE id = ?"
		if _, err := s.DB.Exec(query, args...); err != nil {
			return nil, err
		}
	}
	return s.loadUserByID(user.ID)
}
