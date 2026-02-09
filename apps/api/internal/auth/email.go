package auth

import (
	"errors"
	"net/mail"
	"regexp"
	"strings"
)

var (
	emailRegex      = regexp.MustCompile(`^[a-z0-9.!#$%&'*+/=?^_` + "`" + `{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9-]+)+$`)
	ErrInvalidEmail = errors.New("invalid email")
	ErrEmptyEmail   = errors.New("empty email")
	maxEmailLength  = 254
)

func NormalizeEmail(input string) (string, error) {
	trimmed := strings.TrimSpace(input)
	if trimmed == "" {
		return "", ErrEmptyEmail
	}

	normalized := strings.ToLower(trimmed)
	if len(normalized) > maxEmailLength {
		return "", ErrInvalidEmail
	}

	if strings.Contains(normalized, " ") {
		return "", ErrInvalidEmail
	}

	addr, err := mail.ParseAddress(normalized)
	if err != nil || addr.Address != normalized {
		return "", ErrInvalidEmail
	}

	if !emailRegex.MatchString(normalized) {
		return "", ErrInvalidEmail
	}

	parts := strings.SplitN(normalized, "@", 2)
	if len(parts) != 2 {
		return "", ErrInvalidEmail
	}
	if isGmailDomain(parts[1]) {
		if !validGmailLocal(parts[0]) {
			return "", ErrInvalidEmail
		}
	}

	return normalized, nil
}

func isGmailDomain(domain string) bool {
	domain = strings.ToLower(domain)
	return domain == "gmail.com" || domain == "googlemail.com"
}

func validGmailLocal(local string) bool {
	if local == "" || len(local) > 64 {
		return false
	}
	if strings.HasPrefix(local, ".") || strings.HasSuffix(local, ".") {
		return false
	}
	if strings.Contains(local, "..") {
		return false
	}
	if strings.Contains(local, " ") {
		return false
	}
	return true
}
