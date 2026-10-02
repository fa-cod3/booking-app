import { boolean, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

// Mirrors schema.sql, which also holds the overlap constraint Drizzle cannot express.
export const services = pgTable('services', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull().default(''),
  durationMin: integer('duration_min').notNull(),
  priceCents: integer('price_cents').notNull(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const bookings = pgTable('bookings', {
  id: serial('id').primaryKey(),
  serviceId: integer('service_id')
    .notNull()
    .references(() => services.id),
  customerName: text('customer_name').notNull(),
  customerEmail: text('customer_email').notNull(),
  customerPhone: text('customer_phone'),
  startAt: timestamp('start_at', { withTimezone: true }).notNull(),
  endAt: timestamp('end_at', { withTimezone: true }).notNull(),
  status: text('status', { enum: ['confirmed', 'cancelled'] }).notNull().default('confirmed'),
  cancelToken: text('cancel_token').notNull().unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
