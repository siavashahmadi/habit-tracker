-- ============================================================
-- Habit Tracker — Supabase Schema
-- Run this in your Supabase SQL editor to set up the database.
-- ============================================================

-- ---- habits table ----
CREATE TABLE IF NOT EXISTS habits (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('good', 'bad')),
  icon         TEXT NOT NULL DEFAULT '✨',
  color        TEXT NOT NULL DEFAULT '#22c55e',
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  archived_at  TIMESTAMPTZ  -- NULL means active; set to archive (soft delete)
);

-- ---- habit_logs table ----
-- One row per day per habit.
-- For good habits: a row = "I completed this habit on logged_date"
-- For bad habits:  a row = "I slipped on logged_date"
CREATE TABLE IF NOT EXISTS habit_logs (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id     UUID REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  logged_date  DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(habit_id, logged_date)  -- prevent duplicate logs per day
);

-- ---- Indexes for efficient date-range queries ----
CREATE INDEX IF NOT EXISTS habit_logs_habit_id_idx ON habit_logs(habit_id);
CREATE INDEX IF NOT EXISTS habit_logs_user_date_idx ON habit_logs(user_id, logged_date DESC);
CREATE INDEX IF NOT EXISTS habits_user_id_idx ON habits(user_id);

-- ============================================================
-- Row Level Security (RLS)
-- Every user can only see and modify their own data.
-- ============================================================

ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_logs ENABLE ROW LEVEL SECURITY;

-- habits RLS policies
CREATE POLICY "habits: select own" ON habits
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "habits: insert own" ON habits
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habits: update own" ON habits
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "habits: delete own" ON habits
  FOR DELETE USING (auth.uid() = user_id);

-- habit_logs RLS policies
CREATE POLICY "habit_logs: select own" ON habit_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "habit_logs: insert own" ON habit_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "habit_logs: delete own" ON habit_logs
  FOR DELETE USING (auth.uid() = user_id);
