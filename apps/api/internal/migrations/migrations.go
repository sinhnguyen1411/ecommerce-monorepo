package migrations

import (
  "database/sql"
  "fmt"
  "io/fs"
  "os"
  "path/filepath"
  "sort"
  "strings"
)

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
