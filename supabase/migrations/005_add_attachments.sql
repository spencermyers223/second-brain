-- Migration 005: Add attachments support
-- Run this in the Supabase SQL Editor

-- Add attachments JSONB column to brain_items
ALTER TABLE brain_items
ADD COLUMN attachments JSONB DEFAULT '[]'::jsonb;

-- Create the storage bucket for attachments (public)
INSERT INTO storage.buckets (id, name, public)
VALUES ('attachments', 'attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to the attachments bucket
CREATE POLICY "Public read access for attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'attachments');

-- Allow anonymous uploads to the attachments bucket
CREATE POLICY "Allow anonymous uploads to attachments"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'attachments');

-- Allow anonymous deletes from the attachments bucket
CREATE POLICY "Allow anonymous deletes from attachments"
ON storage.objects FOR DELETE
USING (bucket_id = 'attachments');
