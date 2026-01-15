package auth

import "testing"

func TestNormalizeEmail(t *testing.T) {
	tests := []struct {
		input   string
		want    string
		wantErr bool
	}{
		{"User@Example.com", "user@example.com", false},
		{" test@example.com ", "test@example.com", false},
		{"invalid@", "", true},
		{"@example.com", "", true},
		{"no-at-sign", "", true},
	}

	for _, tt := range tests {
		got, err := NormalizeEmail(tt.input)
		if tt.wantErr && err == nil {
			t.Fatalf("expected error for %q", tt.input)
		}
		if !tt.wantErr && (err != nil || got != tt.want) {
			t.Fatalf("expected %q got %q err=%v", tt.want, got, err)
		}
	}
}
