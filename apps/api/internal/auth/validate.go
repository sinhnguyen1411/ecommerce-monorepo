package auth

import (
	"errors"
	"strings"
)

var ErrWeakPassword = errors.New("weak password")

func ValidatePassword(password string, minLen int) error {
	if strings.TrimSpace(password) == "" {
		return ErrInvalidPassword
	}
	if minLen <= 0 {
		return nil
	}
	if len(password) < minLen {
		return ErrWeakPassword
	}
	return nil
}
