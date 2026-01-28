-- Add 'rejected' status option for content review workflow
ALTER TABLE brain_items DROP CONSTRAINT brain_items_status_check;
ALTER TABLE brain_items ADD CONSTRAINT brain_items_status_check
  CHECK (status IN ('backlog', 'in-progress', 'review-needed', 'done', 'rejected'));
