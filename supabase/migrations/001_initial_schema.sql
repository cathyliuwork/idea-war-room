-- Idea War Room - Initial Database Schema
-- Version: 1.0
-- Description: Complete database schema for MVTA platform with custom RLS functions

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CUSTOM RLS FUNCTIONS
-- ============================================================================

-- Function to get the current user ID from session context
-- This is called by RLS policies to enforce row-level security
CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS UUID AS $$
  SELECT NULLIF(current_setting('app.current_user_id', true), '')::uuid;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_current_user_id IS
'Returns the authenticated user ID from session context set by API middleware';

-- Function to set the session user ID for RLS context
-- This is called by API middleware after JWT validation
CREATE OR REPLACE FUNCTION set_session_user_id(user_id UUID)
RETURNS void AS $$
BEGIN
  PERFORM set_config('app.current_user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_session_user_id IS
'Sets the authenticated user ID in session context for RLS enforcement';

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column IS
'Trigger function to automatically update updated_at timestamp on row updates';

-- ============================================================================
-- TABLE 1: user_profiles
-- ============================================================================

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  external_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT user_profiles_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$'),
  CONSTRAINT user_profiles_external_user_id_check CHECK (char_length(external_user_id) > 0)
);

COMMENT ON TABLE user_profiles IS
'User account information synced from parent project authentication';

COMMENT ON COLUMN user_profiles.id IS 'Internal UUID primary key';
COMMENT ON COLUMN user_profiles.external_user_id IS 'Parent project user ID (from JWT sub claim)';
COMMENT ON COLUMN user_profiles.email IS 'User email address';
COMMENT ON COLUMN user_profiles.full_name IS 'User full name';
COMMENT ON COLUMN user_profiles.metadata IS 'Additional user data from JWT metadata field';

-- Indexes for user_profiles
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_external_user_id ON user_profiles(external_user_id);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at DESC);

-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (get_current_user_id() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (get_current_user_id() = id);

-- Trigger for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 2: sessions
-- ============================================================================

CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'intake' CHECK (status IN ('intake', 'research', 'analysis', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE sessions IS
'MVTA analysis sessions (one session = one complete analysis flow)';

COMMENT ON COLUMN sessions.status IS
'Session workflow status: intake → research → analysis → completed (or failed)';

-- Indexes for sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_created_at ON sessions(created_at DESC);
CREATE INDEX idx_sessions_user_status ON sessions(user_id, status);

-- RLS Policies for sessions
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions"
  ON sessions FOR SELECT
  USING (get_current_user_id() = user_id);

CREATE POLICY "Users can insert own sessions"
  ON sessions FOR INSERT
  WITH CHECK (get_current_user_id() = user_id);

CREATE POLICY "Users can update own sessions"
  ON sessions FOR UPDATE
  USING (get_current_user_id() = user_id);

CREATE POLICY "Users can delete own sessions"
  ON sessions FOR DELETE
  USING (get_current_user_id() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TABLE 3: ideas
-- ============================================================================

CREATE TABLE ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  raw_input TEXT NOT NULL,
  structured_idea JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ideas_raw_input_check CHECK (char_length(raw_input) > 0),
  CONSTRAINT ideas_structured_idea_check CHECK (jsonb_typeof(structured_idea) = 'object')
);

COMMENT ON TABLE ideas IS
'Raw founder input and LLM-structured MVTA-formatted idea';

COMMENT ON COLUMN ideas.raw_input IS 'Founder original idea description (concatenated answers from intake form)';
COMMENT ON COLUMN ideas.structured_idea IS 'LLM-processed MVTA JSON schema (high_concept, value_proposition, assumptions, assets, environment)';

-- Indexes for ideas
CREATE INDEX idx_ideas_session_id ON ideas(session_id);
CREATE INDEX idx_ideas_created_at ON ideas(created_at DESC);
CREATE INDEX idx_ideas_structured_idea_gin ON ideas USING GIN (structured_idea);

-- RLS Policies for ideas
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own ideas"
  ON ideas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = ideas.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can insert own ideas"
  ON ideas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = ideas.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

-- ============================================================================
-- TABLE 4: research_snapshots
-- ============================================================================

CREATE TABLE research_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  competitor_queries JSONB DEFAULT '[]'::jsonb,
  community_queries JSONB DEFAULT '[]'::jsonb,
  regulatory_queries JSONB DEFAULT '[]'::jsonb,
  competitors JSONB DEFAULT '[]'::jsonb,
  community_signals JSONB DEFAULT '[]'::jsonb,
  regulatory_signals JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT research_snapshots_competitor_queries_check CHECK (jsonb_typeof(competitor_queries) = 'array'),
  CONSTRAINT research_snapshots_community_queries_check CHECK (jsonb_typeof(community_queries) = 'array'),
  CONSTRAINT research_snapshots_regulatory_queries_check CHECK (jsonb_typeof(regulatory_queries) = 'array'),
  CONSTRAINT research_snapshots_competitors_check CHECK (jsonb_typeof(competitors) = 'array'),
  CONSTRAINT research_snapshots_community_signals_check CHECK (jsonb_typeof(community_signals) = 'array'),
  CONSTRAINT research_snapshots_regulatory_signals_check CHECK (jsonb_typeof(regulatory_signals) = 'array')
);

COMMENT ON TABLE research_snapshots IS
'Research queries and synthesized results (competitors, community signals, regulatory context)';

COMMENT ON COLUMN research_snapshots.competitor_queries IS 'LLM-generated queries for competitor research';
COMMENT ON COLUMN research_snapshots.competitors IS 'Synthesized competitor profiles (name, URL, pricing, strengths, weaknesses)';
COMMENT ON COLUMN research_snapshots.community_signals IS 'Classified community discussions (sentiment, themes, snippets)';
COMMENT ON COLUMN research_snapshots.regulatory_signals IS 'Regulatory compliance requirements';

-- Indexes for research_snapshots
CREATE INDEX idx_research_snapshots_session_id ON research_snapshots(session_id);
CREATE INDEX idx_research_snapshots_created_at ON research_snapshots(created_at DESC);
CREATE INDEX idx_research_snapshots_competitors_gin ON research_snapshots USING GIN (competitors);
CREATE INDEX idx_research_snapshots_community_signals_gin ON research_snapshots USING GIN (community_signals);
CREATE INDEX idx_research_snapshots_regulatory_signals_gin ON research_snapshots USING GIN (regulatory_signals);

-- RLS Policies for research_snapshots
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

-- ============================================================================
-- TABLE 5: damage_reports
-- ============================================================================

CREATE TABLE damage_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES sessions(id) ON DELETE CASCADE,
  vulnerabilities JSONB NOT NULL,
  cascading_failures JSONB NOT NULL,
  vector_synthesis JSONB NOT NULL,
  recommendations JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT damage_reports_vulnerabilities_check CHECK (jsonb_typeof(vulnerabilities) = 'array'),
  CONSTRAINT damage_reports_cascading_failures_check CHECK (jsonb_typeof(cascading_failures) = 'array'),
  CONSTRAINT damage_reports_vector_synthesis_check CHECK (jsonb_typeof(vector_synthesis) = 'array'),
  CONSTRAINT damage_reports_recommendations_check CHECK (jsonb_typeof(recommendations) = 'array')
);

COMMENT ON TABLE damage_reports IS
'Complete MVTA analysis results (vulnerabilities, cascading failures, recommendations)';

COMMENT ON COLUMN damage_reports.vulnerabilities IS
'Array of vulnerability objects (vector, simulation, score, rationale, evidence_refs)';
COMMENT ON COLUMN damage_reports.cascading_failures IS
'Array of cascading failure chains showing domino effects';
COMMENT ON COLUMN damage_reports.vector_synthesis IS
'Array of vector summaries (one per threat vector)';
COMMENT ON COLUMN damage_reports.recommendations IS
'Array of actionable recommendations with priority';

-- Indexes for damage_reports
CREATE INDEX idx_damage_reports_session_id ON damage_reports(session_id);
CREATE INDEX idx_damage_reports_created_at ON damage_reports(created_at DESC);
CREATE INDEX idx_damage_reports_vulnerabilities_gin ON damage_reports USING GIN (vulnerabilities);
CREATE INDEX idx_damage_reports_recommendations_gin ON damage_reports USING GIN (recommendations);

-- RLS Policies for damage_reports
ALTER TABLE damage_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON damage_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = damage_reports.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can insert own reports"
  ON damage_reports FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = damage_reports.session_id
      AND sessions.user_id = get_current_user_id()
    )
  );

-- ============================================================================
-- TABLE 6: feedback
-- ============================================================================

CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  damage_report_id UUID NOT NULL REFERENCES damage_reports(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback_text TEXT,
  captured_real_risks BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT feedback_text_length CHECK (char_length(feedback_text) <= 500)
);

COMMENT ON TABLE feedback IS
'User feedback on damage report quality (for prompt tuning and product improvement)';

COMMENT ON COLUMN feedback.rating IS '1-5 star rating of report quality';
COMMENT ON COLUMN feedback.captured_real_risks IS 'Boolean: did report capture real risks?';
COMMENT ON COLUMN feedback.feedback_text IS 'Optional free-form comments (max 500 chars)';

-- Indexes for feedback
CREATE INDEX idx_feedback_damage_report_id ON feedback(damage_report_id);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);
CREATE INDEX idx_feedback_rating ON feedback(rating);

-- RLS Policies for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM damage_reports
      JOIN sessions ON damage_reports.session_id = sessions.id
      WHERE damage_reports.id = feedback.damage_report_id
      AND sessions.user_id = get_current_user_id()
    )
  );

CREATE POLICY "Users can insert own feedback"
  ON feedback FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM damage_reports
      JOIN sessions ON damage_reports.session_id = sessions.id
      WHERE damage_reports.id = feedback.damage_report_id
      AND sessions.user_id = get_current_user_id()
    )
  );

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions for authenticated users
-- Note: Supabase handles this automatically with service_role and anon keys
-- These are documented here for reference

-- Service role key (backend): Full access
-- Anon key (frontend): RLS-enforced access only

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables created
DO $$
DECLARE
  table_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('user_profiles', 'sessions', 'ideas', 'research_snapshots', 'damage_reports', 'feedback');

  IF table_count = 6 THEN
    RAISE NOTICE 'Migration complete: All 6 tables created successfully';
  ELSE
    RAISE EXCEPTION 'Migration failed: Expected 6 tables, found %', table_count;
  END IF;
END $$;
