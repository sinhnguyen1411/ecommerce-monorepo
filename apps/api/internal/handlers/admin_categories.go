package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type AdminCategory struct {
	ID          int    `json:"id"`
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
}

type AdminCategoryInput struct {
	Name        string `json:"name"`
	Slug        string `json:"slug"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
}

func (s *Server) AdminListCategories(c *gin.Context) {
	rows, err := s.DB.Query(`SELECT id, name, slug, IFNULL(description, ''), sort_order FROM categories ORDER BY sort_order ASC`)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load categories")
		return
	}
	defer rows.Close()

	items := make([]AdminCategory, 0)
	for rows.Next() {
		var category AdminCategory
		if err := rows.Scan(&category.ID, &category.Name, &category.Slug, &category.Description, &category.SortOrder); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse categories")
			return
		}
		items = append(items, category)
	}

	respondOK(c, items)
}

func (s *Server) AdminCreateCategory(c *gin.Context) {
	var input AdminCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid category payload")
		return
	}

	if strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Slug) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Name and slug are required")
		return
	}

	result, err := s.DB.Exec(`INSERT INTO categories (name, slug, description, sort_order) VALUES (?, ?, ?, ?)`, input.Name, input.Slug, input.Description, input.SortOrder)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create category")
		return
	}
	id, _ := result.LastInsertId()
	s.adminGetCategoryByID(c, int(id))
}

func (s *Server) AdminGetCategory(c *gin.Context) {
	parsed, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_category", "Invalid category ID")
		return
	}
	s.adminGetCategoryByID(c, parsed)
}

func (s *Server) adminGetCategoryByID(c *gin.Context, id int) {
	row := s.DB.QueryRow(`SELECT id, name, slug, IFNULL(description, ''), sort_order FROM categories WHERE id = ?`, id)
	var category AdminCategory
	if err := row.Scan(&category.ID, &category.Name, &category.Slug, &category.Description, &category.SortOrder); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Category not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load category")
		return
	}

	respondOK(c, category)
}

func (s *Server) AdminUpdateCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_category", "Invalid category ID")
		return
	}

	var input AdminCategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid category payload")
		return
	}

	_, err = s.DB.Exec(`UPDATE categories SET name = ?, slug = ?, description = ?, sort_order = ? WHERE id = ?`, input.Name, input.Slug, input.Description, input.SortOrder, id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update category")
		return
	}

	s.adminGetCategoryByID(c, id)
}

func (s *Server) AdminDeleteCategory(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_category", "Invalid category ID")
		return
	}

	if _, err := s.DB.Exec(`DELETE FROM categories WHERE id = ?`, id); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to delete category")
		return
	}

	respondOK(c, gin.H{"deleted": true})
}
