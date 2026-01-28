-- Improve workflow with better categories and statuses

-- Add 'deliverables' category for finished work products
-- Add 'approved' and 'changes-requested' statuses for clearer review workflow

-- Update category constraint to add 'deliverables'
ALTER TABLE brain_items DROP CONSTRAINT IF EXISTS brain_items_category_check;
ALTER TABLE brain_items ADD CONSTRAINT brain_items_category_check 
  CHECK (category IN (
    'ideas',           -- Future possibilities, not committed
    'tasks',           -- Active work items
    'research',        -- Reference material
    'content-drafts',  -- Legacy: use 'deliverables' going forward
    'deliverables',    -- NEW: Finished work for review (tweets, docs, videos)
    'shipped',         -- Legacy
    'learnings',       -- Lessons learned
    'goals',           -- North star objectives
    'future-projects', -- Someday/maybe projects
    'bugs'             -- NEW: Bug fixes
  ));

-- Update status constraint to add 'approved' and 'changes-requested'
ALTER TABLE brain_items DROP CONSTRAINT IF EXISTS brain_items_status_check;
ALTER TABLE brain_items ADD CONSTRAINT brain_items_status_check
  CHECK (status IN (
    'backlog',           -- Queued but not started
    'in-progress',       -- Actively being worked on
    'review-needed',     -- Ready for Spencer to review
    'approved',          -- NEW: Spencer approved, ready to publish
    'changes-requested', -- NEW: Spencer wants revisions
    'done',              -- Published/deployed/complete
    'rejected'           -- Not moving forward
  ));

-- Add winfirst project if not already present
ALTER TABLE brain_items DROP CONSTRAINT IF EXISTS brain_items_project_check;
ALTER TABLE brain_items ADD CONSTRAINT brain_items_project_check
  CHECK (project IN ('xthread', 'nomad-research', 'general', 'winfirst'));
