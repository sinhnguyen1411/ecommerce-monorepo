package handlers

import (
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
)

func isBodyTooLarge(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(err.Error(), "http: request body too large")
}

func (s *Server) bindJSONWithLimit(c *gin.Context, dest any, invalidMessage string) bool {
	max := s.Config.JSONBodyMaxBytes
	if max > 0 {
		if c.Request.ContentLength > max {
			respondError(c, http.StatusRequestEntityTooLarge, "payload_too_large", "Payload too large")
			return false
		}
		c.Request.Body = http.MaxBytesReader(c.Writer, c.Request.Body, max)
	}

	if err := c.ShouldBindJSON(dest); err != nil {
		if isBodyTooLarge(err) {
			respondError(c, http.StatusRequestEntityTooLarge, "payload_too_large", "Payload too large")
			return false
		}
		respondError(c, http.StatusBadRequest, "invalid_payload", invalidMessage)
		return false
	}
	return true
}

func (s *Server) enforceUploadSize(c *gin.Context, size int64) bool {
	max := s.Config.UploadMaxBytes
	if max > 0 && size > max {
		respondError(c, http.StatusRequestEntityTooLarge, "payload_too_large", "Payload too large")
		return false
	}
	return true
}
