ALTER TABLE users ADD COLUMN cohort_code text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN stay_period text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN interests text NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN profile_visibility text NOT NULL DEFAULT 'mates';
ALTER TABLE users ADD COLUMN onboarding_completed_at integer;
