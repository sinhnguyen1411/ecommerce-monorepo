package handlers

import (
	"database/sql"
	"net/http"
	"strings"
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
	Tags        []string  `json:"tags,omitempty"`
	PublishedAt time.Time `json:"published_at"`
}

func (s *Server) ListPosts(c *gin.Context) {
	tag := strings.TrimSpace(c.Query("tag"))
	query := `
    SELECT id, title, slug, IFNULL(excerpt, ''), IFNULL(cover_image, ''), IFNULL(tags, ''), published_at
    FROM posts
    WHERE status = 'published'
  `
	args := make([]any, 0)
	if tag != "" {
		query += " AND tags LIKE ?"
		args = append(args, "%"+tag+"%")
	}
	query += " ORDER BY published_at DESC"

	rows, err := s.DB.Query(query, args...)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load posts")
		return
	}
	defer rows.Close()

	posts := make([]Post, 0)
	for rows.Next() {
		var post Post
		var publishedAt sql.NullTime
		var tags sql.NullString
		if err := rows.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.CoverImage, &tags, &publishedAt); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse posts")
			return
		}
		if publishedAt.Valid {
			post.PublishedAt = publishedAt.Time
		}
		post.Tags = parsePostTags(tags)
		post.CoverImage = s.buildAssetURL(post.CoverImage)
		posts = append(posts, post)
	}

	respondOK(c, posts)
}

func (s *Server) GetPost(c *gin.Context) {
	slug := c.Param("slug")

	row := s.DB.QueryRow(`
    SELECT id, title, slug, IFNULL(excerpt, ''), IFNULL(content, ''), IFNULL(cover_image, ''), IFNULL(tags, ''), published_at
    FROM posts
    WHERE slug = ? AND status = 'published'
    LIMIT 1
  `, slug)

	var post Post
	var publishedAt sql.NullTime
	var tags sql.NullString
	if err := row.Scan(&post.ID, &post.Title, &post.Slug, &post.Excerpt, &post.Content, &post.CoverImage, &tags, &publishedAt); err != nil {
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
	post.Tags = parsePostTags(tags)
	post.CoverImage = s.buildAssetURL(post.CoverImage)

	respondOK(c, post)
}

func parsePostTags(tags sql.NullString) []string {
	if !tags.Valid || strings.TrimSpace(tags.String) == "" {
		return []string{}
	}
	raw := strings.Split(tags.String, ",")
	values := make([]string, 0, len(raw))
	for _, value := range raw {
		value = strings.TrimSpace(value)
		if value == "" {
			continue
		}
		values = append(values, value)
	}
	return values
}
