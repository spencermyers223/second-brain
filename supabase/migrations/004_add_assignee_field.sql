ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS assignee TEXT NOT NULL DEFAULT 'jarvis' CHECK (assignee IN ('spencer', 'jarvis', 'both'));
