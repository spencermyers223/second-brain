-- Add archived_at column for soft-archiving completed items
ALTER TABLE brain_items ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- Archive all done and rejected items (they'll be hidden from main view)
UPDATE brain_items 
SET archived_at = NOW() 
WHERE status IN ('done', 'rejected') AND archived_at IS NULL;

-- Add winfirst project
ALTER TABLE brain_items 
DROP CONSTRAINT IF EXISTS brain_items_project_check;

ALTER TABLE brain_items 
ADD CONSTRAINT brain_items_project_check 
CHECK (project IN ('xthread', 'nomad-research', 'general', 'winfirst'));
