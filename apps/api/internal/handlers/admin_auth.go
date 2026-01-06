package handlers

import (
	"database/sql"
	"net/http"
	"strings"

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
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid login payload")
		return
	}

	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || input.Password == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Email and password are required")
		return
	}

	var admin AdminProfile
	var hash string
	row := s.DB.QueryRow(`SELECT id, email, name, role, password_hash FROM admin_users WHERE email = ?`, email)
	if err := row.Scan(&admin.ID, &admin.Email, &admin.Name, &admin.Role, &hash); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load admin")
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(input.Password)); err != nil {
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
		return
	}

	token, err := s.signToken(admin.ID, "admin", s.Config.AdminTokenTTL)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue token")
		return
	}

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
