-- Solana Narrative Tracker — Supabase Schema
-- Superteam Earn Bounty: Emerging Narratives & Early Signals

-- Social signals from X (KOLs, projects, ecosystem)
CREATE TABLE IF NOT EXISTS social_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL,                -- 'x_kol' | 'x_project' | 'x_list'
  handle TEXT NOT NULL,
  tweet_id TEXT UNIQUE NOT NULL,
  tweet_text TEXT NOT NULL,
  tweet_url TEXT,
  posted_at TIMESTAMPTZ,
  followers_count INT,
  engagement JSONB DEFAULT '{}',       -- likes, retweets, replies
  keywords_matched TEXT[] DEFAULT '{}',
  category TEXT,                        -- 'defi' | 'infra' | 'consumer' | 'depin' | 'gaming' | 'ai' | 'other'
  signal_strength FLOAT DEFAULT 0,     -- 0-1 score
  created_at TIMESTAMPTZ DEFAULT now()
);

-- GitHub activity signals
CREATE TABLE IF NOT EXISTS github_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repo_full_name TEXT NOT NULL,        -- e.g. 'solana-labs/solana'
  repo_url TEXT,
  stars INT DEFAULT 0,
  stars_delta INT DEFAULT 0,           -- change since last scan
  forks INT DEFAULT 0,
  open_issues INT DEFAULT 0,
  recent_commits INT DEFAULT 0,        -- commits in last 14 days
  language TEXT,
  description TEXT,
  topics TEXT[] DEFAULT '{}',
  last_push_at TIMESTAMPTZ,
  signal_type TEXT,                     -- 'trending' | 'new_repo' | 'activity_spike'
  scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(repo_full_name, scanned_at)
);

-- Onchain signals (program deploys, usage spikes)
CREATE TABLE IF NOT EXISTS onchain_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  signal_type TEXT NOT NULL,           -- 'new_program' | 'usage_spike' | 'tvl_change' | 'active_wallets'
  program_id TEXT,
  program_name TEXT,
  metric_name TEXT,
  metric_value FLOAT,
  metric_delta FLOAT,                  -- % change
  network TEXT DEFAULT 'solana-mainnet',
  source TEXT,                         -- 'helius' | 'defillama' | 'solscan'
  metadata JSONB DEFAULT '{}',
  scanned_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Detected narratives (AI-generated)
CREATE TABLE IF NOT EXISTS narratives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_period TEXT NOT NULL,         -- e.g. '2026-02-01_2026-02-14'
  narrative_name TEXT NOT NULL,
  narrative_slug TEXT,
  description TEXT NOT NULL,
  confidence FLOAT DEFAULT 0,          -- 0-1
  signal_count INT DEFAULT 0,
  category TEXT,
  supporting_signals JSONB DEFAULT '[]',  -- array of signal references
  build_ideas JSONB DEFAULT '[]',         -- array of {title, description, difficulty, narrative_fit}
  status TEXT DEFAULT 'detected',         -- 'detected' | 'accelerating' | 'peaked' | 'fading'
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(report_period, narrative_slug)
);

-- Scan runs log
CREATE TABLE IF NOT EXISTS scan_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scan_type TEXT NOT NULL,             -- 'social' | 'github' | 'onchain' | 'narrative_gen'
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'running',
  signals_found INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Fortnightly reports (the main output)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  narratives_count INT DEFAULT 0,
  total_signals INT DEFAULT 0,
  report_data JSONB DEFAULT '{}',      -- full structured report
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_social_signals_handle ON social_signals(handle);
CREATE INDEX IF NOT EXISTS idx_social_signals_posted ON social_signals(posted_at DESC);
CREATE INDEX IF NOT EXISTS idx_github_signals_repo ON github_signals(repo_full_name);
CREATE INDEX IF NOT EXISTS idx_narratives_period ON narratives(report_period);
CREATE INDEX IF NOT EXISTS idx_reports_period ON reports(period_start, period_end);
