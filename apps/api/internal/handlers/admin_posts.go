package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type AdminPost struct {
	ID          int     `json:"id"`
	Title       string  `json:"title"`
	Slug        string  `json:"slug"`
	Excerpt     string  `json:"excerpt"`
	Content     string  `json:"content"`
	CoverImage  string  `json:"cover_image"`
	Status      string  `json:"status"`
	Tags        string  `json:"tags"`
	SortOrder   int     `json:"sort_order"`
	PublishedAt *string `json:"published_at,omitempty"`
}

type AdminPostInput struct {
	Title       string `json:"title"`
	Slug        string `json:"slug"`
	Excerpt     string `json:"excerpt"`
	Content     string `json:"content"`
	CoverImage  string `json:"cover_image"`
	Status      string `json:"status"`
	Tags        string `json:"tags"`
	SortOrder   int    `json:"sort_order"`
	PublishedAt string `json:"published_at"`
}

func (s *Server) AdminListPosts(c *gin.Context) {
	rows, err := s.DB.Query(`
    SELECT id, title, slug, IFNULL(excerpt, ''), IFNULL(content, ''), IFNULL(cover_image, ''), status, IFNULL(tags, ''), sort_order, published_at
    FROM posts
    ORDER BY sort_order DESC, published_at DESC
  `)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load posts")
		return
	}
	defer rows.Close()

	items := make([]AdminPost, 0)
	for rows.Next() {
		var post AdminPost
		var publishedAt sql.NullString
		if err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.Content, &post.CoverImage, &post.Status, &post.Tags, &post.SortOrder, &publishedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse posts")
			return
		}
		if publishedAt.Valid {
			post.PublishedAt = &publishedAt.String
		}
		items = append(items, post)
	}

	respondOK(c, items)
}

func (s *Server) AdminCreatePost(c *gin.Context) {
	var input AdminPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid post payload")
		return
	}

	if strings.TrimSpace(input.Title) == "" || strings.TrimSpace(input.Slug) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Title and slug are required")
		return
	}

	status := input.Status
	if status == "" {
		status = "published"
	}

	result, err := s.DB.Exec(`
    INSERT INTO posts (title, slug, excerpt, content, cover_image, status, tags, sort_order, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `, input.Title, input.Slug, input.Excerpt, input.Content, input.CoverImage, status, input.Tags, input.SortOrder, nullIfEmpty(input.PublishedAt))
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create post")
		return
	}

	id, _ := result.LastInsertId()
	s.adminGetPostByID(c, int(id))
}

func (s *Server) AdminGetPost(c *gin.Context) {
	parsed, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_post", "Invalid post ID")
		return
	}
	s.adminGetPostByID(c, parsed)
}

func (s *Server) adminGetPostByID(c *gin.Context, id int) {
	row := s.DB.QueryRow(`
    SELECT id, title, slug, IFNULL(excerpt, ''), IFNULL(content, ''), IFNULL(cover_image, ''), status, IFNULL(tags, ''), sort_order, published_at
    FROM posts WHERE id = ?
  `, id)
	var post AdminPost
	var publishedAt sql.NullString
	if err := row.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.Content, &post.CoverImage, &post.Status, &post.Tags, &post.SortOrder, &publishedAt); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "Post not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load post")
		return
	}
	if publishedAt.Valid {
		post.PublishedAt = &publishedAt.String
	}

	respondOK(c, post)
}

func (s *Server) AdminUpdatePost(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_post", "Invalid post ID")
		return
	}

	var input AdminPostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid post payload")
		return
	}

	status := input.Status
	if status == "" {
		status = "published"
	}

	_, err = s.DB.Exec(`
    UPDATE posts
    SET title = ?, slug = ?, excerpt = ?, content = ?, cover_image = ?, status = ?, tags = ?, sort_order = ?, published_at = ?
    WHERE id = ?
  `, input.Title, input.Slug, input.Excerpt, input.Content, input.CoverImage, status, input.Tags, input.SortOrder, nullIfEmpty(input.PublishedAt), id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update post")
		return
	}

	s.adminGetPostByID(c, id)
}

func (s *Server) AdminDeletePost(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_post", "Invalid post ID")
		return
	}

	if _, err := s.DB.Exec(`DELETE FROM posts WHERE id = ?`, id); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to delete post")
		return
	}

	respondOK(c, gin.H{"deleted": true})
}

func nullIfEmpty(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
