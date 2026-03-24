package seed

import (
	"bytes"
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"unicode/utf8"
)

var mojibakeMarkers = []string{
	"\u00C3",
	"\u00C4",
	"\u00E1\u00BB",
	"\u00E1\u00BA",
	"\u00C6\u00B0",
	"\u00C4\u2018",
	"\u00E2\u20AC",
	"\uFFFD",
}

func ApplyIfNeeded(db *sql.DB, dir string, refreshOnStart bool) error {
	seeded, err := hasProducts(db)
	if err != nil {
		return err
	}
	if seeded {
		if !refreshOnStart {
			return nil
		}

		if err := applySeedFile(db, dir, "003_promotions.sql"); err != nil {
			return err
		}
		if err := applySeedFile(db, dir, "004_users.sql"); err != nil {
			return err
		}
		return applySeedFile(db, dir, "005_content_quality.sql")
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
		path := filepath.Join(dir, file)
		content, err := os.ReadFile(path)
		if err != nil {
			return err
		}

		if err := executeSeedSQL(db, file, content); err != nil {
			return err
		}
	}

	return nil
}

func hasProducts(db *sql.DB) (bool, error) {
	var count int
	row := db.QueryRow("SELECT COUNT(*) FROM products")
	if err := row.Scan(&count); err != nil {
		return false, err
	}
	return count > 0, nil
}

func applySeedFile(db *sql.DB, dir, filename string) error {
	path := filepath.Join(dir, filename)
	content, err := os.ReadFile(path)
	if err != nil {
		if os.IsNotExist(err) {
			return nil
		}
		return err
	}

	if err := executeSeedSQL(db, filename, content); err != nil {
		return err
	}

	return nil
}

func executeSeedSQL(db *sql.DB, filename string, content []byte) error {
	if err := validateSeedSQL(content, filename); err != nil {
		return err
	}

	if _, err := db.Exec(string(content)); err != nil {
		return fmt.Errorf("seed %s: %w", filename, err)
	}

	return nil
}

func validateSeedSQL(content []byte, filename string) error {
	if !utf8.Valid(content) {
		line := 1
		for index := 0; index < len(content); {
			r, size := utf8.DecodeRune(content[index:])
			if r == utf8.RuneError && size == 1 {
				return fmt.Errorf("seed %s: invalid UTF-8 byte at line %d", filename, line)
			}
			if r == '\n' {
				line++
			}
			index += size
		}
		return fmt.Errorf("seed %s: invalid UTF-8 content", filename)
	}

	for index, b := range content {
		if (b < 0x20 && b != '\n' && b != '\r' && b != '\t') || b == 0x7f {
			line := 1 + bytes.Count(content[:index], []byte{'\n'})
			return fmt.Errorf(
				"seed %s: control character 0x%X at line %d",
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
			"seed %s: suspected mojibake marker %q at line %d",
			filename,
			marker,
			line,
		)
	}

	return nil
}
