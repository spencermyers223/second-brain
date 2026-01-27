CREATE TABLE IF NOT EXISTS brain_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('ideas', 'tasks', 'research', 'content-drafts', 'shipped', 'learnings')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  status TEXT NOT NULL DEFAULT 'backlog' CHECK (status IN ('backlog', 'in-progress', 'review-needed', 'done')),
  project TEXT NOT NULL DEFAULT 'general' CHECK (project IN ('xthread', 'nomad-research', 'general')),
  tags TEXT[] DEFAULT '{}',
  position INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS brain_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES brain_items(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_brain_items_status ON brain_items(status);
CREATE INDEX idx_brain_items_category ON brain_items(category);
CREATE INDEX idx_brain_items_project ON brain_items(project);
CREATE INDEX idx_brain_activity_created ON brain_activity(created_at DESC);
