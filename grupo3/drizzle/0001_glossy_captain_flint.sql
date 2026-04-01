CREATE TABLE `appointments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`clientId` int NOT NULL,
	`barberId` int NOT NULL,
	`serviceId` int NOT NULL,
	`startTime` datetime NOT NULL,
	`endTime` datetime NOT NULL,
	`status` enum('scheduled','completed','cancelled') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `appointments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `barberServices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barberId` int NOT NULL,
	`serviceId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `barberServices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `barberWorkingHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`barberId` int NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isWorkingDay` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `barberWorkingHours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `barbers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`specialty` varchar(100),
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `barbers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `operatingHours` (
	`id` int AUTO_INCREMENT NOT NULL,
	`dayOfWeek` int NOT NULL,
	`startTime` varchar(5) NOT NULL,
	`endTime` varchar(5) NOT NULL,
	`isOpen` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `operatingHours_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`price` decimal(10,2) NOT NULL,
	`durationMinutes` int NOT NULL,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`minimumAdvanceBookingHours` int NOT NULL DEFAULT 1,
	`businessName` varchar(100) NOT NULL DEFAULT 'Navalha Barbearia',
	`businessPhone` varchar(20),
	`businessEmail` varchar(320),
	`businessAddress` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `settings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','barber','admin') NOT NULL DEFAULT 'user';--> statement-breakpoint
ALTER TABLE `users` ADD `phone` varchar(20);