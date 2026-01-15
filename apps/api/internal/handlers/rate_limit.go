package handlers

import (
	"database/sql"
	"fmt"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
)

func (s *Server) enforceAuthRateLimit(c *gin.Context) bool {
	if s.Config.AuthRateLimitMax <= 0 {
		return true
	}
	key := fmt.Sprintf("auth:%s:%s", c.FullPath(), c.ClientIP())
	allowed, retryAfter, err := s.checkRateLimit(key, s.Config.AuthRateLimitMax, s.Config.AuthRateLimitWindow)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "rate_limit_error", "Rate limit check failed")
		return false
	}
	if !allowed {
		if retryAfter > 0 {
			c.Header("Retry-After", fmt.Sprintf("%d", int(retryAfter.Seconds())))
		}
		respondError(c, http.StatusTooManyRequests, "rate_limited", "Too many requests")
		return false
	}
	return true
}

func (s *Server) enforceAPIRateLimit(c *gin.Context) bool {
	if s.Config.APIRateLimitMax <= 0 {
		return true
	}
	key := fmt.Sprintf("api:%s:%s", c.FullPath(), c.ClientIP())
	allowed, retryAfter, err := s.checkRateLimit(key, s.Config.APIRateLimitMax, s.Config.APIRateLimitWindow)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "rate_limit_error", "Rate limit check failed")
		return false
	}
	if !allowed {
		if retryAfter > 0 {
			c.Header("Retry-After", fmt.Sprintf("%d", int(retryAfter.Seconds())))
		}
		respondError(c, http.StatusTooManyRequests, "rate_limited", "Too many requests")
		return false
	}
	return true
}

func (s *Server) authRateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		if !s.enforceAuthRateLimit(c) {
			c.Abort()
			return
		}
		c.Next()
	}
}

func (s *Server) apiRateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		if !s.enforceAPIRateLimit(c) {
			c.Abort()
			return
		}
		c.Next()
	}
}

func (s *Server) checkRateLimit(key string, max int, window time.Duration) (bool, time.Duration, error) {
	if max <= 0 {
		return true, 0, nil
	}

	now := time.Now().UTC()
	tx, err := s.DB.Begin()
	if err != nil {
		return false, 0, err
	}
	defer tx.Rollback()

	var windowStart time.Time
	var count int
	row := tx.QueryRow(`SELECT window_start, count FROM rate_limits WHERE rate_key = ? FOR UPDATE`, key)
	if err := row.Scan(&windowStart, &count); err != nil {
		if err == sql.ErrNoRows {
			if _, err := tx.Exec(`INSERT INTO rate_limits (rate_key, window_start, count) VALUES (?, ?, 1)`, key, now); err != nil {
				return false, 0, err
			}
			if err := tx.Commit(); err != nil {
				return false, 0, err
			}
			return true, 0, nil
		}
		return false, 0, err
	}

	elapsed := now.Sub(windowStart)
	if elapsed >= window {
		if _, err := tx.Exec(`UPDATE rate_limits SET window_start = ?, count = 1 WHERE rate_key = ?`, now, key); err != nil {
			return false, 0, err
		}
		if err := tx.Commit(); err != nil {
			return false, 0, err
		}
		return true, 0, nil
	}

	if count >= max {
		if err := tx.Commit(); err != nil {
			return false, 0, err
		}
		return false, window - elapsed, nil
	}

	if _, err := tx.Exec(`UPDATE rate_limits SET count = ? WHERE rate_key = ?`, count+1, key); err != nil {
		return false, 0, err
	}
	if err := tx.Commit(); err != nil {
		return false, 0, err
	}
	return true, 0, nil
}
