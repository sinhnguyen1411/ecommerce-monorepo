package auth

import "testing"

func TestRefreshTokenRotation(t *testing.T) {
	token1, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("generate token1 failed: %v", err)
	}
	token2, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("generate token2 failed: %v", err)
	}
	if token1 == token2 {
		t.Fatalf("expected different tokens")
	}
	hash1 := HashToken(token1)
	hash2 := HashToken(token2)
	if hash1 == hash2 {
		t.Fatalf("expected different token hashes")
	}
	if hash1 != HashToken(token1) {
		t.Fatalf("expected stable hash")
	}
}
