ALTER TABLE "visits" ADD COLUMN "title" varchar(255);--> statement-breakpoint
ALTER TABLE "visits" ADD COLUMN "visibility" varchar(20) DEFAULT 'private';--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"clerk_user_id" varchar(255) PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"bio" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "follows" (
	"id" serial PRIMARY KEY NOT NULL,
	"follower_id" varchar(255) NOT NULL,
	"following_id" varchar(255) NOT NULL,
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "follows_follower_id_following_id_unique" UNIQUE("follower_id","following_id")
);
