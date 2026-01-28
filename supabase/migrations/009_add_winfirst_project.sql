-- Add winfirst as a valid project
ALTER TABLE brain_items DROP CONSTRAINT IF EXISTS brain_items_project_check;
ALTER TABLE brain_items ADD CONSTRAINT brain_items_project_check 
  CHECK (project IN ('xthread', 'nomad-research', 'general', 'winfirst'));
