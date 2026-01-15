package handlers

import (
	"database/sql"
)

type userAuthRecord struct {
	ID                  int
	Email               sql.NullString
	PhoneE164           sql.NullString
	PhoneNational       sql.NullString
	FullName            sql.NullString
	AvatarURL           sql.NullString
	Address             sql.NullString
	Birthdate           sql.NullTime
	IsEmailVerified     bool
	IsPhoneVerified     bool
	Status              string
	PasswordHash        sql.NullString
	FailedLoginAttempts int
	LockedUntil         sql.NullTime
}

type AuthUserResponse struct {
	ID              int     `json:"id"`
	Email           *string `json:"email,omitempty"`
	Phone           *string `json:"phone,omitempty"`
	FullName        *string `json:"full_name,omitempty"`
	AvatarURL       *string `json:"avatar_url,omitempty"`
	Address         *string `json:"address,omitempty"`
	Birthdate       *string `json:"birthdate,omitempty"`
	IsEmailVerified bool    `json:"is_email_verified"`
	IsPhoneVerified bool    `json:"is_phone_verified"`
	Status          string  `json:"status"`
}

func (s *Server) loadUserByID(userID int) (*userAuthRecord, error) {
	row := s.DB.QueryRow(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until
    FROM users
    WHERE id = ?
  `, userID)
	return scanUserAuthRecord(row)
}

func (s *Server) loadUserByEmail(email string) (*userAuthRecord, error) {
	row := s.DB.QueryRow(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until
    FROM users
    WHERE email = ?
    LIMIT 1
  `, email)
	return scanUserAuthRecord(row)
}

func (s *Server) loadUserByPhone(phoneE164 string) (*userAuthRecord, error) {
	row := s.DB.QueryRow(`
    SELECT id, email, phone_e164, phone_national, full_name, avatar_url, address, birthdate,
           is_email_verified, is_phone_verified, status, password_hash, failed_login_attempts, locked_until
    FROM users
    WHERE phone_e164 = ?
    LIMIT 1
  `, phoneE164)
	return scanUserAuthRecord(row)
}

func scanUserAuthRecord(row *sql.Row) (*userAuthRecord, error) {
	var user userAuthRecord
	if err := row.Scan(
		&user.ID,
		&user.Email,
		&user.PhoneE164,
		&user.PhoneNational,
		&user.FullName,
		&user.AvatarURL,
		&user.Address,
		&user.Birthdate,
		&user.IsEmailVerified,
		&user.IsPhoneVerified,
		&user.Status,
		&user.PasswordHash,
		&user.FailedLoginAttempts,
		&user.LockedUntil,
	); err != nil {
		return nil, err
	}
	return &user, nil
}

func authUserResponse(user *userAuthRecord) AuthUserResponse {
	return AuthUserResponse{
		ID:              user.ID,
		Email:           nullStringPtr(user.Email),
		Phone:           preferredPhone(user),
		FullName:        nullStringPtr(user.FullName),
		AvatarURL:       nullStringPtr(user.AvatarURL),
		Address:         nullStringPtr(user.Address),
		Birthdate:       datePtr(user.Birthdate),
		IsEmailVerified: user.IsEmailVerified,
		IsPhoneVerified: user.IsPhoneVerified,
		Status:          user.Status,
	}
}

func nullStringPtr(value sql.NullString) *string {
	if !value.Valid {
		return nil
	}
	return &value.String
}

func preferredPhone(user *userAuthRecord) *string {
	if user.PhoneNational.Valid {
		return &user.PhoneNational.String
	}
	if user.PhoneE164.Valid {
		return &user.PhoneE164.String
	}
	return nil
}

func datePtr(value sql.NullTime) *string {
	if !value.Valid {
		return nil
	}
	formatted := value.Time.Format("2006-01-02")
	return &formatted
}
