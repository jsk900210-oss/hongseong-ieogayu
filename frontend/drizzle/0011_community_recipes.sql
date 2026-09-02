CREATE TABLE `community_recipes` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text NOT NULL REFERENCES `users`(`id`) ON DELETE cascade,
  `title` text NOT NULL,
  `ingredient` text NOT NULL,
  `summary` text NOT NULL,
  `source_name` text NOT NULL DEFAULT '직접 작성',
  `source_url` text NOT NULL DEFAULT '',
  `created_at` integer NOT NULL DEFAULT (unixepoch())
);
