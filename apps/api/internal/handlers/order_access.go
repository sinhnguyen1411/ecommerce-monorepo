package handlers

import (
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"database/sql"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

type OrderAccessClaims struct {
	OrderID         int    `json:"order_id"`
	OrderRef        string `json:"order_ref"`
	LookupTokenHash string `json:"lookup_token_hash"`
	jwt.RegisteredClaims
}

type OrderAccessTokenRequest struct {
	OrderRef         string `json:"order_ref"`
	OrderLookupToken string `json:"order_lookup_token"`
}

type OrderAccessTokenResponse struct {
	OrderID              int    `json:"order_id"`
	OrderRef             string `json:"order_ref"`
	OrderAccessToken     string `json:"order_access_token"`
	OrderAccessExpiresAt string `json:"order_access_expires_at"`
}

func generateOrderLookupToken() (string, string, error) {
	raw := make([]byte, 32)
	if _, err := rand.Read(raw); err != nil {
		return "", "", err
	}
	token := base64.RawURLEncoding.EncodeToString(raw)
	return token, hashOrderLookupToken(token), nil
}

func hashOrderLookupToken(token string) string {
	sum := sha256.Sum256([]byte(strings.TrimSpace(token)))
	return hex.EncodeToString(sum[:])
}

func secureEqualStrings(left, right string) bool {
	l := strings.TrimSpace(left)
	r := strings.TrimSpace(right)
	if len(l) != len(r) {
		return false
	}
	return subtle.ConstantTimeCompare([]byte(l), []byte(r)) == 1
}

func (s *Server) signOrderAccessToken(orderID int, orderRef string, lookupTokenHash string) (string, time.Time, error) {
	now := time.Now()
	expiresAt := now.Add(s.Config.OrderAccessTokenTTL)
	claims := OrderAccessClaims{
		OrderID:         orderID,
		OrderRef:        strings.TrimSpace(orderRef),
		LookupTokenHash: strings.TrimSpace(lookupTokenHash),
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "order_access",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(expiresAt),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signed, err := token.SignedString([]byte(s.Config.JWTSecret))
	if err != nil {
		return "", time.Time{}, err
	}
	return signed, expiresAt, nil
}

func (s *Server) parseOrderAccessToken(tokenString string) (*OrderAccessClaims, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &OrderAccessClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("invalid signing method")
		}
		return []byte(s.Config.JWTSecret), nil
	})
	if err != nil {
		return nil, err
	}

	claims, ok := parsed.Claims.(*OrderAccessClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	if claims.Subject != "order_access" {
		return nil, errors.New("invalid subject")
	}
	if claims.OrderID <= 0 || strings.TrimSpace(claims.OrderRef) == "" || strings.TrimSpace(claims.LookupTokenHash) == "" {
		return nil, errors.New("invalid claims")
	}
	return claims, nil
}

func (s *Server) issueOrderAccessToken(orderID int, orderRef, lookupTokenHash string) (*OrderAccessTokenResponse, error) {
	token, expiresAt, err := s.signOrderAccessToken(orderID, orderRef, lookupTokenHash)
	if err != nil {
		return nil, err
	}
	return &OrderAccessTokenResponse{
		OrderID:              orderID,
		OrderRef:             strings.TrimSpace(orderRef),
		OrderAccessToken:     token,
		OrderAccessExpiresAt: expiresAt.UTC().Format(time.RFC3339),
	}, nil
}

func (s *Server) CreateOrderAccessToken(c *gin.Context) {
	var input OrderAccessTokenRequest
	if !s.bindJSONWithLimit(c, &input, "Invalid order access payload") {
		return
	}

	orderRef := strings.TrimSpace(input.OrderRef)
	lookupToken := strings.TrimSpace(input.OrderLookupToken)
	if orderRef == "" || lookupToken == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Order reference and lookup token are required")
		return
	}

	lookupHash := hashOrderLookupToken(lookupToken)
	var (
		orderID     int
		orderNumber string
		storedHash  sql.NullString
	)
	row := s.DB.QueryRow(`SELECT id, order_number, IFNULL(order_lookup_token_hash, '') FROM orders WHERE order_number = ?`, orderRef)
	if err := row.Scan(&orderID, &orderNumber, &storedHash); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Order not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load order")
		return
	}

	if strings.TrimSpace(storedHash.String) == "" || !secureEqualStrings(storedHash.String, lookupHash) {
		respondError(c, http.StatusUnauthorized, "unauthorized", "Invalid order lookup token")
		return
	}

	payload, err := s.issueOrderAccessToken(orderID, orderNumber, storedHash.String)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue order access token")
		return
	}

	if _, err := s.DB.Exec(`UPDATE orders SET order_lookup_token_last_used_at = ? WHERE id = ?`, time.Now(), orderID); err != nil {
		log.Printf("order_lookup_last_used_update_failed order_id=%d err=%v", orderID, err)
	}

	respondOK(c, payload)
}

func (s *Server) enforceOrderAccess(c *gin.Context, orderID int) bool {
	if claims := s.optionalUser(c); claims != nil {
		var exists int
		if err := s.DB.QueryRow(`SELECT 1 FROM orders WHERE id = ? AND user_id = ?`, orderID, claims.UserID).Scan(&exists); err != nil {
			if err == sql.ErrNoRows {
				respondError(c, http.StatusForbidden, "forbidden", "Order is not accessible")
				return false
			}
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to verify order access")
			return false
		}
		c.Set("order_access_mode", "owner")
		c.Set("order_access_order_id", orderID)
		return true
	}

	token := bearerToken(c.GetHeader("Authorization"))
	if token != "" {
		claims, err := s.parseOrderAccessToken(token)
		if err != nil {
			respondError(c, http.StatusUnauthorized, "unauthorized", "Invalid order access token")
			return false
		}
		if claims.OrderID != orderID {
			respondError(c, http.StatusForbidden, "forbidden", "Order token does not match this order")
			return false
		}

		var (
			orderNumber string
			storedHash  sql.NullString
		)
		row := s.DB.QueryRow(`SELECT order_number, IFNULL(order_lookup_token_hash, '') FROM orders WHERE id = ?`, orderID)
		if err := row.Scan(&orderNumber, &storedHash); err != nil {
			if err == sql.ErrNoRows {
				respondError(c, http.StatusNotFound, "not_found", "Order not found")
				return false
			}
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to verify order access")
			return false
		}

		if strings.TrimSpace(storedHash.String) == "" ||
			!secureEqualStrings(storedHash.String, claims.LookupTokenHash) ||
			!secureEqualStrings(orderNumber, claims.OrderRef) {
			respondError(c, http.StatusUnauthorized, "unauthorized", "Order token is no longer valid")
			return false
		}

		if _, err := s.DB.Exec(`UPDATE orders SET order_lookup_token_last_used_at = ? WHERE id = ?`, time.Now(), orderID); err != nil {
			log.Printf("order_lookup_last_used_update_failed order_id=%d err=%v", orderID, err)
		}

		c.Set("order_access_mode", "token")
		c.Set("order_access_order_id", orderID)
		return true
	}

	if s.Config.AllowLegacyOrderIDLookup {
		s.logLegacyOrderAccess(c, orderID)
		c.Set("order_access_mode", "legacy")
		c.Set("order_access_order_id", orderID)
		return true
	}

	respondError(c, http.StatusUnauthorized, "unauthorized", "Missing order access token")
	return false
}

func (s *Server) logLegacyOrderAccess(c *gin.Context, orderID int) {
	log.Printf(
		"legacy_order_lookup_used order_id=%d method=%s path=%s ip=%s",
		orderID,
		c.Request.Method,
		c.FullPath(),
		c.ClientIP(),
	)
}
