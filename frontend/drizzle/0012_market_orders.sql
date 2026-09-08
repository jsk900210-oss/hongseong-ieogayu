CREATE TABLE `market_orders` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `user_id` text REFERENCES `users`(`id`) ON DELETE set null,
  `product_id` text NOT NULL,
  `product_name` text NOT NULL,
  `unit_price` integer NOT NULL,
  `quantity` integer NOT NULL,
  `customer_name` text NOT NULL,
  `room_number` text NOT NULL,
  `bed_number` text NOT NULL,
  `phone` text NOT NULL,
  `status` text NOT NULL DEFAULT 'payment_pending',
  `created_at` integer NOT NULL DEFAULT (unixepoch()),
  `confirmed_at` integer
);
