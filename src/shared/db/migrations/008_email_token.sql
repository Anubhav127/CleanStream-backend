-- email token
CREATE TABLE email_token (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  email_verification_token VARCHAR(255),
  email_verification_expiry TIMESTAMP,
  password_reset_token VARCHAR(255),
  password_reset_expiry TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_email_token_user_id ON email_token(user_id);
