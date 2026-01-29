-- Task Comments for review workflow
CREATE TABLE task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE NOT NULL,
  author TEXT NOT NULL CHECK (author IN ('spencer', 'clawdbot')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_task ON task_comments(task_id);
CREATE INDEX idx_comments_created ON task_comments(created_at);

-- Log comment activity
CREATE OR REPLACE FUNCTION log_comment()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO activity_log (project_id, actor, action, target_type, target_id, target_title, details)
  SELECT t.project_id, NEW.author, 'commented on', 'task', NEW.task_id::text, t.title, LEFT(NEW.content, 100)
  FROM tasks t WHERE t.id = NEW.task_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER comment_log_trigger
  AFTER INSERT ON task_comments
  FOR EACH ROW EXECUTE FUNCTION log_comment();
