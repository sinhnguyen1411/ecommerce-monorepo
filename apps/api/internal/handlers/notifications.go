package handlers

import (
	"bytes"
	"errors"
	"fmt"
	"log"
	"mime"
	"net/smtp"
	"strings"

	"ecommerce-monorepo/apps/api/internal/config"
)

type EmailSender interface {
	Send(to, subject, body string) error
}

type DevEmailSender struct {
	Enabled bool
}

func (s *DevEmailSender) Send(to, subject, body string) error {
	if !s.Enabled {
		return errors.New("email not configured")
	}
	log.Printf("[DEV] Email to %s subject=%s body=%s", to, subject, body)
	return nil
}

type SMTPEmailSender struct {
	Host     string
	Port     string
	Username string
	Password string
	From     string
	FromName string
}

func (s *SMTPEmailSender) Send(to, subject, body string) error {
	addr := fmt.Sprintf("%s:%s", s.Host, s.Port)
	auth := smtp.PlainAuth("", s.Username, s.Password, s.Host)
	if s.Username == "" {
		auth = nil
	}

	var buf bytes.Buffer
	fromHeader := s.From
	if s.FromName != "" {
		fromHeader = fmt.Sprintf("%s <%s>", mime.QEncoding.Encode("utf-8", s.FromName), s.From)
	}
	buf.WriteString(fmt.Sprintf("From: %s\r\n", fromHeader))
	buf.WriteString(fmt.Sprintf("To: %s\r\n", to))
	buf.WriteString(fmt.Sprintf("Subject: %s\r\n", mime.QEncoding.Encode("utf-8", subject)))
	buf.WriteString("MIME-Version: 1.0\r\n")
	buf.WriteString("Content-Type: text/plain; charset=\"UTF-8\"\r\n")
	buf.WriteString("\r\n")
	buf.WriteString(body)

	return smtp.SendMail(addr, auth, s.From, []string{to}, buf.Bytes())
}

func buildEmailSender(cfg config.Config) (EmailSender, error) {
	if cfg.SMTPHost != "" && cfg.SMTPFrom != "" {
		port := cfg.SMTPPort
		if port == "" {
			port = "587"
		}
		return &SMTPEmailSender{
			Host:     cfg.SMTPHost,
			Port:     port,
			Username: cfg.SMTPUsername,
			Password: cfg.SMTPPassword,
			From:     cfg.SMTPFrom,
			FromName: cfg.SMTPFromName,
		}, nil
	}

	isProd := isProdEnv(cfg.AppEnv)
	if isProd {
		return nil, errors.New("smtp not configured")
	}

	return &DevEmailSender{Enabled: true}, nil
}

func isProdEnv(env string) bool {
	return strings.EqualFold(env, "production") || strings.EqualFold(env, "prod")
}
