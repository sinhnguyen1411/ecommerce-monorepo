package handlers

import (
	"context"
	"crypto/rand"
	"database/sql"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"

	"ecommerce-monorepo/apps/api/internal/auth"
)

type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

type OAuthStartInput struct {
	Redirect string `json:"redirect"`
}

func (s *Server) GoogleStart(c *gin.Context) {
	if !s.isGoogleConfigured() {
		respondError(c, http.StatusBadRequest, "oauth_not_configured", "Google OAuth is not configured")
		return
	}

	var input OAuthStartInput
	_ = c.ShouldBindJSON(&input)

	redirect := s.sanitizeRedirect(input.Redirect)
	authURL, err := s.buildGoogleAuthURL(c, redirect)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "oauth_failed", "Failed to start OAuth")
		return
	}

	respondOK(c, gin.H{"url": authURL})
}

func (s *Server) GoogleLogin(c *gin.Context) {
	if !s.isGoogleConfigured() {
		respondError(c, http.StatusBadRequest, "oauth_not_configured", "Google OAuth is not configured")
		return
	}

	redirect := s.sanitizeRedirect(c.Query("redirect"))
	authURL, err := s.buildGoogleAuthURL(c, redirect)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "oauth_failed", "Failed to start OAuth")
		return
	}

	c.Redirect(http.StatusFound, authURL)
}

func (s *Server) GoogleCallback(c *gin.Context) {
	expectedState, _ := c.Cookie("oauth_state")
	state := c.Query("state")
	if expectedState == "" || state == "" || expectedState != state {
		respondError(c, http.StatusBadRequest, "invalid_state", "Invalid OAuth state")
		return
	}
	secure := isProdEnv(s.Config.AppEnv)
	c.SetCookie("oauth_state", "", -1, "/", "", secure, true)
	c.SetCookie("oauth_redirect", "", -1, "/", "", secure, true)

	code := c.Query("code")
	if code == "" {
		respondError(c, http.StatusBadRequest, "missing_code", "Missing OAuth code")
		return
	}

	token, err := s.googleOAuthConfig().Exchange(context.Background(), code)
	if err != nil {
		respondError(c, http.StatusBadRequest, "oauth_failed", "Failed to exchange OAuth code")
		return
	}

	client := s.googleOAuthConfig().Client(context.Background(), token)
	resp, err := client.Get("https://www.googleapis.com/oauth2/v2/userinfo")
	if err != nil {
		respondError(c, http.StatusBadRequest, "oauth_failed", "Failed to fetch user profile")
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 300 {
		respondError(c, http.StatusBadRequest, "oauth_failed", "Failed to fetch user profile")
		return
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		respondError(c, http.StatusBadRequest, "oauth_failed", "Failed to parse user profile")
		return
	}

	if userInfo.Email == "" {
		respondError(c, http.StatusBadRequest, "oauth_failed", "Google account email is required")
		return
	}

	normalizedEmail, err := auth.NormalizeEmail(userInfo.Email)
	if err != nil {
		respondError(c, http.StatusBadRequest, "oauth_failed", "Invalid Google email")
		return
	}
	userInfo.Email = normalizedEmail

	userID, err := s.upsertGoogleUser(userInfo)
	if err != nil {
		if errors.Is(err, ErrAccountInactive) {
			respondError(c, http.StatusForbidden, "account_locked", "Account is not active")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to save user profile")
		return
	}

	accessToken, refreshToken, err := s.issueTokens(c, userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue token")
		return
	}

	user, err := s.loadUserByID(userID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}

	s.logAudit(c, &userID, "google_login", nil)

	if wantsJSON(c) {
		respondOK(c, gin.H{
			"access_token":  accessToken,
			"refresh_token": refreshToken,
			"user":          authUserResponse(user),
		})
		return
	}

	redirect := s.sanitizeRedirect(s.readRedirectCookie(c))
	finalURL := buildRedirectURL(redirect, accessToken, refreshToken)
	c.Redirect(http.StatusFound, finalURL)
}

func (s *Server) googleOAuthConfig() *oauth2.Config {
	return &oauth2.Config{
		ClientID:     s.Config.GoogleClientID,
		ClientSecret: s.Config.GoogleClientSecret,
		RedirectURL:  s.Config.GoogleRedirectURL,
		Endpoint:     google.Endpoint,
		Scopes:       []string{"https://www.googleapis.com/auth/userinfo.email", "https://www.googleapis.com/auth/userinfo.profile"},
	}
}

var ErrAccountInactive = errors.New("account inactive")

func (s *Server) upsertGoogleUser(info GoogleUserInfo) (int, error) {
	tx, err := s.DB.Begin()
	if err != nil {
		return 0, err
	}
	defer tx.Rollback()

	var userID int
	var status string
	row := tx.QueryRow(`
    SELECT u.id, u.status
    FROM users u
    JOIN auth_identities a ON a.user_id = u.id
    WHERE a.provider = 'google' AND a.provider_user_id = ?
    LIMIT 1
  `, info.ID)
	if err := row.Scan(&userID, &status); err != nil {
		if err != sql.ErrNoRows {
			return 0, err
		}
	} else {
		if status != "active" {
			return 0, ErrAccountInactive
		}
		if _, err := tx.Exec(`UPDATE users SET google_id = ?, email = ?, full_name = ?, avatar_url = ?, is_email_verified = TRUE WHERE id = ?`, info.ID, info.Email, info.Name, info.Picture, userID); err != nil {
			return 0, err
		}
		if err := tx.Commit(); err != nil {
			return 0, err
		}
		return userID, nil
	}

	row = tx.QueryRow(`SELECT id, status FROM users WHERE email = ? LIMIT 1`, info.Email)
	if err := row.Scan(&userID, &status); err != nil {
		if err != sql.ErrNoRows {
			return 0, err
		}
	} else {
		if status != "active" {
			return 0, ErrAccountInactive
		}
		if _, err := tx.Exec(`UPDATE users SET google_id = ?, full_name = ?, avatar_url = ?, is_email_verified = TRUE WHERE id = ?`, info.ID, info.Name, info.Picture, userID); err != nil {
			return 0, err
		}
		if _, err := tx.Exec(`INSERT INTO auth_identities (user_id, provider, provider_user_id) VALUES (?, 'google', ?) ON DUPLICATE KEY UPDATE provider_user_id = VALUES(provider_user_id)`, userID, info.ID); err != nil {
			return 0, err
		}
		if err := tx.Commit(); err != nil {
			return 0, err
		}
		return userID, nil
	}

	result, err := tx.Exec(`INSERT INTO users (google_id, email, full_name, avatar_url, is_email_verified, status) VALUES (?, ?, ?, ?, TRUE, 'active')`, info.ID, info.Email, info.Name, info.Picture)
	if err != nil {
		return 0, err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	userID = int(id)
	if _, err := tx.Exec(`INSERT INTO auth_identities (user_id, provider, provider_user_id) VALUES (?, 'google', ?)`, userID, info.ID); err != nil {
		return 0, err
	}

	if err := tx.Commit(); err != nil {
		return 0, err
	}
	return userID, nil
}

func (s *Server) buildGoogleAuthURL(c *gin.Context, redirect string) (string, error) {
	state, err := generateState()
	if err != nil {
		return "", err
	}

	secure := isProdEnv(s.Config.AppEnv)
	maxAge := int((10 * time.Minute).Seconds())
	c.SetCookie("oauth_state", state, maxAge, "/", "", secure, true)
	c.SetCookie("oauth_redirect", url.QueryEscape(redirect), maxAge, "/", "", secure, true)

	return s.googleOAuthConfig().AuthCodeURL(state, oauth2.AccessTypeOffline), nil
}

func generateState() (string, error) {
	buf := make([]byte, 32)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func (s *Server) sanitizeRedirect(raw string) string {
	defaultRedirect := s.Config.FrontendBaseURL + "/account"
	if raw == "" {
		return defaultRedirect
	}
	if strings.HasPrefix(raw, "/") {
		return s.Config.FrontendBaseURL + raw
	}
	parsed, err := url.Parse(raw)
	if err != nil {
		return defaultRedirect
	}
	base, err := url.Parse(s.Config.FrontendBaseURL)
	if err != nil {
		return defaultRedirect
	}
	if parsed.IsAbs() {
		if !strings.EqualFold(parsed.Host, base.Host) || parsed.Scheme != base.Scheme {
			return defaultRedirect
		}
		return raw
	}
	return defaultRedirect
}

func (s *Server) readRedirectCookie(c *gin.Context) string {
	rawRedirect, _ := c.Cookie("oauth_redirect")
	if rawRedirect == "" {
		return s.Config.FrontendBaseURL + "/account"
	}
	decoded, err := url.QueryUnescape(rawRedirect)
	if err != nil {
		return s.Config.FrontendBaseURL + "/account"
	}
	return decoded
}

func buildRedirectURL(redirect, accessToken, refreshToken string) string {
	parsed, err := url.Parse(redirect)
	if err != nil {
		return redirect
	}
	query := parsed.Query()
	query.Set("token", accessToken)
	parsed.RawQuery = query.Encode()
	if refreshToken != "" {
		parsed.Fragment = "refresh_token=" + url.QueryEscape(refreshToken)
	}
	return parsed.String()
}

func wantsJSON(c *gin.Context) bool {
	if strings.EqualFold(c.Query("response_type"), "json") {
		return true
	}
	accept := c.GetHeader("Accept")
	return strings.Contains(accept, "application/json")
}

func (s *Server) isGoogleConfigured() bool {
	return s.Config.GoogleClientID != "" && s.Config.GoogleClientSecret != ""
}
