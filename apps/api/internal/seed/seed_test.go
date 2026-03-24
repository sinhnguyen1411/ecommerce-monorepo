package seed

import (
	"os"
	"path/filepath"
	"strings"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
)

func TestApplyIfNeededSkipsRefreshWhenSeeded(t *testing.T) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM products`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(1))

	if err := ApplyIfNeeded(db, t.TempDir(), false); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestApplyIfNeededRefreshesWhenEnabled(t *testing.T) {
	dir := t.TempDir()
	files := map[string]string{
		"003_promotions.sql":      "SELECT 3;",
		"004_users.sql":           "SELECT 4;",
		"005_content_quality.sql": "SELECT 5;",
	}
	for name, content := range files {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(content), 0o644); err != nil {
			t.Fatalf("failed to write %s: %v", name, err)
		}
	}

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM products`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(2))
	mock.ExpectExec(`SELECT 3;`).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec(`SELECT 4;`).WillReturnResult(sqlmock.NewResult(0, 0))
	mock.ExpectExec(`SELECT 5;`).WillReturnResult(sqlmock.NewResult(0, 0))

	if err := ApplyIfNeeded(db, dir, true); err != nil {
		t.Fatalf("expected nil error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestApplyIfNeededRejectsMojibakeSeed(t *testing.T) {
	dir := t.TempDir()
	content := "UPDATE products SET name = 'BÃ¡';"
	if err := os.WriteFile(filepath.Join(dir, "001_seed.sql"), []byte(content), 0o644); err != nil {
		t.Fatalf("failed to write test seed: %v", err)
	}

	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}
	defer db.Close()

	mock.ExpectQuery(`SELECT COUNT\(\*\) FROM products`).
		WillReturnRows(sqlmock.NewRows([]string{"count"}).AddRow(0))

	err = ApplyIfNeeded(db, dir, false)
	if err == nil {
		t.Fatal("expected mojibake error, got nil")
	}
	if !strings.Contains(err.Error(), "suspected mojibake marker") {
		t.Fatalf("expected mojibake marker error, got %v", err)
	}
	if !strings.Contains(err.Error(), "line 1") {
		t.Fatalf("expected line information in error, got %v", err)
	}

	if err := mock.ExpectationsWereMet(); err != nil {
		t.Fatalf("unmet sql expectations: %v", err)
	}
}

func TestValidateSeedSQLRejectsControlCharacter(t *testing.T) {
	content := []byte("UPDATE products SET name = 'ok';\n\x01")
	err := validateSeedSQL(content, "control.sql")
	if err == nil {
		t.Fatal("expected control character error, got nil")
	}
	if !strings.Contains(err.Error(), "control character") {
		t.Fatalf("expected control character error, got %v", err)
	}
}
