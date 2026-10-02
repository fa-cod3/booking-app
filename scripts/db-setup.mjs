// Creates the schema and, on an empty database, the demo services.
// Usage: npm run db:setup  (reads DATABASE_URL from the environment or .env.local)
import { readFileSync } from 'node:fs';
import pg from 'pg';

const demoServices = [
  ['Classic haircut', 'Scissor or clipper cut, wash and style.', 30, 1800],
  ['Skin fade', 'Sharp fade blended to your length on top.', 45, 2200],
  ['Beard trim', 'Shape-up with hot towel and beard oil.', 20, 1200],
  ['Haircut + beard', 'The full works: cut, beard trim and hot towel.', 60, 2800],
  ['Kids cut (under 12)', 'Quick, friendly cut for the little ones.', 30, 1400],
];

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
try {
  await client.query(readFileSync(new URL('../src/db/schema.sql', import.meta.url), 'utf8'));
  const { rows } = await client.query('SELECT COUNT(*)::int AS count FROM services');
  if (rows[0].count === 0) {
    for (const [name, description, duration, price] of demoServices) {
      await client.query(
        'INSERT INTO services (name, description, duration_min, price_cents) VALUES ($1, $2, $3, $4)',
        [name, description, duration, price],
      );
    }
    console.log(`Schema ready, ${demoServices.length} demo services added`);
  } else {
    console.log('Schema ready, services already present');
  }
} finally {
  await client.end();
}
