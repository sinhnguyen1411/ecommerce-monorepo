package handlers

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"path/filepath"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

var allowedImageMIMEByExt = map[string]string{
	".jpg":  "image/jpeg",
	".jpeg": "image/jpeg",
	".png":  "image/png",
	".webp": "image/webp",
}

func (s *Server) saveValidatedImageUpload(c *gin.Context, file *multipart.FileHeader, prefix string) (string, bool) {
	if !s.enforceUploadSize(c, file.Size) {
		return "", false
	}

	ext := strings.ToLower(filepath.Ext(strings.TrimSpace(file.Filename)))
	expectedMIME, allowedExt := allowedImageMIMEByExt[ext]
	if !allowedExt {
		respondError(c, http.StatusBadRequest, "invalid_file_type", "Unsupported file extension")
		return "", false
	}

	src, err := file.Open()
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_file", "Failed to read uploaded file")
		return "", false
	}
	defer src.Close()

	header := make([]byte, 512)
	n, readErr := io.ReadFull(src, header)
	if readErr != nil && readErr != io.EOF && readErr != io.ErrUnexpectedEOF {
		respondError(c, http.StatusBadRequest, "invalid_file", "Failed to inspect uploaded file")
		return "", false
	}
	if n == 0 {
		respondError(c, http.StatusBadRequest, "invalid_file", "Uploaded file is empty")
		return "", false
	}

	detectedMIME := strings.ToLower(strings.TrimSpace(http.DetectContentType(header[:n])))
	if detectedMIME != expectedMIME {
		respondError(c, http.StatusBadRequest, "invalid_file_type", "Uploaded file type does not match file extension")
		return "", false
	}

	randomSuffix, err := randomHex(8)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "upload_error", "Failed to allocate upload filename")
		return "", false
	}

	filename := fmt.Sprintf("%s_%d_%s%s", prefix, time.Now().Unix(), randomSuffix, ext)
	path := filepath.Join(s.Config.UploadDir, filename)
	if err := c.SaveUploadedFile(file, path); err != nil {
		respondError(c, http.StatusInternalServerError, "upload_error", "Failed to save uploaded file")
		return "", false
	}

	return "/uploads/" + filename, true
}

func randomHex(bytesLen int) (string, error) {
	raw := make([]byte, bytesLen)
	if _, err := rand.Read(raw); err != nil {
		return "", err
	}
	return hex.EncodeToString(raw), nil
}
