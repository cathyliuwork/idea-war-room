-- Migration: Add branching workflow support
-- Date: 2025-12-11
-- Description: Add completion tracking columns and update status enum to support choice page

BEGIN;

-- Add completion tracking columns
ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS research_completed BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS analysis_completed BOOLEAN DEFAULT FALSE;

-- Drop old status constraint FIRST (so UPDATE doesn't fail)
ALTER TABLE sessions
  DROP CONSTRAINT IF EXISTS sessions_status_check;

-- Migrate existing sessions
-- 'research' -> 'choice' (intake done, waiting for action)
-- 'analysis' -> 'choice' with research_completed=true
-- 'completed' -> 'completed' with both flags true
UPDATE sessions
SET
  status = CASE
    WHEN status = 'research' THEN 'choice'
    WHEN status = 'analysis' THEN 'choice'
    WHEN status = 'completed' THEN 'completed'
    ELSE status
  END,
  research_completed = CASE WHEN status IN ('analysis', 'completed') THEN TRUE ELSE FALSE END,
  analysis_completed = CASE WHEN status = 'completed' THEN TRUE ELSE FALSE END
WHERE status IN ('research', 'analysis', 'completed');

-- Add new status constraint with 'choice' instead of 'research' and 'analysis'
ALTER TABLE sessions
  ADD CONSTRAINT sessions_status_check
    CHECK (status IN ('intake', 'choice', 'completed', 'failed'));

-- Add index for completion flags (for dashboard queries)
CREATE INDEX IF NOT EXISTS idx_sessions_completion ON sessions(research_completed, analysis_completed);

-- Update column comments
COMMENT ON COLUMN sessions.status IS
'Session workflow status: intake → choice → completed (or failed). Use research_completed/analysis_completed flags to track individual completions.';

COMMENT ON COLUMN sessions.research_completed IS
'TRUE if research phase has been completed at least once';

COMMENT ON COLUMN sessions.analysis_completed IS
'TRUE if MVTA analysis has been completed at least once';

COMMIT;
