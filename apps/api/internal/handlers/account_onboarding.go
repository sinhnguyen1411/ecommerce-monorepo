package handlers

import (
	"database/sql"
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/auth"
)

type CompleteOnboardingInput struct {
	FullName        string `json:"full_name"`
	Phone           string `json:"phone"`
	Birthdate       string `json:"birthdate"`
	AddressLine     string `json:"address_line"`
	Province        string `json:"province"`
	District        string `json:"district"`
	Password        string `json:"password"`
	PasswordConfirm string `json:"password_confirm"`
}

func (s *Server) CompleteOnboarding(c *gin.Context) {
	userID := c.MustGet("user_id").(int)

	var input CompleteOnboardingInput
	if !s.bindJSONWithLimit(c, &input, "Invalid onboarding payload") {
		return
	}

	fullName := strings.TrimSpace(input.FullName)
	phoneRaw := strings.TrimSpace(input.Phone)
	birthdateRaw := strings.TrimSpace(input.Birthdate)
	addressLine := strings.TrimSpace(input.AddressLine)
	provinceInput := strings.TrimSpace(input.Province)
	districtInput := strings.TrimSpace(input.District)

	if fullName == "" || phoneRaw == "" || birthdateRaw == "" || addressLine == "" || provinceInput == "" || districtInput == "" || input.Password == "" || input.PasswordConfirm == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "All onboarding fields are required")
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

	birthdate, err := time.Parse("2006-01-02", birthdateRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_birthdate", "Birthdate must be YYYY-MM-DD")
		return
	}

	if !isAtLeastAge(birthdate, 13) {
		respondError(c, http.StatusBadRequest, "underage", "User must be at least 13 years old")
		return
	}

	phoneE164, phoneNational, err := auth.NormalizeVNPhone(phoneRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
		return
	}

	provinceName, districtName, err := s.resolveProvinceDistrict(provinceInput, districtInput)
	if err != nil || provinceName == "" || districtName == "" {
		respondError(c, http.StatusBadRequest, "invalid_location", "Invalid province or district")
		return
	}

	passwordHash, err := auth.HashPassword(input.Password, auth.DefaultPasswordParams)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "hash_error", "Failed to secure password")
		return
	}

	user, err := s.loadUserByID(userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}

	fullAddress := strings.Join([]string{addressLine, districtName, provinceName}, ", ")
	completedAt := time.Now()
	if user.OnboardingCompleted.Valid {
		completedAt = user.OnboardingCompleted.Time
	}

	tx, err := s.DB.Begin()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to complete onboarding")
		return
	}
	defer tx.Rollback()

	if _, err := tx.Exec(`
    UPDATE users
    SET full_name = ?, phone_e164 = ?, phone_national = ?, birthdate = ?, address = ?, password_hash = ?, onboarding_completed_at = ?
    WHERE id = ?
  `, fullName, phoneE164, phoneNational, birthdate, fullAddress, passwordHash, completedAt, userID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
		return
	}

	var defaultAddressID int
	err = tx.QueryRow(`
    SELECT id
    FROM user_addresses
    WHERE user_id = ? AND is_default = TRUE
    ORDER BY created_at DESC
    LIMIT 1
    FOR UPDATE
  `, userID).Scan(&defaultAddressID)

	switch {
	case err == nil:
		if _, err := tx.Exec(`
      UPDATE user_addresses
      SET full_name = ?, phone = ?, address_line = ?, province = ?, district = ?, is_default = TRUE
      WHERE id = ? AND user_id = ?
    `, fullName, phoneNational, addressLine, provinceName, districtName, defaultAddressID, userID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update default address")
			return
		}
		if _, err := tx.Exec(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ? AND id <> ?`, userID, defaultAddressID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to normalize default address")
			return
		}
	case errors.Is(err, sql.ErrNoRows):
		if _, err := tx.Exec(`UPDATE user_addresses SET is_default = FALSE WHERE user_id = ?`, userID); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to normalize default address")
			return
		}
		if _, err := tx.Exec(`
      INSERT INTO user_addresses (user_id, full_name, phone, address_line, province, district, is_default)
      VALUES (?, ?, ?, ?, ?, ?, TRUE)
    `, userID, fullName, phoneNational, addressLine, provinceName, districtName); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to create default address")
			return
		}
	default:
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load default address")
		return
	}

	if err := tx.Commit(); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to finalize onboarding")
		return
	}

	s.logAudit(c, &userID, "onboarding_completed", nil)
	s.GetProfile(c)
}
