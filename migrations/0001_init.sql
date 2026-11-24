-- The Fourth Dimension: comments and reactions (Cloudflare D1).
-- Safe to run more than once.

CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL,
  name       TEXT    NOT NULL DEFAULT '',
  body       TEXT    NOT NULL,
  created_at TEXT    NOT NULL,             -- ISO 8601, UTC
  ip_hash    TEXT,                         -- salted SHA-256 of the IP, never the raw IP
  hidden     INTEGER NOT NULL DEFAULT 0    -- set to 1 to hide a comment
);
CREATE INDEX IF NOT EXISTS comments_by_slug ON comments (slug, created_at DESC);

-- One reaction per reader (anonymous browser id) per article.
CREATE TABLE IF NOT EXISTS reactions (
  slug       TEXT NOT NULL,
  client_id  TEXT NOT NULL,
  reaction   TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  ip_hash    TEXT,
  PRIMARY KEY (slug, client_id)
);
CREATE INDEX IF NOT EXISTS reactions_by_slug ON reactions (slug, reaction);

-- Fixed-window rate limits, one row per action + IP hash.
CREATE TABLE IF NOT EXISTS rate_limits (
  key          TEXT    PRIMARY KEY,
  window_start INTEGER NOT NULL,
  count        INTEGER NOT NULL
);
