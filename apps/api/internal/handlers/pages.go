package handlers

import (
  "database/sql"
  "net/http"

  "github.com/gin-gonic/gin"
)

type Page struct {
  ID      int    `json:"id"`
  Title   string `json:"title"`
  Slug    string `json:"slug"`
  Content string `json:"content"`
}

func (s *Server) GetPage(c *gin.Context) {
  slug := c.Param("slug")

  row := s.DB.QueryRow(`
    SELECT id, title, slug, IFNULL(content, '')
    FROM pages
    WHERE slug = ?
    LIMIT 1
  `, slug)

  var page Page
  if err := row.Scan(&page.ID, &page.Title, &page.Slug, &page.Content); err != nil {
    if err == sql.ErrNoRows {
      respondError(c, http.StatusNotFound, "not_found", "Page not found")
      return
    }
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to load page")
    return
  }

  respondOK(c, page)
}
