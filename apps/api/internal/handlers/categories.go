package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Category struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
}

func (s *Server) ListCategories(c *gin.Context) {
	rows, err := s.DB.Query(`
    SELECT id, name, slug, IFNULL(description, ''), sort_order
    FROM categories
    ORDER BY sort_order ASC, name ASC
  `)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load categories")
		return
	}
	defer rows.Close()

	categories := make([]Category, 0)
	for rows.Next() {
		var category Category
		if err := rows.Scan(&category.ID, &category.Name, &category.Slug, &category.Description, &category.SortOrder); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse categories")
			return
		}
		categories = append(categories, category)
	}

	respondOK(c, categories)
}
