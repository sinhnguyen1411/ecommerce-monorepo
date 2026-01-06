INSERT INTO payment_settings (id, cod_enabled, bank_transfer_enabled, bank_qr_enabled, bank_name, bank_account, bank_holder, bank_qr_payload)
VALUES (1, TRUE, TRUE, TRUE, 'Vietcombank', '0123456789', 'TTC ECOMMERCE', 'BANK|Vietcombank|0123456789|AMOUNT|ORDER')
ON DUPLICATE KEY UPDATE
  cod_enabled = VALUES(cod_enabled),
  bank_transfer_enabled = VALUES(bank_transfer_enabled),
  bank_qr_enabled = VALUES(bank_qr_enabled),
  bank_name = VALUES(bank_name),
  bank_account = VALUES(bank_account),
  bank_holder = VALUES(bank_holder),
  bank_qr_payload = VALUES(bank_qr_payload);

INSERT INTO admin_users (email, password_hash, name, role)
VALUES ('admin@ttc.local', '$2a$10$Dmph.exDlZGD0Mi4o7mZsOqsY1zBQlwO5.Ux6whYCeDF679zM35qa', 'TTC Admin', 'admin')
ON DUPLICATE KEY UPDATE
  name = VALUES(name),
  role = VALUES(role);
