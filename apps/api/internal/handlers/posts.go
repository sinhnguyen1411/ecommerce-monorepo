package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
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

type PostsPagination struct {
	Page       int  `json:"page"`
	Limit      int  `json:"limit"`
	TotalItems int  `json:"total_items"`
	TotalPages int  `json:"total_pages"`
	HasPrev    bool `json:"has_prev"`
	HasNext    bool `json:"has_next"`
}

type PostsListPaginatedResponse struct {
	Items      []Post          `json:"items"`
	Pagination PostsPagination `json:"pagination"`
}

const (
	defaultPostsPage  = 1
	defaultPostsLimit = 10
	maxPostsLimit     = 50
)

func (s *Server) ListPosts(c *gin.Context) {
	tag := strings.TrimSpace(c.Query("tag"))
	pageParam := strings.TrimSpace(c.Query("page"))
	limitParam := strings.TrimSpace(c.Query("limit"))
	withPagination := pageParam != "" || limitParam != ""

	page := parsePositiveInt(pageParam, defaultPostsPage)
	limit := parsePositiveInt(limitParam, defaultPostsLimit)
	if limit > maxPostsLimit {
		limit = maxPostsLimit
	}

	listQuery := `
    SELECT id, title, slug, IFNULL(excerpt, ''), IFNULL(cover_image, ''), IFNULL(tags, ''), published_at
    FROM posts
    WHERE status = 'published'
  `
	countQuery := `
    SELECT COUNT(*)
    FROM posts
    WHERE status = 'published'
  `
	args := make([]any, 0)
	if tag != "" {
		listQuery += " AND tags LIKE ?"
		countQuery += " AND tags LIKE ?"
		args = append(args, "%"+tag+"%")
	}
	listQuery += " ORDER BY published_at DESC, id DESC"

	var pagination PostsPagination
	if withPagination {
		var totalItems int
		if err := s.DB.QueryRow(countQuery, args...).Scan(&totalItems); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to count posts")
			return
		}

		totalPages := 1
		if totalItems > 0 {
			totalPages = (totalItems + limit - 1) / limit
		}
		if page > totalPages {
			page = totalPages
		}
		offset := (page - 1) * limit

		pagination = PostsPagination{
			Page:       page,
			Limit:      limit,
			TotalItems: totalItems,
			TotalPages: totalPages,
			HasPrev:    page > 1,
			HasNext:    page < totalPages,
		}

		listQuery += " LIMIT ? OFFSET ?"
		args = append(args, limit, offset)
	}

	rows, err := s.DB.Query(listQuery, args...)
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

	if withPagination {
		respondOK(c, PostsListPaginatedResponse{
			Items:      posts,
			Pagination: pagination,
		})
		return
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

func parsePositiveInt(value string, fallback int) int {
	if value == "" {
		return fallback
	}
	parsed, err := strconv.Atoi(value)
	if err != nil || parsed <= 0 {
		return fallback
	}
	return parsed
}
