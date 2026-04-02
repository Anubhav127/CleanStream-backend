-- moderation results
CREATE TABLE moderation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  toxicity_score FLOAT,
  nsfw_score FLOAT,
  misinfo_score FLOAT,
  labels JSONB,
  model_version TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_moderation_post_id ON moderation_results(post_id);