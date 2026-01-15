package handlers

import (
	"database/sql"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/auth"
)

type MeUpdateInput struct {
	FullName  string `json:"full_name"`
	AvatarURL string `json:"avatar_url"`
	Address   string `json:"address"`
	Birthdate string `json:"birthdate"`
	Phone     string `json:"phone"`
}

func (s *Server) GetMe(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	user, err := s.loadUserByID(userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}

	respondOK(c, authUserResponse(user))
}

func (s *Server) UpdateMe(c *gin.Context) {
	userID := c.MustGet("user_id").(int)
	var input MeUpdateInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid payload")
		return
	}

	if strings.TrimSpace(input.Phone) != "" {
		current := sql.NullString{}
		if err := s.DB.QueryRow(`SELECT phone_e164 FROM users WHERE id = ?`, userID).Scan(&current); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
			return
		}
		normalized, _, err := auth.NormalizeVNPhone(input.Phone)
		if err != nil {
			respondError(c, http.StatusBadRequest, "invalid_phone", "Invalid phone number")
			return
		}
		if !current.Valid || current.String != normalized {
			respondError(c, http.StatusBadRequest, "phone_verification_required", "Use phone verification to update phone number")
			return
		}
	}

	fullName := strings.TrimSpace(input.FullName)
	avatarURL := strings.TrimSpace(input.AvatarURL)
	address := strings.TrimSpace(input.Address)

	var fullNameVal any = nil
	var avatarVal any = nil
	var addressVal any = nil
	var birthdateVal any = nil

	if fullName != "" {
		fullNameVal = fullName
	}
	if avatarURL != "" {
		avatarVal = avatarURL
	}
	if address != "" {
		addressVal = address
	}
	if input.Birthdate != "" {
		parsed, err := time.Parse("2006-01-02", input.Birthdate)
		if err != nil {
			respondError(c, http.StatusBadRequest, "invalid_birthdate", "Birthdate must be YYYY-MM-DD")
			return
		}
		birthdateVal = parsed
	}

	if _, err := s.DB.Exec(`UPDATE users SET full_name = ?, avatar_url = ?, address = ?, birthdate = ? WHERE id = ?`, fullNameVal, avatarVal, addressVal, birthdateVal, userID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update profile")
		return
	}

	s.GetMe(c)
}
