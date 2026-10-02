import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { checkCredentials, createSessionToken, verifySessionToken } from '@/lib/auth';
import { bookingSchema, serviceSchema } from '@/lib/validation';

const env = { ...process.env };

beforeEach(() => {
  process.env.SESSION_SECRET = 'test-secret-that-is-at-least-32-characters';
  process.env.ADMIN_EMAIL = 'Owner@Example.com';
  process.env.ADMIN_PASSWORD = 'correct horse';
});

afterEach(() => {
  process.env = { ...env };
});

describe('admin auth', () => {
  it('accepts only the configured credentials (email case-insensitive)', () => {
    expect(checkCredentials('owner@example.com', 'correct horse')).toBe(true);
    expect(checkCredentials('owner@example.com', 'wrong')).toBe(false);
    expect(checkCredentials('someone@example.com', 'correct horse')).toBe(false);
  });

  it('refuses every login when credentials are not configured', () => {
    delete process.env.ADMIN_PASSWORD;
    expect(checkCredentials('owner@example.com', '')).toBe(false);
  });

  it('round-trips a signed session token', async () => {
    const token = await createSessionToken('owner@example.com');
    expect(await verifySessionToken(token)).toBe('owner@example.com');
  });

  it('rejects tampered, foreign or missing tokens', async () => {
    const token = await createSessionToken('owner@example.com');
    expect(await verifySessionToken(token.slice(0, -2) + 'xx')).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();

    process.env.SESSION_SECRET = 'a-completely-different-secret-of-32-chars';
    expect(await verifySessionToken(token)).toBeNull();
  });

  it('requires a long session secret', async () => {
    process.env.SESSION_SECRET = 'short';
    await expect(createSessionToken('owner@example.com')).rejects.toThrow('SESSION_SECRET');
  });
});

describe('booking form validation', () => {
  const valid = { serviceId: '1', start: '2026-10-06T08:00:00.000Z', name: ' Ana ', email: ' Ana@Example.com ', phone: '' };

  it('normalises valid input', () => {
    const result = bookingSchema.parse(valid);
    expect(result).toEqual({
      serviceId: 1,
      start: new Date('2026-10-06T08:00:00.000Z'),
      name: 'Ana',
      email: 'ana@example.com',
      phone: null,
    });
  });

  it('reports field errors', () => {
    const result = bookingSchema.safeParse({ ...valid, name: 'A', email: 'nope', phone: 'call me' });
    expect(result.success).toBe(false);
    const fields = result.error!.issues.map((i) => i.path[0]);
    expect(fields).toEqual(expect.arrayContaining(['name', 'email', 'phone']));
  });

  it('rejects a malformed start time', () => {
    expect(bookingSchema.safeParse({ ...valid, start: 'tomorrow' }).success).toBe(false);
  });
});

describe('service form validation', () => {
  it('parses numbers from the form and checks ranges', () => {
    expect(serviceSchema.parse({ name: 'Haircut', description: '', durationMin: '30', price: '18.50' })).toEqual({
      name: 'Haircut',
      description: '',
      durationMin: 30,
      price: 18.5,
    });
    expect(serviceSchema.safeParse({ name: 'Haircut', description: '', durationMin: '33', price: '-1' }).success).toBe(false);
  });
});
