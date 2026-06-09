-- ============================================================
-- AI Interviewer — Database Schema
-- Run this in the Supabase SQL Editor to set up the project.
-- ============================================================

-- interviews
CREATE TABLE IF NOT EXISTS interviews (
  id                 UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  vapi_assistant_id  TEXT,
  vapi_call_id       TEXT,
  role               TEXT        NOT NULL,
  level              TEXT        NOT NULL CHECK (level IN ('Junior', 'Mid', 'Senior')),
  type               TEXT        NOT NULL CHECK (type IN ('technical', 'behavioural', 'mixed')),
  questions          TEXT[]      NOT NULL DEFAULT '{}',
  status             TEXT        NOT NULL DEFAULT 'pending'
                                 CHECK (status IN ('pending', 'active', 'completed')),
  transcript         JSONB,
  feedback           JSONB,
  duration_seconds   INT,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at       TIMESTAMPTZ
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_interviews_status     ON interviews (status);
CREATE INDEX IF NOT EXISTS idx_interviews_created_at ON interviews (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interviews_vapi_call  ON interviews (vapi_call_id);
