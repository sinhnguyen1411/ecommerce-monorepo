package auth

import (
	"errors"
	"strings"
	"unicode"
	"unicode/utf8"
)

var ErrWeakPassword = errors.New("weak password")

const DefaultPasswordMaxLength = 20

func ValidatePassword(password string, minLen int) error {
	if strings.TrimSpace(password) == "" {
		return ErrInvalidPassword
	}

	length := utf8.RuneCountInString(password)
	if minLen > 0 && length < minLen {
		return ErrWeakPassword
	}
	if length > DefaultPasswordMaxLength {
		return ErrWeakPassword
	}

	hasUpper := false
	hasDigit := false
	for _, char := range password {
		if unicode.IsUpper(char) {
			hasUpper = true
		}
		if unicode.IsDigit(char) {
			hasDigit = true
		}
	}

	if !hasUpper || !hasDigit {
		return ErrWeakPassword
	}

	return nil
}
