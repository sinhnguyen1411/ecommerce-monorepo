package migrations

import (
	"bytes"
	"database/sql"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"unicode/utf8"
)

var mojibakeMarkers = []string{
	"\u00C3",
	"\u00C4",
	"\u00C5",
	"\u00C6",
	"\u00C2",
	"\u00E1\u00BB",
	"\u00E1\u00BA",
	"\u00C6\u00B0",
	"\u00C4\u2018",
	"\u00E2\u20AC",
	"\uFFFD",
}

func Apply(db *sql.DB, dir string) error {
	if err := ensureTable(db); err != nil {
		return err
	}

	entries, err := os.ReadDir(dir)
	if err != nil {
		return err
	}

	files := make([]string, 0)
	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}
		if strings.HasSuffix(entry.Name(), ".sql") {
			files = append(files, entry.Name())
		}
	}

	sort.Strings(files)

	for _, file := range files {
		applied, err := isApplied(db, file)
		if err != nil {
			return err
		}
		if applied {
			continue
		}

		path := filepath.Join(dir, file)
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}
		if err := validateMigrationSQL(content, file); err != nil {
			return err
		}

		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("apply %s: %w", file, err)
		}

		if err := markApplied(db, file); err != nil {
			return err
		}
	}

	return nil
}

func ensureTable(db *sql.DB) error {
	_, err := db.Exec(`CREATE TABLE IF NOT EXISTS schema_migrations (
    version VARCHAR(255) PRIMARY KEY,
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`)
	return err
}

func isApplied(db *sql.DB, version string) (bool, error) {
	var count int
	row := db.QueryRow("SELECT COUNT(*) FROM schema_migrations WHERE version = ?", version)
	if err := row.Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func markApplied(db *sql.DB, version string) error {
	_, err := db.Exec("INSERT INTO schema_migrations (version) VALUES (?)", version)
	return err
}

func EnsureDir(path string) error {
	return os.MkdirAll(path, fs.ModePerm)
}

func validateMigrationSQL(content []byte, filename string) error {
	if !utf8.Valid(content) {
		line := 1
		for index := 0; index < len(content); {
			char, size := utf8.DecodeRune(content[index:])
			if char == utf8.RuneError && size == 1 {
				return fmt.Errorf("migration %s: invalid UTF-8 byte at line %d", filename, line)
			}
			if char == '\n' {
				line++
			}
			index += size
		}
		return fmt.Errorf("migration %s: invalid UTF-8 content", filename)
	}

	for index, b := range content {
		if (b < 0x20 && b != '\n' && b != '\r' && b != '\t') || b == 0x7f {
			line := 1 + bytes.Count(content[:index], []byte{'\n'})
			return fmt.Errorf(
				"migration %s: control character 0x%X at line %d",
				filename,
				b,
				line,
			)
		}
	}

	text := string(content)
	for _, marker := range mojibakeMarkers {
		index := strings.Index(text, marker)
		if index < 0 {
			continue
		}
		line := 1 + strings.Count(text[:index], "\n")
		return fmt.Errorf(
			"migration %s: suspected mojibake marker %q at line %d",
			filename,
			marker,
			line,
		)
	}

	return nil
}
