-- Migration: Add task classification and kanban fields to todos table
ALTER TABLE `todos` ADD COLUMN IF NOT EXISTS `type` VARCHAR(32) NOT NULL DEFAULT 'reminder';
ALTER TABLE `todos` ADD COLUMN IF NOT EXISTS `status` VARCHAR(32) NOT NULL DEFAULT 'todo';
ALTER TABLE `todos` ADD COLUMN IF NOT EXISTS `description` TEXT NULL;
ALTER TABLE `todos` ADD COLUMN IF NOT EXISTS `order` INT NOT NULL DEFAULT 0;
ALTER TABLE `todos` ADD COLUMN IF NOT EXISTS `completedAt` DATETIME NULL;
