ALTER TABLE users ADD COLUMN activity_score integer NOT NULL DEFAULT 30;
ALTER TABLE users ADD COLUMN last_active_at integer;
