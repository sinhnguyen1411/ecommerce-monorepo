package auth

import "testing"

func TestNormalizeVNPhone(t *testing.T) {
	tests := []struct {
		input  string
		wantE  string
		wantN  string
		wantOk bool
	}{
		{"0912345678", "+84912345678", "0912345678", true},
		{"+84912345678", "+84912345678", "0912345678", true},
		{"84912345678", "+84912345678", "0912345678", true},
		{"001234", "", "", false},
		{"081234", "", "", false},
	}

	for _, tt := range tests {
		gotE, gotN, err := NormalizeVNPhone(tt.input)
		if tt.wantOk && err != nil {
			t.Fatalf("expected ok for %q got err=%v", tt.input, err)
		}
		if !tt.wantOk && err == nil {
			t.Fatalf("expected error for %q", tt.input)
		}
		if tt.wantOk && (gotE != tt.wantE || gotN != tt.wantN) {
			t.Fatalf("expected %q/%q got %q/%q", tt.wantE, tt.wantN, gotE, gotN)
		}
	}
}
