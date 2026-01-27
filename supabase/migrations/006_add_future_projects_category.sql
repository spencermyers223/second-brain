-- Add 'future-projects' category to brain_items
ALTER TABLE brain_items DROP CONSTRAINT IF EXISTS brain_items_category_check;
ALTER TABLE brain_items ADD CONSTRAINT brain_items_category_check CHECK (category IN ('ideas', 'tasks', 'research', 'content-drafts', 'shipped', 'learnings', 'goals', 'future-projects'));
