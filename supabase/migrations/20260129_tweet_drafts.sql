-- Tweet Drafts with Media Support
-- Enables Spencer to review tweet drafts + attached images before approval

-- =============================================
-- TWEET DRAFTS TABLE
-- =============================================
CREATE TABLE tweet_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  
  -- Tweet content
  content TEXT NOT NULL,
  
  -- Target account (e.g., 'xthreadapp', 'nomad_spencer')
  target_account TEXT NOT NULL DEFAULT 'xthreadapp',
  
  -- Media attachments (array of URLs from Supabase Storage)
  media_urls TEXT[] DEFAULT '{}',
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending-review', 'approved', 'rejected', 'posted')),
  
  -- Who created it
  created_by TEXT NOT NULL CHECK (created_by IN ('spencer', 'clawdbot')),
  
  -- Review feedback
  feedback TEXT,
  
  -- Scheduling (optional)
  scheduled_for TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  posted_at TIMESTAMPTZ
);

CREATE INDEX idx_tweet_drafts_status ON tweet_drafts(status);
CREATE INDEX idx_tweet_drafts_account ON tweet_drafts(target_account);
CREATE INDEX idx_tweet_drafts_project ON tweet_drafts(project_id);

-- Update trigger
CREATE TRIGGER update_tweet_drafts_updated_at
  BEFORE UPDATE ON tweet_drafts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Activity logging for tweet drafts
CREATE OR REPLACE FUNCTION log_tweet_draft_change()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO activity_log (project_id, actor, action, target_type, target_id, target_title)
    VALUES (NEW.project_id, NEW.created_by, 'created tweet draft', 'tweet_draft', NEW.id::text, LEFT(NEW.content, 50));
  ELSIF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
    INSERT INTO activity_log (project_id, actor, action, target_type, target_id, target_title, details)
    VALUES (NEW.project_id, COALESCE(NEW.created_by, OLD.created_by), 'tweet draft ' || NEW.status, 'tweet_draft', NEW.id::text, LEFT(NEW.content, 50), OLD.status || ' → ' || NEW.status);
    
    IF NEW.status = 'posted' AND OLD.status != 'posted' THEN
      NEW.posted_at = NOW();
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tweet_draft_change_trigger
  BEFORE INSERT OR UPDATE ON tweet_drafts
  FOR EACH ROW EXECUTE FUNCTION log_tweet_draft_change();

-- =============================================
-- STORAGE BUCKET (run via Supabase dashboard or CLI)
-- =============================================
-- Note: Create a bucket called 'tweet-media' with public access
-- INSERT INTO storage.buckets (id, name, public) VALUES ('tweet-media', 'tweet-media', true);
