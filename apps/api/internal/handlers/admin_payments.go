package handlers

import (
	"database/sql"
	"net/http"

	"github.com/gin-gonic/gin"
)

type PaymentSettings struct {
	ID                  int    `json:"id"`
	CODEnabled          bool   `json:"cod_enabled"`
	BankTransferEnabled bool   `json:"bank_transfer_enabled"`
	BankQREnabled       bool   `json:"bank_qr_enabled"`
	BankName            string `json:"bank_name"`
	BankAccount         string `json:"bank_account"`
	BankHolder          string `json:"bank_holder"`
	BankQRPayload       string `json:"bank_qr_payload"`
}

func (s *Server) AdminGetPaymentSettings(c *gin.Context) {
	row := s.DB.QueryRow(`SELECT id, cod_enabled, bank_transfer_enabled, bank_qr_enabled, IFNULL(bank_name, ''), IFNULL(bank_account, ''), IFNULL(bank_holder, ''), IFNULL(bank_qr_payload, '') FROM payment_settings LIMIT 1`)
	var settings PaymentSettings
	if err := row.Scan(&settings.ID, &settings.CODEnabled, &settings.BankTransferEnabled, &settings.BankQREnabled, &settings.BankName, &settings.BankAccount, &settings.BankHolder, &settings.BankQRPayload); err != nil {
		if err == sql.ErrNoRows {
			respondOK(c, PaymentSettings{
				ID:                  1,
				CODEnabled:          true,
				BankTransferEnabled: true,
				BankQREnabled:       true,
			})
			return
		}
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to load payment settings")
		return
	}

	respondOK(c, settings)
}

func (s *Server) AdminUpdatePaymentSettings(c *gin.Context) {
	var input PaymentSettings
	if err := c.ShouldBindJSON(&input); err != nil {
		respondError(c, http.StatusBadRequest, "invalid_payload", "Invalid payment settings payload")
		return
	}

	if input.ID == 0 {
		input.ID = 1
	}

	_, err := s.DB.Exec(`
    INSERT INTO payment_settings (id, cod_enabled, bank_transfer_enabled, bank_qr_enabled, bank_name, bank_account, bank_holder, bank_qr_payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      cod_enabled = VALUES(cod_enabled),
      bank_transfer_enabled = VALUES(bank_transfer_enabled),
      bank_qr_enabled = VALUES(bank_qr_enabled),
      bank_name = VALUES(bank_name),
      bank_account = VALUES(bank_account),
      bank_holder = VALUES(bank_holder),
      bank_qr_payload = VALUES(bank_qr_payload)
  `, input.ID, input.CODEnabled, input.BankTransferEnabled, input.BankQREnabled, input.BankName, input.BankAccount, input.BankHolder, input.BankQRPayload)
	if err != nil {
		respondError(c, http.StatusInternalServerError, "db_error", "Failed to update payment settings")
		return
	}

	s.AdminGetPaymentSettings(c)
}
