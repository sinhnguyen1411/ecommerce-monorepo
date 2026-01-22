package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

const geoBaseURL = "https://provinces.open-api.vn/api"

type geoProvince struct {
	Code      int           `json:"code"`
	Name      string        `json:"name"`
	Districts []geoDistrict `json:"districts"`
}

type geoDistrict struct {
	Code int    `json:"code"`
	Name string `json:"name"`
}

type geoProvinceResponse struct {
	Code int    `json:"code"`
	Name string `json:"name"`
}

type geoDistrictResponse struct {
	Code int    `json:"code"`
	Name string `json:"name"`
}

func (s *Server) ListProvinces(c *gin.Context) {
	data, err := s.loadGeoData()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "geo_error", "Failed to load provinces")
		return
	}

	items := make([]geoProvinceResponse, 0, len(data))
	for _, province := range data {
		items = append(items, geoProvinceResponse{
			Code: province.Code,
			Name: province.Name,
		})
	}

	respondOK(c, items)
}

func (s *Server) ListDistricts(c *gin.Context) {
	codeRaw := strings.TrimSpace(c.Query("province_code"))
	if codeRaw == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Province code is required")
		return
	}
	code, err := strconv.Atoi(codeRaw)
	if err != nil {
		respondError(c, http.StatusBadRequest, "invalid_province", "Province code is invalid")
		return
	}

	data, err := s.loadGeoData()
	if err != nil {
		respondError(c, http.StatusInternalServerError, "geo_error", "Failed to load districts")
		return
	}

	for _, province := range data {
		if province.Code != code {
			continue
		}
		items := make([]geoDistrictResponse, 0, len(province.Districts))
		for _, district := range province.Districts {
			items = append(items, geoDistrictResponse{
				Code: district.Code,
				Name: district.Name,
			})
		}
		respondOK(c, items)
		return
	}

	respondError(c, http.StatusNotFound, "not_found", "Province not found")
}

func (s *Server) resolveProvinceDistrict(provinceInput, districtInput string) (string, string, error) {
	provinceKey := strings.TrimSpace(provinceInput)
	districtKey := strings.TrimSpace(districtInput)
	if provinceKey == "" && districtKey == "" {
		return "", "", nil
	}
	if provinceKey == "" {
		return "", "", errors.New("province required")
	}

	data, err := s.loadGeoData()
	if err != nil {
		return "", "", err
	}

	province, ok := findProvince(data, provinceKey)
	if !ok {
		return "", "", errors.New("invalid province")
	}

	if districtKey == "" {
		return province.Name, "", nil
	}

	district, ok := findDistrict(province, districtKey)
	if !ok {
		return "", "", errors.New("invalid district")
	}

	return province.Name, district.Name, nil
}

func (s *Server) loadGeoData() ([]geoProvince, error) {
	s.geoMu.Lock()
	if time.Now().Before(s.geoExpiresAt) && len(s.geoData) > 0 {
		cached := s.geoData
		s.geoMu.Unlock()
		return cached, nil
	}
	s.geoMu.Unlock()

	client := &http.Client{Timeout: 10 * time.Second}
	resp, err := client.Get(geoBaseURL + "/?depth=2")
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, errors.New("geo source unavailable")
	}

	var payload []geoProvince
	if err := json.NewDecoder(resp.Body).Decode(&payload); err != nil {
		return nil, err
	}

	s.geoMu.Lock()
	s.geoData = payload
	s.geoExpiresAt = time.Now().Add(24 * time.Hour)
	s.geoMu.Unlock()

	return payload, nil
}

func findProvince(provinces []geoProvince, key string) (geoProvince, bool) {
	if code, err := strconv.Atoi(key); err == nil {
		for _, province := range provinces {
			if province.Code == code {
				return province, true
			}
		}
	}
	needle := strings.ToLower(strings.TrimSpace(key))
	for _, province := range provinces {
		if strings.ToLower(strings.TrimSpace(province.Name)) == needle {
			return province, true
		}
	}
	return geoProvince{}, false
}

func findDistrict(province geoProvince, key string) (geoDistrict, bool) {
	if code, err := strconv.Atoi(key); err == nil {
		for _, district := range province.Districts {
			if district.Code == code {
				return district, true
			}
		}
	}
	needle := strings.ToLower(strings.TrimSpace(key))
	for _, district := range province.Districts {
		if strings.ToLower(strings.TrimSpace(district.Name)) == needle {
			return district, true
		}
	}
	return geoDistrict{}, false
}
