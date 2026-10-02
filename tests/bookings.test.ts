import { beforeEach, describe, expect, it } from 'vitest';
import type { Db } from '@/db';
import { bookings, type Service } from '@/db/schema';
import {
  BookingError,
  cancelById,
  cancelByToken,
  createBooking,
  createService,
  getBookingByToken,
  getSlots,
  listBookingsOn,
  listServices,
  setServiceActive,
  updateService,
} from '@/lib/bookings';
import { createTestDb, madrid } from './helpers';

const now = madrid('2026-10-05', '08:00');
const customer = { name: 'Ana García', email: 'ana@example.com', phone: null };

let db: Db;
let haircut: Service;

beforeEach(async () => {
  db = await createTestDb();
  haircut = await createService(db, { name: 'Haircut', description: '', durationMin: 30, price: 18 });
});

const book = (start: Date, serviceId = haircut.id) => createBooking(db, { serviceId, start, ...customer }, now);

describe('services', () => {
  it('stores prices in cents and lists only active services by default', async () => {
    const beard = await createService(db, { name: 'Beard trim', description: 'Hot towel', durationMin: 20, price: 12.5 });
    expect(beard.priceCents).toBe(1250);

    await setServiceActive(db, beard.id, false);
    expect((await listServices(db)).map((s) => s.name)).toEqual(['Haircut']);
    expect(await listServices(db, { includeInactive: true })).toHaveLength(2);
  });

  it('updates a service', async () => {
    const updated = await updateService(db, haircut.id, { name: 'Skin fade', description: 'x', durationMin: 45, price: 22 });
    expect(updated).toMatchObject({ name: 'Skin fade', durationMin: 45, priceCents: 2200 });
  });
});

describe('createBooking', () => {
  it('creates a confirmed booking with an end time and a private cancel token', async () => {
    const booking = await book(madrid('2026-10-06', '10:00'));
    expect(booking.status).toBe('confirmed');
    expect(booking.endAt.toISOString()).toBe(madrid('2026-10-06', '10:30').toISOString());
    expect(booking.cancelToken.length).toBeGreaterThanOrEqual(32);
  });

  it('removes the booked time from the available slots', async () => {
    await book(madrid('2026-10-06', '10:00'));
    const slots = (await getSlots(db, haircut, '2026-10-06', now)).map((s) => s.getTime());
    expect(slots).not.toContain(madrid('2026-10-06', '10:00').getTime());
    expect(slots).not.toContain(madrid('2026-10-06', '10:15').getTime());
    expect(slots).toContain(madrid('2026-10-06', '10:30').getTime());
  });

  it('rejects a slot that is already taken', async () => {
    await book(madrid('2026-10-06', '10:00'));
    await expect(book(madrid('2026-10-06', '10:15'))).rejects.toThrow(BookingError);
  });

  it('rejects times outside opening hours or not on the slot grid', async () => {
    await expect(book(madrid('2026-10-06', '14:30'))).rejects.toThrow(BookingError);
    await expect(book(madrid('2026-10-06', '10:07'))).rejects.toThrow(BookingError);
    await expect(book(madrid('2026-10-11', '10:00'))).rejects.toThrow(BookingError); // Sunday
  });

  it('rejects inactive or unknown services', async () => {
    await setServiceActive(db, haircut.id, false);
    await expect(book(madrid('2026-10-06', '10:00'))).rejects.toThrow('no longer available');
    await expect(book(madrid('2026-10-06', '10:00'), 999)).rejects.toThrow(BookingError);
  });

  it('is protected by the database even if the app check is bypassed', async () => {
    await book(madrid('2026-10-06', '10:00'));
    const insertOverlapping = db.insert(bookings).values({
      serviceId: haircut.id,
      ...{ customerName: 'X', customerEmail: 'x@example.com' },
      startAt: madrid('2026-10-06', '10:15'),
      endAt: madrid('2026-10-06', '10:45'),
      cancelToken: 'manual-token',
    });
    await expect(insertOverlapping).rejects.toThrow();
  });

  it('turns a race between two customers into a friendly error', async () => {
    const start = madrid('2026-10-06', '10:00');
    const results = await Promise.allSettled([book(start), book(start)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const [failure] = results.filter((r) => r.status === 'rejected');
    expect((failure as PromiseRejectedResult).reason).toBeInstanceOf(BookingError);
  });
});

describe('cancelling', () => {
  it('lets the customer cancel with their token and frees the slot', async () => {
    const start = madrid('2026-10-06', '10:00');
    const booking = await book(start);
    await cancelByToken(db, booking.cancelToken, now);

    expect((await getBookingByToken(db, booking.cancelToken))?.status).toBe('cancelled');
    await expect(book(start)).resolves.toMatchObject({ status: 'confirmed' });
  });

  it('refuses to cancel twice, with a wrong token, or after the start time', async () => {
    const booking = await book(madrid('2026-10-06', '10:00'));
    await expect(cancelByToken(db, 'wrong-token', now)).rejects.toThrow(BookingError);
    await expect(cancelByToken(db, booking.cancelToken, madrid('2026-10-06', '10:05'))).rejects.toThrow(BookingError);
    await cancelByToken(db, booking.cancelToken, now);
    await expect(cancelByToken(db, booking.cancelToken, now)).rejects.toThrow(BookingError);
  });

  it('lets the admin cancel by id', async () => {
    const booking = await book(madrid('2026-10-06', '10:00'));
    expect(await cancelById(db, booking.id)).toEqual({ id: booking.id });
    expect(await cancelById(db, booking.id)).toBeNull();
  });
});

describe('listBookingsOn', () => {
  it('lists the bookings of a day in time order with the service name', async () => {
    await book(madrid('2026-10-06', '16:00'));
    await book(madrid('2026-10-06', '10:00'));
    await book(madrid('2026-10-07', '10:00'));

    const day = await listBookingsOn(db, '2026-10-06');
    expect(day.map((b) => b.startAt.toISOString())).toEqual([
      madrid('2026-10-06', '10:00').toISOString(),
      madrid('2026-10-06', '16:00').toISOString(),
    ]);
    expect(day[0].serviceName).toBe('Haircut');
  });

  it('returns an empty list for an invalid day', async () => {
    expect(await listBookingsOn(db, 'not-a-day')).toEqual([]);
  });
});
