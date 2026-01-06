package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
)

type Location struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Province string `json:"province"`
	District string `json:"district"`
	Address  string `json:"address"`
	Phone    string `json:"phone"`
	Hours    string `json:"hours"`
}

func (s *Server) ListLocations(c *gin.Context) {
	rows, err := s.DB.Query(`
    SELECT id, name, province, district, IFNULL(address, ''), IFNULL(phone, ''), IFNULL(hours, '')
    FROM locations
    ORDER BY sort_order ASC, name ASC
  `)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load locations")
		return
	}
	defer rows.Close()

	locations := make([]Location, 0)
	for rows.Next() {
		var location Location
		if err := rows.Scan(&location.ID, &location.Name, &location.Province, &location.District, &location.Address, &location.Phone, &location.Hours); err != nil {
			respondError(c, http.StatusInternalServerError, "db_error", "Failed to parse locations")
			return
		}
		locations = append(locations, location)
	}

	respondOK(c, locations)
}
