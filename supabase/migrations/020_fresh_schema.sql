-- Fresh Project Hub Schema - Complete Reset

-- Drop all existing objects
DROP TRIGGER IF EXISTS task_change_trigger ON tasks;
DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP FUNCTION IF EXISTS log_task_change();
DROP FUNCTION IF EXISTS update_updated_at();

DROP INDEX IF EXISTS idx_captures_processed;
DROP INDEX IF EXISTS idx_activity_created;
DROP INDEX IF EXISTS idx_activity_project;
DROP INDEX IF EXISTS idx_checklist_type;
DROP INDEX IF EXISTS idx_checklist_project;
DROP INDEX IF EXISTS idx_tasks_status;
DROP INDEX IF EXISTS idx_tasks_assignee;
DROP INDEX IF EXISTS idx_tasks_project;

DROP TABLE IF EXISTS quick_captures CASCADE;
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS checklist_items CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS brain_items CASCADE;
DROP TABLE IF EXISTS brain_activity CASCADE;
DROP TABLE IF EXISTS brain_attachments CASCADE;

-- =============================================
-- PROJECTS
-- =============================================
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  github_url TEXT,
  live_url TEXT,
  vercel_url TEXT,
  color TEXT DEFAULT 'blue',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed projects
INSERT INTO projects (id, name, description, github_url, live_url, color, position) VALUES
  ('xthread', 'xthread', 'AI content assistant for X', 'https://github.com/spencermyers223/threadsmith', 'https://xthread.io', 'emerald', 0),
  ('nomad-research', 'Nomad Research', 'Crypto research community', 'https://github.com/spencermyers223/nomad-website', 'https://nomadresearch.io', 'purple', 1),
  ('winfirst', 'WinFirst', 'Habit tracking app with app blocking', 'https://github.com/spencermyers223/winfirst', NULL, 'orange', 2);

-- =============================================
-- TASKS
-- =============================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  description TEXT,
  
  assignee TEXT NOT NULL CHECK (assignee IN ('spencer', 'clawdbot')),
  priority TEXT NOT NULL DEFAULT 'P2' CHECK (priority IN ('P1', 'P2', 'P3')),
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in-progress', 'needs-review', 'done')),
  
  autonomy TEXT DEFAULT 'do-then-review' CHECK (autonomy IN ('full', 'do-then-review', 'discuss-first')),
  estimated_minutes INTEGER,
  due_date DATE,
  
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_project ON tasks(project_id);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_tasks_status ON tasks(status);

-- =============================================
-- CHECKLIST ITEMS
-- =============================================
CREATE TABLE checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('short-term', 'long-term')),
  
  due_date DATE,
  completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_checklist_project ON checklist_items(project_id);
CREATE INDEX idx_checklist_type ON checklist_items(type);

-- =============================================
-- ACTIVITY LOG
-- =============================================
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  
  actor TEXT NOT NULL CHECK (actor IN ('spencer', 'clawdbot')),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_title TEXT,
  details TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_project ON activity_log(project_id);
CREATE INDEX idx_activity_created ON activity_log(created_at DESC);

-- =============================================
-- QUICK CAPTURES (Inbox)
-- =============================================
CREATE TABLE quick_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  project_id TEXT REFERENCES projects(id) ON DELETE SET NULL,
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_captures_processed ON quick_captures(processed);

-- =============================================
-- TRIGGERS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-log task status changes
CREATE OR REPLACE FUNCTION log_task_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (project_id, actor, action, target_type, target_id, target_title)
    VALUES (NEW.project_id, NEW.assignee, 'created task', 'task', NEW.id::text, NEW.title);
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO activity_log (project_id, actor, action, target_type, target_id, target_title, details)
    VALUES (NEW.project_id, NEW.assignee, 'moved task to ' || NEW.status, 'task', NEW.id::text, NEW.title, OLD.status || ' → ' || NEW.status);
    
    IF NEW.status = 'done' AND OLD.status != 'done' THEN
      NEW.completed_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_change_trigger
  BEFORE INSERT OR UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION log_task_change();
