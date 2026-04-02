-- post status
CREATE TYPE post_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'FLAGGED');

-- posts
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  text TEXT,
  media_url TEXT,
  status post_status DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_approved_created ON posts(created_at DESC) WHERE status = 'APPROVED';

-- extra
ALTER TABLE posts ADD CONSTRAINT content_check CHECK (text IS NOT NULL OR image_url IS NOT NULL);