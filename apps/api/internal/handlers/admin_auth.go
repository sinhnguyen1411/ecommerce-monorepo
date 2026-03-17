package handlers

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type AdminLoginInput struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AdminProfile struct {
	ID            int                `json:"id"`
	Email         string             `json:"email"`
	Name          string             `json:"name"`
	Role          string             `json:"role"`
	NavOrder      []string           `json:"nav_order,omitempty"`
	UIPreferences AdminUIPreferences `json:"ui_preferences"`
}

type AdminUIPreferences struct {
	SidebarMode  string   `json:"sidebar_mode"`
	Density      string   `json:"density"`
	OrdersColumn []string `json:"orders_columns"`
}

type AdminPreferencesInput struct {
	NavOrder      []string            `json:"nav_order"`
	UIPreferences *AdminUIPreferences `json:"ui_preferences,omitempty"`
}

var adminNavDefaultOrder = []string{
	"home",
	"products",
	"categories",
	"posts",
	"about",
	"qna",
	"orders",
	"payments",
	"contact",
}

var adminNavAllowedSet = func() map[string]struct{} {
	result := make(map[string]struct{}, len(adminNavDefaultOrder))
	for _, item := range adminNavDefaultOrder {
		result[item] = struct{}{}
	}
	return result
}()

var adminUISidebarModes = map[string]struct{}{
	"rail": {},
	"full": {},
}

var adminUIDensityModes = map[string]struct{}{
	"compact":     {},
	"comfortable": {},
}

var adminOrdersColumnDefault = []string{
	"order",
	"customer",
	"total",
	"payment",
	"delivery",
	"actions",
}

var adminOrdersColumnAllowedSet = func() map[string]struct{} {
	result := make(map[string]struct{}, len(adminOrdersColumnDefault)+2)
	for _, column := range adminOrdersColumnDefault {
		result[column] = struct{}{}
	}
	result["payment_method"] = struct{}{}
	result["shipping_method"] = struct{}{}
	return result
}()

func defaultAdminNavOrder() []string {
	next := make([]string, len(adminNavDefaultOrder))
	copy(next, adminNavDefaultOrder)
	return next
}

func defaultAdminOrdersColumns() []string {
	next := make([]string, len(adminOrdersColumnDefault))
	copy(next, adminOrdersColumnDefault)
	return next
}

func defaultAdminUIPreferences() AdminUIPreferences {
	return AdminUIPreferences{
		SidebarMode:  "rail",
		Density:      "compact",
		OrdersColumn: defaultAdminOrdersColumns(),
	}
}

func normalizeAdminNavOrder(items []string) []string {
	seen := make(map[string]struct{}, len(adminNavDefaultOrder))
	next := make([]string, 0, len(adminNavDefaultOrder))

	for _, raw := range items {
		id := strings.TrimSpace(raw)
		if id == "" || id == "overview" {
			continue
		}
		if _, allowed := adminNavAllowedSet[id]; !allowed {
			continue
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		next = append(next, id)
	}

	for _, id := range adminNavDefaultOrder {
		if _, exists := seen[id]; exists {
			continue
		}
		next = append(next, id)
	}

	return next
}

func normalizeAdminOrdersColumns(items []string) []string {
	if len(items) == 0 {
		return defaultAdminOrdersColumns()
	}

	seen := make(map[string]struct{}, len(adminOrdersColumnAllowedSet))
	next := make([]string, 0, len(items))

	for _, raw := range items {
		id := strings.TrimSpace(strings.ToLower(raw))
		if _, allowed := adminOrdersColumnAllowedSet[id]; !allowed {
			continue
		}
		if _, exists := seen[id]; exists {
			continue
		}
		seen[id] = struct{}{}
		next = append(next, id)
	}

	for _, id := range adminOrdersColumnDefault {
		if _, exists := seen[id]; exists {
			continue
		}
		next = append(next, id)
	}

	return next
}

func normalizeAdminUIPreferences(input *AdminUIPreferences) AdminUIPreferences {
	prefs := defaultAdminUIPreferences()
	if input == nil {
		return prefs
	}

	mode := strings.TrimSpace(strings.ToLower(input.SidebarMode))
	if _, ok := adminUISidebarModes[mode]; ok {
		prefs.SidebarMode = mode
	}

	density := strings.TrimSpace(strings.ToLower(input.Density))
	if _, ok := adminUIDensityModes[density]; ok {
		prefs.Density = density
	}

	prefs.OrdersColumn = normalizeAdminOrdersColumns(input.OrdersColumn)
	return prefs
}

func parseAdminNavOrder(raw sql.NullString) []string {
	if !raw.Valid || strings.TrimSpace(raw.String) == "" {
		return defaultAdminNavOrder()
	}

	decoded := make([]string, 0)
	if err := json.Unmarshal([]byte(raw.String), &decoded); err != nil {
		return defaultAdminNavOrder()
	}
	return normalizeAdminNavOrder(decoded)
}

func parseAdminUIPreferences(raw sql.NullString) AdminUIPreferences {
	if !raw.Valid || strings.TrimSpace(raw.String) == "" {
		return defaultAdminUIPreferences()
	}

	var decoded AdminUIPreferences
	if err := json.Unmarshal([]byte(raw.String), &decoded); err != nil {
		return defaultAdminUIPreferences()
	}

	return normalizeAdminUIPreferences(&decoded)
}

func (s *Server) loadAdminProfileByID(adminID int) (AdminProfile, error) {
	row := s.DB.QueryRow(`
    SELECT id, email, name, role, CAST(IFNULL(nav_order_json, '[]') AS CHAR), CAST(IFNULL(ui_preferences_json, '{}') AS CHAR)
    FROM admin_users
    WHERE id = ?
  `, adminID)
	var admin AdminProfile
	var navOrderRaw sql.NullString
	var uiPrefsRaw sql.NullString
	if err := row.Scan(&admin.ID, &admin.Email, &admin.Name, &admin.Role, &navOrderRaw, &uiPrefsRaw); err != nil {
		return AdminProfile{}, err
	}
	admin.NavOrder = parseAdminNavOrder(navOrderRaw)
	admin.UIPreferences = parseAdminUIPreferences(uiPrefsRaw)
	return admin, nil
}

func (s *Server) AdminLogin(c *gin.Context) {
	var input AdminLoginInput
	if !s.bindJSONWithLimit(c, &input, "Invalid login payload") {
		return
	}

	email := strings.TrimSpace(strings.ToLower(input.Email))
	if email == "" || input.Password == "" {
		respondError(c, http.StatusBadRequest, "missing_fields", "Email and password are required")
		return
	}

	ipKey := rateLimitKey("admin_login:ip", c.ClientIP())
	if !s.enforceRateLimit(c, ipKey, s.Config.LoginIPRateLimitMax, s.Config.LoginIPRateLimitWindow, "login_rate_limited", "Too many login attempts") {
		return
	}

	emailKey := rateLimitKey("admin_login:email", hashIdentifier(email))
	if !s.enforceRateLimit(c, emailKey, s.Config.LoginIDRateLimitMax, s.Config.LoginIDRateLimitWindow, "login_rate_limited", "Too many login attempts") {
		return
	}

	var admin AdminProfile
	var hash string
	var failedAttempts int
	var lockedUntil sql.NullTime
	var navOrderRaw sql.NullString
	var uiPrefsRaw sql.NullString
	row := s.DB.QueryRow(`
    SELECT id, email, name, role, password_hash, failed_login_attempts, locked_until, CAST(IFNULL(nav_order_json, '[]') AS CHAR), CAST(IFNULL(ui_preferences_json, '{}') AS CHAR)
    FROM admin_users
    WHERE email = ?
  `, email)
	if err := row.Scan(&admin.ID, &admin.Email, &admin.Name, &admin.Role, &hash, &failedAttempts, &lockedUntil, &navOrderRaw, &uiPrefsRaw); err != nil {
		if err == sql.ErrNoRows {
			respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load admin")
		return
	}
	admin.NavOrder = parseAdminNavOrder(navOrderRaw)
	admin.UIPreferences = parseAdminUIPreferences(uiPrefsRaw)

	if lockedUntil.Valid && lockedUntil.Time.After(time.Now()) {
		retryAfter := time.Until(lockedUntil.Time)
		if retryAfter > 0 {
			c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
		}
		respondErrorWithRetryAt(c, http.StatusTooManyRequests, "account_locked", "Account is temporarily locked", lockedUntil.Time)
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(input.Password)); err != nil {
		attempts := failedAttempts + 1
		var newLockedUntil sql.NullTime
		if s.Config.LoginMaxAttempts > 0 && attempts >= s.Config.LoginMaxAttempts {
			lockTime := time.Now().Add(s.Config.LoginLockoutDuration)
			newLockedUntil = sql.NullTime{Time: lockTime, Valid: true}
			if retryAfter := time.Until(lockTime); retryAfter > 0 {
				c.Header("Retry-After", strconv.Itoa(int(retryAfter.Seconds())))
			}
			_, _ = s.DB.Exec(`UPDATE admin_users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?`, attempts, newLockedUntil, admin.ID)
			respondErrorWithRetryAt(c, http.StatusTooManyRequests, "account_locked", "Account is temporarily locked", lockTime)
			return
		}

		_, _ = s.DB.Exec(`UPDATE admin_users SET failed_login_attempts = ?, locked_until = NULL WHERE id = ?`, attempts, admin.ID)
		if s.Config.LoginWarnAttempts > 0 && attempts >= s.Config.LoginWarnAttempts {
			respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials. Too many failed attempts may temporarily lock your account.")
			return
		}
		respondError(c, http.StatusUnauthorized, "invalid_credentials", "Invalid credentials")
		return
	}

	if _, err := s.DB.Exec(`UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = ? WHERE id = ?`, time.Now(), admin.ID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update admin login state")
		return
	}

	token, err := s.signToken(admin.ID, "admin", s.Config.AdminTokenTTL)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "token_error", "Failed to issue token")
		return
	}
	s.setAdminCookie(c, token)

	respondOK(c, gin.H{"token": token, "admin": admin})
}

func (s *Server) AdminMe(c *gin.Context) {
	adminID := c.MustGet("user_id").(int)
	admin, err := s.loadAdminProfileByID(adminID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load admin")
		return
	}

	respondOK(c, admin)
}

func (s *Server) AdminUpdatePreferences(c *gin.Context) {
	adminID := c.MustGet("user_id").(int)

	var input AdminPreferencesInput
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid admin preferences payload")
		return
	}

	currentAdmin, err := s.loadAdminProfileByID(adminID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load admin preferences")
		return
	}

	normalizedNav := currentAdmin.NavOrder
	if input.NavOrder != nil {
		normalizedNav = normalizeAdminNavOrder(input.NavOrder)
	}

	navPayload, err := json.Marshal(normalizedNav)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "serialization_error", "Failed to serialize admin preferences")
		return
	}

	uiPrefs := currentAdmin.UIPreferences
	if input.UIPreferences != nil {
		uiPrefs = normalizeAdminUIPreferences(input.UIPreferences)
	}
	uiPayload, err := json.Marshal(uiPrefs)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "serialization_error", "Failed to serialize admin preferences")
		return
	}

	if _, err := s.DB.Exec(`UPDATE admin_users SET nav_order_json = ?, ui_preferences_json = ? WHERE id = ?`, string(navPayload), string(uiPayload), adminID); err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update admin preferences")
		return
	}

	admin, err := s.loadAdminProfileByID(adminID)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load admin")
		return
	}

	respondOK(c, admin)
}

func (s *Server) AdminLogout(c *gin.Context) {
	s.clearAdminCookie(c)
	respondOK(c, gin.H{"logged_out": true})
}
