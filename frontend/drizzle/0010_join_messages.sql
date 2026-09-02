CREATE TABLE `join_messages` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `join_id` integer NOT NULL,
  `user_id` text NOT NULL,
  `body` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`join_id`) REFERENCES `joins`(`id`) ON UPDATE no action ON DELETE cascade,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
