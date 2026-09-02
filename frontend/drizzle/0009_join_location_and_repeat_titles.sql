ALTER TABLE `joins` ADD `exact_location` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `joins` ADD `location_visibility` text DEFAULT 'public' NOT NULL;--> statement-breakpoint
DROP INDEX `idx_joins_owner_title`;
