package main

import (
	"database/sql"
	"flag"
	"fmt"
	"log"
	"regexp"
	"strings"
	"unicode/utf8"

	"ecommerce-monorepo/apps/api/internal/config"
	"ecommerce-monorepo/apps/api/internal/db"
)

type tableTarget struct {
	Name    string
	PK      string
	Columns []string
}

type rowUpdate struct {
	ID      int64
	Changes map[string]string
}

type tableStats struct {
	RowsScanned   int
	RowsUpdated   int
	FieldsUpdated int
}

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
	"\u00EF\u00BF\u00BD",
	"\uFFFD",
}

var suspiciousQuestionPattern = regexp.MustCompile(`[\p{L}\p{N}]\?{1,2}[\p{L}\p{N}]`)

var cp1252ReverseMap = map[rune]byte{
	0x20AC: 0x80,
	0x201A: 0x82,
	0x0192: 0x83,
	0x201E: 0x84,
	0x2026: 0x85,
	0x2020: 0x86,
	0x2021: 0x87,
	0x02C6: 0x88,
	0x2030: 0x89,
	0x0160: 0x8A,
	0x2039: 0x8B,
	0x0152: 0x8C,
	0x017D: 0x8E,
	0x2018: 0x91,
	0x2019: 0x92,
	0x201C: 0x93,
	0x201D: 0x94,
	0x2022: 0x95,
	0x2013: 0x96,
	0x2014: 0x97,
	0x02DC: 0x98,
	0x2122: 0x99,
	0x0161: 0x9A,
	0x203A: 0x9B,
	0x0153: 0x9C,
	0x017E: 0x9E,
	0x0178: 0x9F,
}

func main() {
	apply := flag.Bool("apply", false, "Apply changes to the database.")
	dryRun := flag.Bool("dry-run", false, "Preview changes without updating the database (default behavior).")
	flag.Parse()

	if *apply && *dryRun {
		log.Fatal("invalid flags: use either --apply or --dry-run, not both")
	}

	modeApply := *apply

	cfg := config.Load()
	database, err := db.Open(cfg)
	if err != nil {
		log.Fatalf("failed to connect database: %v", err)
	}
	defer database.Close()

	targets := []tableTarget{
		{Name: "products", PK: "id", Columns: []string{"name", "description"}},
		{Name: "posts", PK: "id", Columns: []string{"title", "excerpt", "content"}},
		{Name: "pages", PK: "id", Columns: []string{"title", "content"}},
		{Name: "qna", PK: "id", Columns: []string{"question", "answer"}},
		{Name: "locations", PK: "id", Columns: []string{"name", "province", "district", "address"}},
		{Name: "categories", PK: "id", Columns: []string{"name", "description"}},
	}

	modeLabel := "dry-run"
	if modeApply {
		modeLabel = "apply"
	}
	fmt.Printf("repair-mojibake mode: %s\n", modeLabel)

	total := tableStats{}
	for _, target := range targets {
		stats, err := repairTable(database, target, modeApply)
		if err != nil {
			log.Fatalf("failed to repair table %s: %v", target.Name, err)
		}

		total.RowsScanned += stats.RowsScanned
		total.RowsUpdated += stats.RowsUpdated
		total.FieldsUpdated += stats.FieldsUpdated

		action := "would update"
		if modeApply {
			action = "updated"
		}
		fmt.Printf(
			"- %s: scanned=%d, rows=%d, fields=%d (%s)\n",
			target.Name,
			stats.RowsScanned,
			stats.RowsUpdated,
			stats.FieldsUpdated,
			action,
		)
	}

	fmt.Printf(
		"total: scanned=%d, rows=%d, fields=%d\n",
		total.RowsScanned,
		total.RowsUpdated,
		total.FieldsUpdated,
	)
	if !modeApply {
		fmt.Println("dry-run complete. Run with --apply to persist updates.")
	}
}

func repairTable(database *sql.DB, target tableTarget, apply bool) (tableStats, error) {
	var stats tableStats

	query := fmt.Sprintf(
		"SELECT `%s`, %s FROM `%s`",
		target.PK,
		joinQuotedColumns(target.Columns),
		target.Name,
	)
	rows, err := database.Query(query)
	if err != nil {
		return stats, err
	}
	defer rows.Close()

	updates := make([]rowUpdate, 0)

	for rows.Next() {
		stats.RowsScanned++

		var id int64
		values := make([]sql.NullString, len(target.Columns))
		dest := make([]any, len(target.Columns)+1)
		dest[0] = &id
		for index := range target.Columns {
			dest[index+1] = &values[index]
		}

		if err := rows.Scan(dest...); err != nil {
			return stats, err
		}

		changes := make(map[string]string)
		for index, column := range target.Columns {
			if !values[index].Valid {
				continue
			}
			fixed, ok := repairText(values[index].String)
			if !ok {
				continue
			}
			changes[column] = fixed
			stats.FieldsUpdated++
		}

		if len(changes) == 0 {
			continue
		}
		stats.RowsUpdated++
		updates = append(updates, rowUpdate{ID: id, Changes: changes})
	}

	if err := rows.Err(); err != nil {
		return stats, err
	}

	if !apply || len(updates) == 0 {
		return stats, nil
	}

	tx, err := database.Begin()
	if err != nil {
		return stats, err
	}
	for _, update := range updates {
		setParts := make([]string, 0, len(update.Changes))
		args := make([]any, 0, len(update.Changes)+1)
		for _, column := range target.Columns {
			value, ok := update.Changes[column]
			if !ok {
				continue
			}
			setParts = append(setParts, fmt.Sprintf("`%s` = ?", column))
			args = append(args, value)
		}
		args = append(args, update.ID)

		statement := fmt.Sprintf(
			"UPDATE `%s` SET %s WHERE `%s` = ?",
			target.Name,
			strings.Join(setParts, ", "),
			target.PK,
		)
		if _, err := tx.Exec(statement, args...); err != nil {
			_ = tx.Rollback()
			return stats, err
		}
	}

	if err := tx.Commit(); err != nil {
		return stats, err
	}

	return stats, nil
}

func repairText(value string) (string, bool) {
	if value == "" || !looksBroken(value) {
		return "", false
	}

	best := value
	bestScore := scoreCandidate(value)

	tryCandidate := func(candidate string) bool {
		if candidate == "" || candidate == best {
			return false
		}

		candidateScore := scoreCandidate(candidate)
		if candidateScore < bestScore {
			best = candidate
			bestScore = candidateScore
			return true
		}
		return false
	}

	for round := 0; round < 3; round++ {
		changed := false

		if decoded, ok := decodeSingleByteToUTF8(best, true); ok {
			if tryCandidate(decoded) {
				changed = true
			}
		}

		if decoded, ok := decodeSingleByteToUTF8(best, false); ok {
			if tryCandidate(decoded) {
				changed = true
			}
		}

		if !changed {
			break
		}

		if !looksBroken(best) {
			break
		}
	}

	if best == value || !isImprovement(value, best) {
		return "", false
	}
	return best, true
}

func decodeSingleByteToUTF8(value string, useCP1252 bool) (string, bool) {
	bytes := make([]byte, 0, len(value))
	for _, char := range value {
		switch {
		case char <= 0xff:
			bytes = append(bytes, byte(char&0xff))
		case useCP1252:
			if mapped, ok := cp1252ReverseMap[char]; ok {
				bytes = append(bytes, mapped)
				continue
			}
			return "", false
		default:
			return "", false
		}
	}
	if !utf8.Valid(bytes) {
		return "", false
	}
	return string(bytes), true
}

func isImprovement(before, after string) bool {
	if after == "" || !utf8.ValidString(after) || containsControlChars(after) {
		return false
	}
	return scoreCandidate(after) < scoreCandidate(before)
}

func looksBroken(value string) bool {
	return markerCount(value) > 0 ||
		strings.ContainsRune(value, '\uFFFD') ||
		suspiciousQuestionPattern.MatchString(value)
}

func scoreCandidate(value string) int {
	replacementCount := strings.Count(value, string('\uFFFD'))
	controlCount := 0
	for _, char := range value {
		if (char < 0x20 && char != '\n' && char != '\r' && char != '\t') || char == 0x7f {
			controlCount++
		}
	}
	suspiciousQuestionCount := 0
	if suspiciousQuestionPattern.MatchString(value) {
		suspiciousQuestionCount = 1
	}

	return markerCount(value)*6 + replacementCount*8 + controlCount*10 + suspiciousQuestionCount*4
}

func markerCount(value string) int {
	total := 0
	for _, marker := range mojibakeMarkers {
		total += strings.Count(value, marker)
	}
	return total
}

func containsControlChars(value string) bool {
	for _, char := range value {
		if (char < 0x20 && char != '\n' && char != '\r' && char != '\t') || char == 0x7f {
			return true
		}
	}
	return false
}

func joinQuotedColumns(columns []string) string {
	parts := make([]string, 0, len(columns))
	for _, column := range columns {
		parts = append(parts, fmt.Sprintf("`%s`", column))
	}
	return strings.Join(parts, ", ")
}
