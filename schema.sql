-- StockBrain D1 Database Schema
-- This schema defines the tables needed for user data, stock analysis, and app functionality

-- Users table for authentication and user management
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  created_at INTEGER NOT NULL,
  last_login INTEGER,
  preferences TEXT -- JSON string for user preferences
);

-- User watchlists
CREATE TABLE IF NOT EXISTS user_watchlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  symbols TEXT NOT NULL, -- JSON array of symbols
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Stock analysis history
CREATE TABLE IF NOT EXISTS stock_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  symbol TEXT NOT NULL,
  analysis_type TEXT NOT NULL, -- 'divergence', 'ghost_pattern', 'options', etc.
  analysis_data TEXT NOT NULL, -- JSON blob of analysis results
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Chat history
CREATE TABLE IF NOT EXISTS chat_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  session_id TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata TEXT, -- JSON for additional data like widgets, sources
  created_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Stock data cache (for frequently accessed data)
CREATE TABLE IF NOT EXISTS stock_cache (
  symbol TEXT PRIMARY KEY,
  data_type TEXT NOT NULL, -- 'quote', 'profile', 'intraday'
  data TEXT NOT NULL, -- JSON blob
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  last_request INTEGER NOT NULL,
  date TEXT NOT NULL, -- YYYY-MM-DD format
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- User sessions for authentication
CREATE TABLE IF NOT EXISTS user_sessions (
  session_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  last_accessed INTEGER NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_watchlists_user_id ON user_watchlists(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_analysis_user_symbol ON stock_analysis(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_chat_history_session ON chat_history(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_stock_cache_symbol_type ON stock_cache(symbol, data_type);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_date ON api_usage(user_id, date);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- Insert default anonymous user for guest access
INSERT OR IGNORE INTO users (id, email, name, created_at, preferences)
VALUES ('anonymous', NULL, 'Guest User', strftime('%s', 'now'), '{"theme": "auto", "notifications": false}');
