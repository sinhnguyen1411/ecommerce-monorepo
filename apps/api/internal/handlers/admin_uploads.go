package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

func (s *Server) AdminUpload(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		respondError(c, http.StatusBadRequest, "missing_file", "Upload file is required")
		return
	}
	url, ok := s.saveValidatedImageUpload(c, file, "admin")
	if !ok {
		return
	}
	respondOK(c, gin.H{"url": s.buildAssetURL(url)})
}
