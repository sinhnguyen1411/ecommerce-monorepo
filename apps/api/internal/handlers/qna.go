package handlers

import (
  "net/http"

  "github.com/gin-gonic/gin"
)

type QnA struct {
  ID       int    `json:"id"`
  Question string `json:"question"`
  Answer   string `json:"answer"`
}

func (s *Server) ListQnA(c *gin.Context) {
  rows, err := s.DB.Query(`
    SELECT id, question, IFNULL(answer, '')
    FROM qna
    WHERE status = 'published'
    ORDER BY sort_order ASC, id ASC
  `)
  if err != nil {
    respondError(c, http.StatusInternalServerError, "db_error", "Failed to load Q&A")
    return
  }
  defer rows.Close()

  items := make([]QnA, 0)
  for rows.Next() {
    var item QnA
    if err := rows.Scan(&item.ID, &item.Question, &item.Answer); err != nil {
      respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse Q&A")
      return
    }
    items = append(items, item)
  }

  respondOK(c, items)
}
