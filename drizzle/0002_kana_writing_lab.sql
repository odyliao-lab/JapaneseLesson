CREATE TABLE `kana_mastery` (
  `email` text NOT NULL,
  `kana` text NOT NULL,
  `day` integer NOT NULL,
  `rating` text DEFAULT 'review' NOT NULL,
  `attempts` integer DEFAULT 1 NOT NULL,
  `updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
  PRIMARY KEY(`email`, `kana`)
);
--> statement-breakpoint
CREATE INDEX `kana_mastery_email_day_idx` ON `kana_mastery` (`email`, `day`);
