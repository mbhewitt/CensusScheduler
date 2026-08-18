-- Add a 'text' QR type (#661): a plain-text QR whose payload is arbitrary text
-- (no URL/scheme required). Extends the qr_type enum from 011_qr_codes_registry.
ALTER TABLE op_qr_codes
  MODIFY qr_type ENUM('calendar', 'link', 'wifi', 'text') NOT NULL;
