package auth

import "testing"

func TestValidatePassword(t *testing.T) {
	tests := []struct {
		name     string
		password string
		wantErr  bool
	}{
		{name: "valid basic", password: "Abcdefg1", wantErr: false},
		{name: "valid with special", password: "Password9!", wantErr: false},
		{name: "missing uppercase", password: "password9", wantErr: true},
		{name: "missing digit", password: "Password", wantErr: true},
		{name: "too short", password: "Abc123", wantErr: true},
		{name: "too long", password: "Abcdefghijklmnopqrstu1", wantErr: true},
		{name: "whitespace only", password: "        ", wantErr: true},
	}

	for _, testCase := range tests {
		t.Run(testCase.name, func(t *testing.T) {
			err := ValidatePassword(testCase.password, 8)
			if testCase.wantErr && err == nil {
				t.Fatalf("expected error for %q", testCase.password)
			}
			if !testCase.wantErr && err != nil {
				t.Fatalf("unexpected error for %q: %v", testCase.password, err)
			}
		})
	}
}
