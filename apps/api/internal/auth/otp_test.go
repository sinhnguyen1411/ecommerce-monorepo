package auth

import (
	"testing"
	"time"
)

func TestOTPFlow(t *testing.T) {
	code, err := GenerateOTPCode()
	if err != nil {
		t.Fatalf("generate otp failed: %v", err)
	}
	if len(code) != 6 {
		t.Fatalf("expected 6-digit code got %q", code)
	}

	secret := "test-secret"
	destination := "user@example.com"
	purpose := "signup"
	hash := HashOTP(code, destination, purpose, secret)
	if !VerifyOTP(code, destination, purpose, secret, hash) {
		t.Fatalf("expected otp verify to pass")
	}
	if VerifyOTP("000000", destination, purpose, secret, hash) {
		t.Fatalf("expected otp verify to fail")
	}
	if OTPExpired(time.Now().Add(-time.Minute)) != true {
		t.Fatalf("expected expired")
	}
	if OTPExpired(time.Now().Add(time.Minute)) != false {
		t.Fatalf("expected not expired")
	}
	if !OTPAttemptsExceeded(5, 5) {
		t.Fatalf("expected attempts exceeded")
	}
	if OTPAttemptsExceeded(4, 5) {
		t.Fatalf("expected attempts not exceeded")
	}
}
