package handlers

import (
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/http"
	"net/url"
	"strings"
	"time"

	"crypto/rand"

	"github.com/gin-gonic/gin"

	"ecommerce-monorepo/apps/api/internal/auth"
)

const (
	googleAuthURL      = "https://accounts.google.com/o/oauth2/v2/auth"
	googleTokenURL     = "https://oauth2.googleapis.com/token"
	googleTokenInfoURL = "https://oauth2.googleapis.com/tokeninfo"

	googleStateCookie    = "ttc_google_state"
	googleRedirectCookie = "ttc_google_redirect"
)

type googleTokenResponse struct {
	AccessToken string `json:"access_token"`
	IDToken     string `json:"id_token"`
	ExpiresIn   int    `json:"expires_in"`
	TokenType   string `json:"token_type"`
}

type googleTokenInfo struct {
	Sub           string `json:"sub"`
	Email         string `json:"email"`
	EmailVerified string `json:"email_verified"`
	Name          string `json:"name"`
	Picture       string `json:"picture"`
	Aud           string `json:"aud"`
}

func (s *Server) GoogleStart(c *gin.Context) {
	if s.Config.GoogleClientID == "" || s.Config.GoogleRedirectURL == "" {
		respondError(c, http.StatusBadRequest, "google_not_configured", "Google login is not configured")
		return
	}

	state, err := randomState(24)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "state_error", "Failed to initialize login")
		return
	}

	redirectPath := normalizeFrontendRedirect(c.Query("redirect"))
	s.setCookie(c, googleStateCookie, state, int((5 * time.Minute).Seconds()))
	s.setCookie(c, googleRedirectCookie, redirectPath, int((5 * time.Minute).Seconds()))

	q := url.Values{}
	q.Set("client_id", s.Config.GoogleClientID)
	q.Set("redirect_uri", s.Config.GoogleRedirectURL)
	q.Set("response_type", "code")
	q.Set("scope", "openid email profile")
	q.Set("prompt", "select_account")
	q.Set("state", state)

	c.Redirect(http.StatusFound, googleAuthURL+"?"+q.Encode())
}

func (s *Server) GoogleCallback(c *gin.Context) {
	if s.Config.GoogleClientID == "" || s.Config.GoogleClientSecret == "" || s.Config.GoogleRedirectURL == "" {
		respondError(c, http.StatusBadRequest, "google_not_configured", "Google login is not configured")
		return
	}

	state := strings.TrimSpace(c.Query("state"))
	code := strings.TrimSpace(c.Query("code"))
	if state == "" || code == "" {
		respondError(c, http.StatusBadRequest, "invalid_request", "Missing Google callback parameters")
		return
	}

	expected := getCookie(c, googleStateCookie)
	if expected == "" || expected != state {
		respondError(c, http.StatusBadRequest, "invalid_state", "Invalid login state")
		return
	}
	s.clearCookie(c, googleStateCookie)

	redirectPath := getCookie(c, googleRedirectCookie)
	if redirectPath == "" {
		redirectPath = "/account"
	}
	s.clearCookie(c, googleRedirectCookie)

	tokenResp, err := s.exchangeGoogleCode(code)
	if err != nil {
		respondError(c, http.StatusBadRequest, "google_exchange_failed", "Failed to authenticate with Google")
		return
	}

	info, err := s.verifyGoogleToken(tokenResp.IDToken)
	if err != nil {
		respondError(c, http.StatusBadRequest, "google_token_invalid", "Failed to verify Google token")
		return
	}

	if info.Aud != s.Config.GoogleClientID {
		respondError(c, http.StatusBadRequest, "google_token_invalid", "Invalid Google token audience")
		return
	}

	if strings.ToLower(info.EmailVerified) != "true" {
		respondError(c, http.StatusBadRequest, "email_unverified", "Google email is not verified")
		return
	}

	email, err := auth.RequireGmailEmail(info.Email)
	if err != nil {
		respondError(c, http.StatusBadRequest, "gmail_only", "Please use a Gmail account")
		return
	}

	user, err := s.upsertOAuthUser(email, strings.TrimSpace(info.Name), strings.TrimSpace(info.Picture), info.Sub)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to finalize login")
		return
	}

	if !s.ensureUserCanLogin(c, user) {
		return
	}

	if err := s.markLoginSuccess(user.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update login state")
		return
	}

	accessToken, refreshToken, err := s.issueTokens(c, user.ID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue tokens")
		return
	}
	s.setAuthCookies(c, accessToken, refreshToken)

	s.logAudit(c, &user.ID, "login_success", map[string]any{
		"provider": "google",
	})

	c.Redirect(http.StatusFound, s.Config.FrontendBaseURL+redirectPath)
}

func (s *Server) exchangeGoogleCode(code string) (*googleTokenResponse, error) {
	form := url.Values{}
	form.Set("code", code)
	form.Set("client_id", s.Config.GoogleClientID)
	form.Set("client_secret", s.Config.GoogleClientSecret)
	form.Set("redirect_uri", s.Config.GoogleRedirectURL)
	form.Set("grant_type", "authorization_code")

	resp, err := http.PostForm(googleTokenURL, form)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("token exchange failed")
	}

	var payload googleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}
	if payload.IDToken == "" {
		return nil, errors.New("missing id_token")
	}
	return &payload, nil
}

func (s *Server) verifyGoogleToken(idToken string) (*googleTokenInfo, error) {
	req, err := http.NewRequest(http.MethodGet, googleTokenInfoURL, nil)
	if err != nil {
		return nil, err
	}
	q := req.URL.Query()
	q.Set("id_token", idToken)
	req.URL.RawQuery = q.Encode()

	client := http.Client{Timeout: 10 * time.Second}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("tokeninfo failed")
	}

	var info googleTokenInfo
	if err := json.NewDecoder(resp.Body).Decode(&info); err != nil {
		return nil, err
	}
	if info.Email == "" || info.Sub == "" {
		return nil, errors.New("invalid token info")
	}
	return &info, nil
}

func randomState(length int) (string, error) {
	buf := make([]byte, length)
	if _, err := rand.Read(buf); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(buf), nil
}

func normalizeFrontendRedirect(raw string) string {
	if raw == "" {
		return "/account"
	}
	if strings.HasPrefix(raw, "http://") || strings.HasPrefix(raw, "https://") {
		return "/account"
	}
	if strings.HasPrefix(raw, "/") {
		return raw
	}
	return "/account"
}
