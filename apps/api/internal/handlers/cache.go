package handlers

import (
	"bytes"
	"context"
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

type cacheResponseWriter struct {
	gin.ResponseWriter
	status int
	body   *bytes.Buffer
}

func (w *cacheResponseWriter) WriteHeader(statusCode int) {
	w.status = statusCode
	w.ResponseWriter.WriteHeader(statusCode)
}

func (w *cacheResponseWriter) Write(data []byte) (int, error) {
	w.body.Write(data)
	return w.ResponseWriter.Write(data)
}

func (s *Server) cacheGetMiddleware(ttl time.Duration) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method != http.MethodGet {
			c.Next()
			return
		}
		if !s.Config.CacheEnabled || s.Redis == nil || ttl <= 0 {
			c.Next()
			return
		}

		key := s.cacheKey(c.Request.Method, c.Request.URL.RequestURI())
		ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
		defer cancel()

		cached, err := s.Redis.Get(ctx, key).Bytes()
		if err == nil {
			c.Header("Content-Type", "application/json; charset=utf-8")
			c.Writer.WriteHeader(http.StatusOK)
			_, _ = c.Writer.Write(cached)
			c.Abort()
			return
		}
		if err != nil && err != redis.Nil {
			c.Next()
			return
		}

		recorder := &cacheResponseWriter{
			ResponseWriter: c.Writer,
			status:         http.StatusOK,
			body:           &bytes.Buffer{},
		}
		c.Writer = recorder
		c.Next()

		if recorder.status != http.StatusOK {
			return
		}
		if shouldSkipCache(recorder.Header()) {
			return
		}
		if recorder.body.Len() == 0 {
			return
		}
		_ = s.Redis.Set(ctx, key, recorder.body.Bytes(), ttl).Err()
	}
}

func shouldSkipCache(header http.Header) bool {
	if len(header.Values("Set-Cookie")) > 0 {
		return true
	}
	cacheControl := strings.ToLower(header.Get("Cache-Control"))
	if strings.Contains(cacheControl, "no-store") || strings.Contains(cacheControl, "private") {
		return true
	}
	return false
}

func (s *Server) cacheKey(method, uri string) string {
	raw := method + ":" + uri
	key := s.Config.CachePrefix + raw
	if len(key) <= 256 {
		return key
	}
	return s.Config.CachePrefix + hashIdentifier(raw)
}

func (s *Server) invalidateCache(method, uri string) {
	if !s.Config.CacheEnabled || s.Redis == nil {
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	_ = s.Redis.Del(ctx, s.cacheKey(method, uri)).Err()
}
