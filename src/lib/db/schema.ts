import { pgTable, text, timestamp, varchar, integer, serial, jsonb, boolean } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: varchar('id', { length: 255 }).primaryKey(), // Clerk user ID
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }),
  first_name: varchar('first_name', { length: 255 }),
  last_name: varchar('last_name', { length: 255 }),
  email_verified: boolean('email_verified').default(false).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
});

export const parks = pgTable('parks', {
    id: serial('id').primaryKey(),
    park_code: varchar('park_code', { length: 10 }).notNull().unique(),
    name: varchar('name', { length: 255 }).notNull(),
    states: varchar('states', { length: 100 }).notNull(),
    description: text('description'),
    latitude: varchar('latitude', { length: 50 }),
    longitude: varchar('longitude', { length: 50 }),
});

export const visits = pgTable('visits', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull().references(() => users.id),
  park_code: varchar('park_code', { length: 10 }).notNull().references(() => parks.park_code),
  visitedDate: timestamp('visited_date'),
  rating: integer('rating'),
  notes: text('notes'),
  photos: jsonb('photos'), // Array of photo URLs or objects
  created_at: timestamp('created_at').defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Park = typeof parks.$inferSelect;
export type NewPark = typeof parks.$inferInsert;
export type Visit = typeof visits.$inferSelect;
export type NewVisit = typeof visits.$inferInsert;

