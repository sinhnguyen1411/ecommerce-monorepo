package seed

import (
	"database/sql"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func ApplyIfNeeded(db *sql.DB, dir string) error {
	seeded, err := hasProducts(db)
	if err != nil {
		return err
	}
	if seeded {
		if err := applySeedFile(db, dir, "003_promotions.sql"); err != nil {
			return err
		}
		return applySeedFile(db, dir, "004_users.sql")
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

		if _, err := db.Exec(string(content)); err != nil {
			return fmt.Errorf("seed %s: %w", file, err)
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

	if _, err := db.Exec(string(content)); err != nil {
		return fmt.Errorf("seed %s: %w", filename, err)
	}

	return nil
}
