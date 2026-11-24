-- Lets readers edit and delete their own comments (no sign-in).
-- owner_hash: SHA-256 of the anonymous browser id that posted the comment. The raw id is never stored.
-- edited_at:  ISO 8601 time of the last edit, NULL if never edited.
-- Comments from before this migration have no owner_hash, so nobody can edit or delete them.
-- If the console says "duplicate column name", the site already added these columns itself. Nothing to do.
ALTER TABLE comments ADD COLUMN owner_hash TEXT;
ALTER TABLE comments ADD COLUMN edited_at TEXT;
