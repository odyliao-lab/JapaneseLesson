CREATE TABLE `family_invites` (
	`code` text PRIMARY KEY NOT NULL,
	`student_email` text NOT NULL,
	`expires_at` text NOT NULL,
	`redeemed_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `guardian_links` (
	`guardian_email` text NOT NULL,
	`student_email` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`guardian_email`, `student_email`)
);
--> statement-breakpoint
CREATE TABLE `lesson_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`day` integer NOT NULL,
	`score` integer NOT NULL,
	`minutes` integer NOT NULL,
	`note` text DEFAULT '' NOT NULL,
	`answers_json` text DEFAULT '{}' NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `lesson_overrides` (
	`day` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`payload_json` text DEFAULT '{}' NOT NULL,
	`updated_by` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`email` text NOT NULL,
	`title` text NOT NULL,
	`body` text NOT NULL,
	`read` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`assignment_id` integer NOT NULL,
	`student_email` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`score` integer,
	`feedback` text DEFAULT '' NOT NULL,
	`status` text DEFAULT 'submitted' NOT NULL,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`reviewed_at` text
);
