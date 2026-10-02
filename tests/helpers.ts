import { readFileSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';
import { drizzle } from 'drizzle-orm/pglite';
import type { Db } from '@/db';
import * as schema from '@/db/schema';

const schemaSql = readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8');

let client: PGlite | undefined;

/**
 * An in-memory PostgreSQL with the real schema, including the overlap constraint.
 * The instance is shared within a test file and emptied on every call.
 */
export async function createTestDb(): Promise<Db> {
  if (!client) {
    client = new PGlite();
    await client.exec(schemaSql);
  }
  await client.exec('TRUNCATE bookings, services RESTART IDENTITY CASCADE');
  return drizzle(client, { schema });
}

/** Builds a UTC instant from Madrid local time (CEST, UTC+2, in October 2026 before the 25th). */
export const madrid = (day: string, time: string) => new Date(`${day}T${time}:00+02:00`);
