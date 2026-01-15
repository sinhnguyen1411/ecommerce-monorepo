package auth

import (
	"errors"
	"strings"
	"unicode"
)

var (
	ErrInvalidPhone = errors.New("invalid phone")
)

var vnMobilePrefixes = map[string]struct{}{
	"32": {}, "33": {}, "34": {}, "35": {}, "36": {}, "37": {}, "38": {}, "39": {},
	"52": {}, "56": {}, "58": {}, "59": {},
	"70": {}, "76": {}, "77": {}, "78": {}, "79": {},
	"81": {}, "82": {}, "83": {}, "84": {}, "85": {}, "86": {}, "87": {}, "88": {}, "89": {},
	"90": {}, "91": {}, "92": {}, "93": {}, "94": {},
	"96": {}, "97": {}, "98": {}, "99": {},
}

func NormalizeVNPhone(input string) (string, string, error) {
	digits := digitsOnly(input)
	if digits == "" {
		return "", "", ErrInvalidPhone
	}

	var national string
	switch {
	case strings.HasPrefix(digits, "84") && len(digits) == 11:
		national = digits[2:]
	case strings.HasPrefix(digits, "0") && len(digits) == 10:
		national = digits[1:]
	default:
		return "", "", ErrInvalidPhone
	}

	if len(national) != 9 {
		return "", "", ErrInvalidPhone
	}

	prefix := national[:2]
	if _, ok := vnMobilePrefixes[prefix]; !ok {
		return "", "", ErrInvalidPhone
	}

	return "+84" + national, "0" + national, nil
}

func digitsOnly(input string) string {
	var b strings.Builder
	for _, r := range input {
		if unicode.IsDigit(r) {
			b.WriteRune(r)
		}
	}
	return b.String()
}
