-- flag source
CREATE TYPE flag_source AS ENUM ('ML', 'USER', 'MODERATOR');

-- flag
CREATE TABLE flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  source flag_source NOT NULL,
  confidence FLOAT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_flags_post_id ON flags(post_id);