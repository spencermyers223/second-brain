-- Daily Summaries Table
-- Tracks daily progress for easy end-of-day review

CREATE TABLE IF NOT EXISTS daily_summaries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  items jsonb DEFAULT '[]'::jsonb,
  -- Each item: { time: "HH:MM", text: "What was done", category?: "feature|fix|docs|other" }
  archived boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index for quick date lookups
CREATE INDEX IF NOT EXISTS idx_daily_summaries_date ON daily_summaries(date DESC);

-- Function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_daily_summary_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS daily_summaries_updated_at ON daily_summaries;
CREATE TRIGGER daily_summaries_updated_at
  BEFORE UPDATE ON daily_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_summary_timestamp();
