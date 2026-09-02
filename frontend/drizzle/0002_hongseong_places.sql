CREATE TABLE `places` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `category` text NOT NULL,
  `emoji` text NOT NULL,
  `address` text DEFAULT '' NOT NULL,
  `phone` text DEFAULT '' NOT NULL,
  `latitude` real NOT NULL,
  `longitude` real NOT NULL,
  `source` text DEFAULT 'operator' NOT NULL,
  `source_id` text DEFAULT '' NOT NULL,
  `public_status` text DEFAULT 'unknown' NOT NULL,
  `verification_status` text DEFAULT 'needs_check' NOT NULL,
  `last_source_checked_at` integer,
  `last_community_checked_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_places_source_id` ON `places` (`source`,`source_id`);
--> statement-breakpoint
CREATE TABLE `place_reviews` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `place_id` text NOT NULL REFERENCES `places`(`id`) ON DELETE cascade,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `rating` integer NOT NULL,
  `body` text NOT NULL,
  `visited_at` integer NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `place_reports` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `place_id` text NOT NULL REFERENCES `places`(`id`) ON DELETE cascade,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `report_type` text NOT NULL,
  `note` text DEFAULT '' NOT NULL,
  `status` text DEFAULT 'pending' NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `resolved_at` integer
);
--> statement-breakpoint
CREATE TABLE `place_verification_runs` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `place_id` text NOT NULL REFERENCES `places`(`id`) ON DELETE cascade,
  `source` text NOT NULL,
  `result` text NOT NULL,
  `evidence` text DEFAULT '' NOT NULL,
  `checked_at` integer DEFAULT (unixepoch()) NOT NULL
);
