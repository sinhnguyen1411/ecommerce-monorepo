package auth

import (
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"errors"
	"fmt"
	"math/big"
	"time"
)

var ErrInvalidOTP = errors.New("invalid otp")

func GenerateOTPCode() (string, error) {
	max := big.NewInt(1000000)
	n, err := rand.Int(rand.Reader, max)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("%06d", n.Int64()), nil
}

func HashOTP(code, destination, purpose, secret string) string {
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(purpose))
	mac.Write([]byte("|"))
	mac.Write([]byte(destination))
	mac.Write([]byte("|"))
	mac.Write([]byte(code))
	return hex.EncodeToString(mac.Sum(nil))
}

func VerifyOTP(code, destination, purpose, secret, expectedHash string) bool {
	calculated := HashOTP(code, destination, purpose, secret)
	return subtle.ConstantTimeCompare([]byte(calculated), []byte(expectedHash)) == 1
}

func OTPExpired(expiresAt time.Time) bool {
	return time.Now().After(expiresAt)
}

func OTPAttemptsExceeded(attempts, max int) bool {
	return attempts >= max
}
