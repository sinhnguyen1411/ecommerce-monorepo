package migrations

import "testing"

func TestValidateMigrationSQL(t *testing.T) {
	tests := []struct {
		name    string
		content []byte
		wantErr bool
	}{
		{
			name:    "valid utf8 sql",
			content: []byte("SET NAMES utf8mb4;\nUPDATE categories SET name = 'Thuốc bảo vệ thực vật' WHERE id = 1;\n"),
			wantErr: false,
		},
		{
			name:    "invalid utf8",
			content: []byte{0xff, 0xfe, 0xfd},
			wantErr: true,
		},
		{
			name:    "control character",
			content: []byte("SELECT 1;\x01\n"),
			wantErr: true,
		},
		{
			name:    "mojibake marker",
			content: []byte("UPDATE posts SET title = 'Ghi ch\u00E9p m\u00F9a v\u1EE5 " + "\u00C3" + "';\n"),
			wantErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			err := validateMigrationSQL(test.content, "test.sql")
			if test.wantErr && err == nil {
				t.Fatalf("expected error, got nil")
			}
			if !test.wantErr && err != nil {
				t.Fatalf("expected no error, got %v", err)
			}
		})
	}
}
