-- Migration: Multi-Type Research Support
-- Date: 2025-12-12
-- Description: Refactor research_snapshots to support flexible research types (not limited to 3 types)

BEGIN;

-- ============================================================================
-- STEP 1: Backup existing data (if any research_snapshots exist)
-- ============================================================================

-- Create temporary backup table
CREATE TEMPORARY TABLE research_snapshots_backup AS
SELECT * FROM research_snapshots;

-- ============================================================================
-- STEP 2: Drop and recreate research_snapshots table
-- ============================================================================

-- Drop old table (cascade will drop RLS policies and indexes)
DROP TABLE IF EXISTS research_snapshots CASCADE;

-- Create new flexible schema
CREATE TABLE research_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,

  -- Flexible research type (no hardcoded values, no CHECK constraint)
  research_type TEXT NOT NULL,

  -- Generic JSONB fields for queries and results
  -- Structure depends on research_type, defined by application layer
  queries JSONB DEFAULT '[]'::jsonb,
  results JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique: one snapshot per (session_id, research_type) pair
  CONSTRAINT research_snapshots_session_type_unique UNIQUE (session_id, research_type),

  -- Basic validation: ensure JSONB fields are arrays
  CONSTRAINT research_snapshots_queries_check CHECK (jsonb_typeof(queries) = 'array'),
  CONSTRAINT research_snapshots_results_check CHECK (jsonb_typeof(results) = 'array'),
  CONSTRAINT research_snapshots_type_not_empty CHECK (char_length(research_type) > 0)
);

COMMENT ON TABLE research_snapshots IS
'Flexible research snapshots supporting any research type. Type-specific structure defined in application layer.';

COMMENT ON COLUMN research_snapshots.research_type IS
'Research type identifier (e.g., competitor, community, regulatory, pricing, etc.). Validated at application layer, not database.';

COMMENT ON COLUMN research_snapshots.queries IS
'Array of query strings or query objects for this research type';

COMMENT ON COLUMN research_snapshots.results IS
'Array of result objects. Structure depends on research_type and is validated by application layer.';

-- ============================================================================
-- STEP 3: Create indexes
-- ============================================================================

CREATE INDEX idx_research_snapshots_session ON research_snapshots(session_id);
CREATE INDEX idx_research_snapshots_type ON research_snapshots(research_type);
CREATE INDEX idx_research_snapshots_created_at ON research_snapshots(created_at DESC);

-- GIN indexes for JSONB queries
CREATE INDEX idx_research_snapshots_queries_gin ON research_snapshots USING GIN (queries);
CREATE INDEX idx_research_snapshots_results_gin ON research_snapshots USING GIN (results);

-- ============================================================================
-- STEP 4: Restore RLS policies
-- ============================================================================

ALTER TABLE research_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own research"
  ON research_snapshots FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = research_snapshots.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can insert own research"
  ON research_snapshots FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = research_snapshots.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can update own research"
  ON research_snapshots FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = research_snapshots.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can delete own research"
  ON research_snapshots FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = research_snapshots.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

-- ============================================================================
-- STEP 5: Migrate old data (if any exists)
-- ============================================================================

-- Migrate competitor research (if existed)
INSERT INTO research_snapshots (session_id, research_type, queries, results)
SELECT
  session_id,
  'competitor' as research_type,
  COALESCE(competitor_queries, '[]'::jsonb) as queries,
  COALESCE(competitors, '[]'::jsonb) as results
FROM research_snapshots_backup
WHERE jsonb_array_length(COALESCE(competitor_queries, '[]'::jsonb)) > 0
   OR jsonb_array_length(COALESCE(competitors, '[]'::jsonb)) > 0;

-- Migrate community research (if existed)
INSERT INTO research_snapshots (session_id, research_type, queries, results)
SELECT
  session_id,
  'community' as research_type,
  COALESCE(community_queries, '[]'::jsonb) as queries,
  COALESCE(community_signals, '[]'::jsonb) as results
FROM research_snapshots_backup
WHERE jsonb_array_length(COALESCE(community_queries, '[]'::jsonb)) > 0
   OR jsonb_array_length(COALESCE(community_signals, '[]'::jsonb)) > 0;

-- Migrate regulatory research (if existed)
INSERT INTO research_snapshots (session_id, research_type, queries, results)
SELECT
  session_id,
  'regulatory' as research_type,
  COALESCE(regulatory_queries, '[]'::jsonb) as queries,
  COALESCE(regulatory_signals, '[]'::jsonb) as results
FROM research_snapshots_backup
WHERE jsonb_array_length(COALESCE(regulatory_queries, '[]'::jsonb)) > 0
   OR jsonb_array_length(COALESCE(regulatory_signals, '[]'::jsonb)) > 0;

-- ============================================================================
-- STEP 6: Verification
-- ============================================================================

DO $$
DECLARE
  old_count INTEGER;
  new_count INTEGER;
BEGIN
  -- Count old records
  SELECT COUNT(*) INTO old_count FROM research_snapshots_backup;

  -- Count new records (may be 0-3x old_count depending on how many types each session had)
  SELECT COUNT(*) INTO new_count FROM research_snapshots;

  RAISE NOTICE 'Migration complete: Migrated % old records into % new type-specific records', old_count, new_count;
END $$;

COMMIT;
