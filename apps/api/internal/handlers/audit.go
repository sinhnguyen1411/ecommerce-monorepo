package handlers

import (
	"encoding/json"
	"log"
	"strings"

	"github.com/gin-gonic/gin"
)

func (s *Server) logAudit(c *gin.Context, userID *int, action string, meta map[string]any) {
	var metaJSON any
	if meta != nil {
		if raw, err := json.Marshal(meta); err == nil {
			metaJSON = raw
		}
	}

	_, err := s.DB.Exec(`INSERT INTO audit_logs (user_id, action, ip, meta_json) VALUES (?, ?, ?, ?)`,
		userID, action, c.ClientIP(), metaJSON)
	if err != nil {
		log.Printf("audit_log_error action=%s err=%v", action, err)
	}
}

func maskEmail(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) != 2 {
		return "***"
	}
	local := parts[0]
	if len(local) <= 1 {
		return "***@" + parts[1]
	}
	return local[:1] + "***@" + parts[1]
}

func maskPhone(phone string) string {
	if len(phone) <= 4 {
		return "***"
	}
	return "***" + phone[len(phone)-4:]
}

func maskDestination(channel, destination string) string {
	switch channel {
	case "email":
		return maskEmail(destination)
	case "sms":
		return maskPhone(destination)
	default:
		return "***"
	}
}
