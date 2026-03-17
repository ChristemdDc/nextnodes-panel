-- migrations/001_create_users_table.sql
-- Ejecutar en SQLite

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  -- Information
  email TEXT NOT NULL UNIQUE,
  email_normalized TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  
  -- Local Auth
  password_hash TEXT,
  
  -- Email Verified
  email_verified BOOLEAN DEFAULT 0,
  email_verified_at DATETIME NULL,
  
  -- Account Status
  account_status TEXT DEFAULT 'pending_verification' CHECK(account_status IN ('pending_verification', 'active', 'suspended', 'deleted')),
  
  -- Security
  failed_login_count INTEGER DEFAULT 0,
  locked_until DATETIME NULL,
  last_login_at DATETIME NULL,
  last_login_ip TEXT,
  
  -- Google OAuth
  google_id TEXT UNIQUE,
  
  -- Timestamps
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_email_normalized ON users(email_normalized);
CREATE INDEX IF NOT EXISTS idx_google_id ON users(google_id);

-- Sessions Table
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  
  user_id INTEGER NOT NULL,
  
  ip_address TEXT,
  user_agent TEXT,
  
  active BOOLEAN DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Login Audit Log
CREATE TABLE IF NOT EXISTS login_audits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  user_id INTEGER,
  email TEXT,
  
  event_type TEXT NOT NULL CHECK(event_type IN (
    'login_attempt',
    'login_success',
    'login_failure',
    'login_blocked',
    'logout',
    'register_attempt',
    'email_verified',
    'email_verification_failed',
    'password_reset_requested',
    'password_reset_success',
    'account_locked',
    'account_unlocked',
    'google_login_success'
  )),
  
  ip_address TEXT,
  user_agent TEXT,
  result TEXT,
  reason TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Rate Limit Log
CREATE TABLE IF NOT EXISTS rate_limit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  
  key_type TEXT,
  key_value TEXT,
  
  attempt_count INTEGER DEFAULT 0,
  blocked_until DATETIME NULL,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(key_type, key_value)
);

-- Email Verification Codes
CREATE TABLE IF NOT EXISTS email_verification_codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  code_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT 0,
  used_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Password Reset Tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token_hash TEXT NOT NULL,
  used BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Test insert
INSERT INTO users (email, email_normalized, name, password_hash, email_verified, account_status)
VALUES ('test@example.com', 'test@example.com', 'Test User', '$argon2id$v=19$m=65536,t=3,p=4$test', 1, 'active')
ON CONFLICT(email) DO NOTHING;
