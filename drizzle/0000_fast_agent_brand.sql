CREATE TABLE "parks" (
	"id" serial PRIMARY KEY NOT NULL,
	"park_code" varchar(10) NOT NULL,
	"name" varchar(255) NOT NULL,
	"states" varchar(100) NOT NULL,
	"description" text,
	"latitude" varchar(50),
	"longitude" varchar(50),
	CONSTRAINT "parks_park_code_unique" UNIQUE("park_code")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"name" varchar(255),
	"first_name" varchar(255),
	"last_name" varchar(255),
	"email_verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "visits" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" varchar(255) NOT NULL,
	"park_code" varchar(10) NOT NULL,
	"visited_date" timestamp,
	"rating" integer,
	"notes" text,
	"photos" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "visits" ADD CONSTRAINT "visits_park_code_parks_park_code_fk" FOREIGN KEY ("park_code") REFERENCES "public"."parks"("park_code") ON DELETE no action ON UPDATE no action;