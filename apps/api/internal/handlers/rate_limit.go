package handlers

import (
	"context"
	"crypto/sha256"
	"database/sql"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/redis/go-redis/v9"
)

func (s *Server) enforceAuthRateLimit(c *gin.Context) bool {
	key := rateLimitKey("auth:"+c.FullPath(), c.ClientIP())
	return s.enforceRateLimit(c, key, s.Config.AuthRateLimitMax, s.Config.AuthRateLimitWindow, "rate_limited", "Too many requests")
}

func (s *Server) enforceAPIRateLimit(c *gin.Context) bool {
	key := rateLimitKey("api:"+c.FullPath(), c.ClientIP())
	return s.enforceRateLimit(c, key, s.Config.APIRateLimitMax, s.Config.APIRateLimitWindow, "rate_limited", "Too many requests")
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

func isMutatingMethod(method string) bool {
	switch method {
	case http.MethodPost, http.MethodPut, http.MethodPatch, http.MethodDelete:
		return true
	default:
		return false
	}
}

func getContextUserID(c *gin.Context) (int, bool) {
	value, ok := c.Get("user_id")
	if !ok {
		return 0, false
	}
	userID, ok := value.(int)
	return userID, ok
}

func hashIdentifier(value string) string {
	sum := sha256.Sum256([]byte(value))
	return hex.EncodeToString(sum[:])
}

func rateLimitKey(prefix, id string) string {
	key := fmt.Sprintf("%s:%s", prefix, id)
	if len(key) <= 128 {
		return key
	}
	return fmt.Sprintf("%s:%s", prefix, hashIdentifier(id))
}

func (s *Server) enforceRateLimit(c *gin.Context, key string, max int, window time.Duration, code, message string) bool {
	if max <= 0 {
		return true
	}
	allowed, retryAfter, err := s.checkRateLimit(key, max, window)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "rate_limit_error", "Rate limit check failed")
		return false
	}
	if !allowed {
		if retryAfter > 0 {
			if code == "" {
				code = "rate_limited"
			}
			if message == "" {
				message = "Too many requests"
			}
			c.Header("Retry-After", fmt.Sprintf("%d", int(retryAfter.Seconds())))
			retryAt := time.Now().Add(retryAfter)
			respondErrorWithRetryAt(c, http.StatusTooManyRequests, code, message, retryAt)
			return false
		}
		if code == "" {
			code = "rate_limited"
		}
		if message == "" {
			message = "Too many requests"
		}
		respondError(c, http.StatusTooManyRequests, code, message)
		return false
	}
	return true
}

func (s *Server) enforceEndpointRateLimit(c *gin.Context, scope string, max int, window time.Duration, code, message string) bool {
	baseKey := scope + ":" + c.FullPath()

	ipKey := rateLimitKey(baseKey+":ip", c.ClientIP())
	if !s.enforceRateLimit(c, ipKey, max, window, code, message) {
		return false
	}

	if userID, ok := getContextUserID(c); ok {
		userKey := rateLimitKey(baseKey+":user", fmt.Sprintf("%d", userID))
		if !s.enforceRateLimit(c, userKey, max, window, code, message) {
			return false
		}
	}
	return true
}

func (s *Server) buyerWriteRateLimitMiddleware(skipPaths map[string]struct{}) gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		if !isMutatingMethod(c.Request.Method) {
			c.Next()
			return
		}
		if skipPaths != nil {
			if _, ok := skipPaths[c.FullPath()]; ok {
				c.Next()
				return
			}
		}
		if !s.enforceEndpointRateLimit(c, "buyer_write", s.Config.BuyerWriteRateLimitMax, s.Config.BuyerWriteRateLimitWindow, "buyer_write_rate_limited", "Too many requests") {
			c.Abort()
			return
		}
		c.Next()
	}
}

func (s *Server) adminWriteRateLimitMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		if c.Request.Method == http.MethodOptions {
			c.Next()
			return
		}
		if !isMutatingMethod(c.Request.Method) {
			c.Next()
			return
		}
		if !s.enforceEndpointRateLimit(c, "admin_write", s.Config.AdminWriteRateLimitMax, s.Config.AdminWriteRateLimitWindow, "admin_write_rate_limited", "Too many requests") {
			c.Abort()
			return
		}
		c.Next()
	}
}

var rateLimitScript = redis.NewScript(`
local current = redis.call("INCR", KEYS[1])
if current == 1 then
  redis.call("PEXPIRE", KEYS[1], ARGV[1])
end
local ttl = redis.call("PTTL", KEYS[1])
return {current, ttl}
`)

func (s *Server) checkRateLimit(key string, max int, window time.Duration) (bool, time.Duration, error) {
	if max <= 0 {
		return true, 0, nil
	}
	if s.Redis != nil {
		allowed, retryAfter, err := s.checkRateLimitRedis(key, max, window)
		if err == nil {
			return allowed, retryAfter, nil
		}
		log.Printf("rate_limit_redis_error key=%s err=%v", key, err)
	}
	return s.checkRateLimitDB(key, max, window)
}

func (s *Server) checkRateLimitRedis(key string, max int, window time.Duration) (bool, time.Duration, error) {
	if s.Redis == nil {
		return false, 0, fmt.Errorf("redis not configured")
	}
	windowMs := window.Milliseconds()
	if windowMs <= 0 {
		return true, 0, nil
	}
	redisKey := s.Config.RedisPrefix + key
	ctx, cancel := context.WithTimeout(context.Background(), 200*time.Millisecond)
	defer cancel()

	result, err := rateLimitScript.Run(ctx, s.Redis, []string{redisKey}, windowMs).Result()
	if err != nil {
		return false, 0, err
	}
	values, ok := result.([]interface{})
	if !ok || len(values) < 2 {
		return false, 0, fmt.Errorf("unexpected redis response")
	}
	current, ok := toInt64(values[0])
	if !ok {
		return false, 0, fmt.Errorf("invalid redis counter")
	}
	ttlMs, ok := toInt64(values[1])
	if !ok {
		return false, 0, fmt.Errorf("invalid redis ttl")
	}

	if current <= int64(max) {
		return true, 0, nil
	}
	if ttlMs <= 0 {
		return false, 0, nil
	}
	return false, time.Duration(ttlMs) * time.Millisecond, nil
}

func toInt64(value any) (int64, bool) {
	switch v := value.(type) {
	case int64:
		return v, true
	case int:
		return int64(v), true
	case int32:
		return int64(v), true
	case uint64:
		return int64(v), true
	case []byte:
		parsed, err := strconv.ParseInt(string(v), 10, 64)
		return parsed, err == nil
	case string:
		parsed, err := strconv.ParseInt(v, 10, 64)
		return parsed, err == nil
	default:
		return 0, false
	}
}

func (s *Server) checkRateLimitDB(key string, max int, window time.Duration) (bool, time.Duration, error) {
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
