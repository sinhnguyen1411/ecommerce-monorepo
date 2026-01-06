package handlers

import (
	"fmt"
	"net/http"
	"path/filepath"
	"time"

	"github.com/gin-gonic/gin"
)

func (s *Server) AdminUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "missing_file", "Upload file is required")
		return
	}

	extension := filepath.Ext(file.Filename)
	filename := fmt.Sprintf("admin_%d%s", time.Now().UnixNano(), extension)
	path := filepath.Join(s.Config.UploadDir, filename)

	if err := c.SaveUploadedFile(file, path); err != nil {
		respondError(c, http.StatusInternalServerError, "upload_error", "Failed to save file")
		return
	}

	url := "/uploads/" + filename
	respondOK(c, gin.H{"url": s.buildAssetURL(url)})
}
