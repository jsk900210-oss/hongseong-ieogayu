ALTER TABLE `market_orders` ADD `order_group_code` text;
CREATE INDEX `market_orders_order_group_code_idx` ON `market_orders` (`order_group_code`);
