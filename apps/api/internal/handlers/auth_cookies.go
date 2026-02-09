package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

const (
	accessTokenCookie  = "ttc_access_token"
	refreshTokenCookie = "ttc_refresh_token"
	adminTokenCookie   = "ttc_admin_token"
)

func (s *Server) cookieSecure() bool {
	if strings.HasPrefix(s.Config.PublicBaseURL, "https://") {
		return true
	}
	if strings.HasPrefix(s.Config.FrontendBaseURL, "https://") {
		return true
	}
	return strings.EqualFold(s.Config.AppEnv, "production")
}

func (s *Server) cookieSameSite() http.SameSite {
	if s.Config.CORSAllowCredentials && s.cookieSecure() {
		return http.SameSiteNoneMode
	}
	return http.SameSiteLaxMode
}

func (s *Server) setCookie(c *gin.Context, name, value string, maxAge int) {
	c.SetSameSite(s.cookieSameSite())
	c.SetCookie(name, value, maxAge, "/", "", s.cookieSecure(), true)
}

func (s *Server) clearCookie(c *gin.Context, name string) {
	s.setCookie(c, name, "", -1)
}

func (s *Server) setAuthCookies(c *gin.Context, accessToken, refreshToken string) {
	s.setCookie(c, accessTokenCookie, accessToken, int(s.Config.UserTokenTTL.Seconds()))
	s.setCookie(c, refreshTokenCookie, refreshToken, int(s.Config.RefreshTokenTTL.Seconds()))
}

func (s *Server) clearAuthCookies(c *gin.Context) {
	s.clearCookie(c, accessTokenCookie)
	s.clearCookie(c, refreshTokenCookie)
}

func (s *Server) setAdminCookie(c *gin.Context, token string) {
	s.setCookie(c, adminTokenCookie, token, int(s.Config.AdminTokenTTL.Seconds()))
}

func (s *Server) clearAdminCookie(c *gin.Context) {
	s.clearCookie(c, adminTokenCookie)
}

func getCookie(c *gin.Context, name string) string {
	value, err := c.Cookie(name)
	if err != nil {
		return ""
	}
	return strings.TrimSpace(value)
}
