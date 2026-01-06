package handlers

import (
	"errors"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type JWTClaims struct {
	UserID int    `json:"user_id"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

func (s *Server) signToken(userID int, role string, ttl time.Duration) (string, error) {
	now := time.Now()
	claims := JWTClaims{
		UserID: userID,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "user",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(ttl)),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.Config.JWTSecret))
}

func (s *Server) parseToken(tokenString string) (*JWTClaims, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("invalid signing method")
		}
		return []byte(s.Config.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsed.Claims.(*JWTClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}

func (s *Server) requireRole(role string) gin.HandlerFunc {
	return func(c *gin.Context) {
		token := bearerToken(c.GetHeader("Authorization"))
		if token == "" {
			respondError(c, http.StatusUnauthorized, "unauthorized", "Missing token")
			c.Abort()
			return
		}

		claims, err := s.parseToken(token)
		if err != nil {
			respondError(c, http.StatusUnauthorized, "unauthorized", "Invalid token")
			c.Abort()
			return
		}

		if role != "" && claims.Role != role {
			respondError(c, http.StatusForbidden, "forbidden", "Insufficient permissions")
			c.Abort()
			return
		}

		c.Set("user_id", claims.UserID)
		c.Set("role", claims.Role)
		c.Next()
	}
}

func (s *Server) optionalUser(c *gin.Context) *JWTClaims {
	token := bearerToken(c.GetHeader("Authorization"))
	if token == "" {
		return nil
	}
	claims, err := s.parseToken(token)
	if err != nil {
		return nil
	}
	if claims.Role != "user" {
		return nil
	}
	return claims
}

func bearerToken(header string) string {
	if header == "" {
		return ""
	}
	parts := strings.SplitN(header, " ", 2)
	if len(parts) != 2 {
		return ""
	}
	if strings.ToLower(parts[0]) != "bearer" {
		return ""
	}
	return strings.TrimSpace(parts[1])
}
