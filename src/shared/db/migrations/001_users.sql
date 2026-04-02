-- roles
CREATE TYPE user_role AS ENUM ('USER', 'MODERATOR', 'ADMIN');

-- users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role user_role DEFAULT 'USER',
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_users_email ON users(email);

-- extra
ALTER TABLE users ADD CONSTRAINT email_format CHECK (email ~* '^[^@]+@[^@]+\.[^@]+$');