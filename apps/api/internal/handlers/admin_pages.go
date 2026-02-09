package handlers

import (
  "database/sql"
  "net/http"
  "strconv"
  "strings"

  "github.com/gin-gonic/gin"
)

type AdminPage struct {
  ID        int    `json:"id"`
  Title     string `json:"title"`
  Slug      string `json:"slug"`
  Content   string `json:"content"`
  UpdatedAt string `json:"updated_at"`
}

type AdminPageInput struct {
  Title   string `json:"title"`
  Slug    string `json:"slug"`
  Content string `json:"content"`
}

func (s *Server) AdminListPages(c *gin.Context) {
  rows, err := s.DB.Query(`
    SELECT id, title, slug, IFNULL(content, ''), updated_at
    FROM pages
    ORDER BY updated_at DESC, id DESC
  `)
  if err != nil {
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to load pages")
    return
  }
  defer rows.Close()

  items := make([]AdminPage, 0)
  for rows.Next() {
    var page AdminPage
    if err := rows.Scan(&page.ID, &page.Title, &page.Slug, &page.Content, &page.UpdatedAt); err != nil {
      respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse pages")
      return
    }
    items = append(items, page)
  }

  respondOK(c, items)
}

func (s *Server) AdminCreatePage(c *gin.Context) {
  var input AdminPageInput
  if err := c.ShouldBindJSON(&input); err != nil {
    respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid page payload")
    return
  }

  if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Slug) == "" {
    respondError(c, http.StatusBadRequest, "missing_fields", "Title and slug are required")
    return
  }

  result, err := s.DB.Exec(`
    INSERT INTO pages (title, slug, content)
    VALUES (?, ?, ?)
  `, input.Title, input.Slug, input.Content)
  if err != nil {
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to create page")
    return
  }

  id, _ := result.LastInsertId()
  s.adminGetPageByID(c, int(id))
}

func (s *Server) AdminGetPage(c *gin.Context) {
  parsed, err := strconv.Atoi(c.Param("id"))
  if err != nil {
    respondError(c, http.StatusBadRequest, "invalid_page", "Invalid page ID")
    return
  }
  s.adminGetPageByID(c, parsed)
}

func (s *Server) adminGetPageByID(c *gin.Context, id int) {
  row := s.DB.QueryRow(`
    SELECT id, title, slug, IFNULL(content, ''), updated_at
    FROM pages WHERE id = ?
  `, id)

  var page AdminPage
  if err := row.Scan(&page.ID, &page.Title, &page.Slug, &page.Content, &page.UpdatedAt); err != nil {
    if err == sql.ErrNoRows {
      respondError(c, http.StatusNotFound, "not_found", "Page not found")
      return
    }
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to load page")
    return
  }

  respondOK(c, page)
}

func (s *Server) AdminUpdatePage(c *gin.Context) {
  id, err := strconv.Atoi(c.Param("id"))
  if err != nil {
    respondError(c, http.StatusBadRequest, "invalid_page", "Invalid page ID")
    return
  }

  var input AdminPageInput
  if err := c.ShouldBindJSON(&input); err != nil {
    respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid page payload")
    return
  }

  if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Slug) == "" {
    respondError(c, http.StatusBadRequest, "missing_fields", "Title and slug are required")
    return
  }

  if _, err := s.DB.Exec(`
    UPDATE pages
    SET title = ?, slug = ?, content = ?
    WHERE id = ?
  `, input.Title, input.Slug, input.Content, id); err != nil {
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to update page")
    return
  }

  s.adminGetPageByID(c, id)
}
