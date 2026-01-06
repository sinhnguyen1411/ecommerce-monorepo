package handlers

import (
	"database/sql"
	"net/http"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type AdminQnA struct {
	ID        int    `json:"id"`
	Question  string `json:"question"`
	Answer    string `json:"answer"`
	Status    string `json:"status"`
	SortOrder int    `json:"sort_order"`
}

type AdminQnAInput struct {
	Question  string `json:"question"`
	Answer    string `json:"answer"`
	Status    string `json:"status"`
	SortOrder int    `json:"sort_order"`
}

func (s *Server) AdminListQnA(c *gin.Context) {
	rows, err := s.DB.Query(`SELECT id, question, IFNULL(answer, ''), status, sort_order FROM qna ORDER BY sort_order ASC, created_at DESC`)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load QnA")
		return
	}
	defer rows.Close()

	items := make([]AdminQnA, 0)
	for rows.Next() {
		var item AdminQnA
		if err := rows.Scan(&item.ID, &item.Question, &item.Answer, &item.Status, &item.SortOrder); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse QnA")
			return
		}
		items = append(items, item)
	}

	respondOK(c, items)
}

func (s *Server) AdminCreateQnA(c *gin.Context) {
	var input AdminQnAInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid QnA payload")
		return
	}

	if strings.TrimSpace(input.Question) == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Question is required")
		return
	}

	status := input.Status
	if status == "" {
		status = "published"
	}

	result, err := s.DB.Exec(`INSERT INTO qna (question, answer, status, sort_order) VALUES (?, ?, ?, ?)`, input.Question, input.Answer, status, input.SortOrder)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to create QnA")
		return
	}

	id, _ := result.LastInsertId()
	s.adminGetQnAByID(c, int(id))
}

func (s *Server) AdminGetQnA(c *gin.Context) {
	parsed, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_qna", "Invalid QnA ID")
		return
	}
	s.adminGetQnAByID(c, parsed)
}

func (s *Server) adminGetQnAByID(c *gin.Context, id int) {
	row := s.DB.QueryRow(`SELECT id, question, IFNULL(answer, ''), status, sort_order FROM qna WHERE id = ?`, id)
	var item AdminQnA
	if err := row.Scan(&item.ID, &item.Question, &item.Answer, &item.Status, &item.SortOrder); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusNotFound, "not_found", "QnA not found")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load QnA")
		return
	}

	respondOK(c, item)
}

func (s *Server) AdminUpdateQnA(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_qna", "Invalid QnA ID")
		return
	}

	var input AdminQnAInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid QnA payload")
		return
	}

	status := input.Status
	if status == "" {
		status = "published"
	}

	_, err = s.DB.Exec(`UPDATE qna SET question = ?, answer = ?, status = ?, sort_order = ? WHERE id = ?`, input.Question, input.Answer, status, input.SortOrder, id)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update QnA")
		return
	}

	s.adminGetQnAByID(c, id)
}

func (s *Server) AdminDeleteQnA(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_qna", "Invalid QnA ID")
		return
	}

	if _, err := s.DB.Exec(`DELETE FROM qna WHERE id = ?`, id); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to delete QnA")
		return
	}

	respondOK(c, gin.H{"deleted": true})
}
