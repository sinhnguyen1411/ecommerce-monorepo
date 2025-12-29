package handlers

import (
  "database/sql"
  "net/http"
  "time"

  "github.com/gin-gonic/gin"
)

type Post struct {
  ID          int       `json:"id"`
  Title       string    `json:"title"`
  Slug        string    `json:"slug"`
  Excerpt     string    `json:"excerpt"`
  Content     string    `json:"content,omitempty"`
  CoverImage  string    `json:"cover_image"`
  PublishedAt time.Time `json:"published_at"`
}

func (s *Server) ListPosts(c *gin.Context) {
  rows, err := s.DB.Query(`
    SELECT id, title, slug, IFNULL(excerpt, ''), IFNULL(cover_image, ''), published_at
    FROM posts
    WHERE status = 'published'
    ORDER BY published_at DESC
  `)
  if err != nil {
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to load posts")
    return
  }
  defer rows.Close()

  posts := make([]Post, 0)
  for rows.Next() {
    var post Post
    var publishedAt sql.NullTime
    if err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.CoverImage, &publishedAt); err != nil {
      respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse posts")
      return
    }
    if publishedAt.Valid {
      post.PublishedAt = publishedAt.Time
    }
    post.CoverImage = s.buildAssetURL(post.CoverImage)
    posts = append(posts, post)
  }

  respondOK(c, posts)
}

func (s *Server) GetPost(c *gin.Context) {
  slug := c.Param("slug")

  row := s.DB.QueryRow(`
    SELECT id, title, slug, IFNULL(excerpt, ''), IFNULL(content, ''), IFNULL(cover_image, ''), published_at
    FROM posts
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `, slug)

  var post Post
  var publishedAt sql.NullTime
  if err := row.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.Content, &post.CoverImage, &publishedAt); err != nil {
    if err == sql.ErrNoRows {
      respondError(c, http.StatusNotFound, "not_found", "Post not found")
      return
    }
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to load post")
    return
  }

  if publishedAt.Valid {
    post.PublishedAt = publishedAt.Time
  }
  post.CoverImage = s.buildAssetURL(post.CoverImage)

  respondOK(c, post)
}
