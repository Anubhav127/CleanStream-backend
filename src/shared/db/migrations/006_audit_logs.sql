-- audit_logs
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- indexes
CREATE INDEX idx_audit_post_id ON audit_logs(post_id);