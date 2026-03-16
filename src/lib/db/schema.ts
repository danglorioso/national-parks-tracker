import { pgTable, text, timestamp, varchar, integer, serial, jsonb, boolean } from 'drizzle-orm/pg-core';

export const parks = pgTable('parks', {
  park_code: varchar('park_code', { length: 10 }).notNull().unique().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  states: varchar('states', { length: 100 }).notNull(),
  description: text('description'),
  latitude: varchar('latitude', { length: 50 }),
  longitude: varchar('longitude', { length: 50 }),
  created_at: timestamp('created_at').defaultNow(),
});

export const visits = pgTable('visits', {
  id: serial('id').primaryKey(),
  clerk_user_id: varchar('clerk_user_id', { length: 255 }).notNull(),
  park_code: varchar('park_code', { length: 10 }).notNull().references(() => parks.park_code),
  visited_date: timestamp('visited_date').notNull(),
  rating: integer('rating'),
  notes: text('notes'),
  photos: jsonb('photos'),
  is_bucket_list: boolean('is_bucket_list').default(false),
  created_at: timestamp('created_at').defaultNow(),
  updated_at: timestamp('updated_at').defaultNow(),
});

export const userBadges = pgTable('user_badges', {
  id: serial('id').primaryKey(),
  clerk_user_id: varchar('clerk_user_id', { length: 255 }).notNull(),
  badge_id: varchar('badge_id', { length: 100 }).notNull(),
  earned_at: timestamp('earned_at').defaultNow().notNull(),
});

export type Park = typeof parks.$inferSelect;
export type NewPark = typeof parks.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;
export type UserBadge = typeof userBadges.$inferSelect;
export type NewUserBadge = typeof userBadges.$inferInsert;

