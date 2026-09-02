CREATE TABLE `festival_schedules` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `season` text DEFAULT '' NOT NULL,
  `location` text DEFAULT '' NOT NULL,
  `description` text DEFAULT '' NOT NULL,
  `start_date` text,
  `end_date` text,
  `schedule_status` text DEFAULT 'unconfirmed' NOT NULL,
  `verification_status` text DEFAULT 'pending' NOT NULL,
  `source_name` text DEFAULT '' NOT NULL,
  `source_url` text DEFAULT '' NOT NULL,
  `contact_phone` text DEFAULT '' NOT NULL,
  `last_checked_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `festival_verification_runs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `festival_id` text NOT NULL REFERENCES `festival_schedules`(`id`) ON DELETE cascade,
  `source_name` text NOT NULL,
  `source_url` text NOT NULL,
  `observed_start_date` text,
  `observed_end_date` text,
  `observed_status` text DEFAULT 'found' NOT NULL,
  `evidence` text DEFAULT '' NOT NULL,
  `checked_at` integer DEFAULT (unixepoch()) NOT NULL
);
