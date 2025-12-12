-- Migration: Add source field to ideas table
-- Description: Track whether idea came from form input or AI extraction
-- Date: 2025-12-11

-- Add source column to ideas table
ALTER TABLE ideas
ADD COLUMN source VARCHAR(10) DEFAULT 'ai' CHECK (source IN ('form', 'ai'));

-- Backfill existing records (all existing ideas are from AI extraction)
UPDATE ideas SET source = 'ai' WHERE source IS NULL;

-- Make source NOT NULL after backfill
ALTER TABLE ideas ALTER COLUMN source SET NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN ideas.source IS 'Data entry method: form (direct user input) or ai (LLM extraction)';
COMMENT ON COLUMN ideas.raw_input IS 'Original input: free text (if ai) or JSON string (if form)';
