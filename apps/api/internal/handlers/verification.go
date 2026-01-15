package handlers

import (
	"errors"
	"time"

	"github.com/golang-jwt/jwt/v5"
)

type VerificationClaims struct {
	OTPID       int    `json:"otp_id"`
	Purpose     string `json:"purpose"`
	Channel     string `json:"channel"`
	Destination string `json:"destination"`
	jwt.RegisteredClaims
}

func (s *Server) signVerificationToken(otpID int, purpose, channel, destination string) (string, error) {
	now := time.Now()
	claims := VerificationClaims{
		OTPID:       otpID,
		Purpose:     purpose,
		Channel:     channel,
		Destination: destination,
		RegisteredClaims: jwt.RegisteredClaims{
			Subject:   "verification",
			IssuedAt:  jwt.NewNumericDate(now),
			ExpiresAt: jwt.NewNumericDate(now.Add(s.Config.VerificationTokenTTL)),
		},
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(s.Config.OTPSecret))
}

func (s *Server) parseVerificationToken(tokenString string) (*VerificationClaims, error) {
	parsed, err := jwt.ParseWithClaims(tokenString, &VerificationClaims{}, func(token *jwt.Token) (any, error) {
		if token.Method.Alg() != jwt.SigningMethodHS256.Alg() {
			return nil, errors.New("invalid signing method")
		}
		return []byte(s.Config.OTPSecret), nil
	})
	if err != nil {
		return nil, err
	}
	claims, ok := parsed.Claims.(*VerificationClaims)
	if !ok || !parsed.Valid {
		return nil, errors.New("invalid token")
	}
	return claims, nil
}
