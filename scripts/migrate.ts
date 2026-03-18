import { config } from 'dotenv';
import { neon } from '@neondatabase/serverless';

config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);

async function main() {
  console.log('Running migration: 0001_social_features...');

  await sql`ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "title" varchar(255)`;
  await sql`ALTER TABLE "visits" ADD COLUMN IF NOT EXISTS "visibility" varchar(20) DEFAULT 'private'`;

  await sql`
    CREATE TABLE IF NOT EXISTS "user_profiles" (
      "clerk_user_id" varchar(255) PRIMARY KEY NOT NULL,
      "username" varchar(50) NOT NULL,
      "bio" text,
      "created_at" timestamp DEFAULT now(),
      "updated_at" timestamp DEFAULT now(),
      CONSTRAINT "user_profiles_username_unique" UNIQUE("username")
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS "follows" (
      "id" serial PRIMARY KEY NOT NULL,
      "follower_id" varchar(255) NOT NULL,
      "following_id" varchar(255) NOT NULL,
      "created_at" timestamp DEFAULT now(),
      CONSTRAINT "follows_follower_id_following_id_unique" UNIQUE("follower_id","following_id")
    )
  `;

  console.log('Migration complete.');
}

main().catch(console.error);
