package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
)

type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

func (s *Server) GoogleLogin(c *gin.Context) {
	if s.Config.GoogleClientID == "" || s.Config.GoogleClientSecret == "" {
		respondError(c, http.StatusBadRequest, "oauth_not_configured", "Google OAuth is not configured")
		return
	}

	redirect := c.Query("redirect")
	if redirect == "" {
		redirect = s.Config.FrontendBaseURL + "/account"
	}

	state := fmt.Sprintf("%d", time.Now().UnixNano())
	c.SetCookie("oauth_state", state, 3600, "/", "", false, true)
	c.SetCookie("oauth_redirect", url.QueryEscape(redirect), 3600, "/", "", false, true)

	authURL := s.googleOAuthConfig().AuthCodeURL(state, oauth2.AccessTypeOffline)
	c.Redirect(http.StatusFound, authURL)
}

func (s *Server) GoogleCallback(c *gin.Context) {
	expectedState, _ := c.Cookie("oauth_state")
	state := c.Query("state")
	if expectedState == "" || state == "" || expectedState != state {
		respondError(c, http.StatusBadRequest, "invalid_state", "Invalid OAuth state")
		return
	}

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

	userID, err := s.upsertGoogleUser(userInfo)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to save user profile")
		return
	}

	jwtToken, err := s.signToken(userID, "user", s.Config.UserTokenTTL)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue token")
		return
	}

	redirect := s.Config.FrontendBaseURL + "/account"
	rawRedirect, _ := c.Cookie("oauth_redirect")
	if rawRedirect != "" {
		if decoded, err := url.QueryUnescape(rawRedirect); err == nil {
			redirect = decoded
		}
	}

	finalURL := redirect
	separator := "?"
	if strings.Contains(redirect, "?") {
		separator = "&"
	}
	finalURL = fmt.Sprintf("%s%stoken=%s", redirect, separator, url.QueryEscape(jwtToken))
	c.Redirect(http.StatusFound, finalURL)
}

func (s *Server) GetAuthMe(c *gin.Context) {
	claims := c.MustGet("user_id").(int)
	row := s.DB.QueryRow(`SELECT id, email, name, avatar_url, phone FROM users WHERE id = ?`, claims)
	var profile UserProfile
	if err := row.Scan(&profile.ID, &profile.Email, &profile.Name, &profile.AvatarURL, &profile.Phone); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load profile")
		return
	}

	respondOK(c, profile)
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

func (s *Server) upsertGoogleUser(info GoogleUserInfo) (int, error) {
	var userID int
	row := s.DB.QueryRow(`SELECT id FROM users WHERE google_id = ? OR email = ? LIMIT 1`, info.ID, info.Email)
	err := row.Scan(&userID)
	if err == nil {
		_, err = s.DB.Exec(`UPDATE users SET google_id = ?, email = ?, name = ?, avatar_url = ? WHERE id = ?`, info.ID, info.Email, info.Name, info.Picture, userID)
		return userID, err
	}

	result, err := s.DB.Exec(`INSERT INTO users (google_id, email, name, avatar_url) VALUES (?, ?, ?, ?)`, info.ID, info.Email, info.Name, info.Picture)
	if err != nil {
		return 0, err
	}

	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}

	return int(id), nil
}
