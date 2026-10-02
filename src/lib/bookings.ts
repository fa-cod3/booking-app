import { randomBytes } from 'node:crypto';
import { and, asc, eq, gt, lt } from 'drizzle-orm';
import { addDays, addMinutes } from 'date-fns';
import type { Db } from '@/db';
import { bookings, services, type Service } from '@/db/schema';
import { getAvailableSlots, parseDay, toDayString, type Interval } from './availability';

/** An error whose message is safe to show to the customer. */
export class BookingError extends Error {}

export async function listServices(db: Db, { includeInactive = false } = {}) {
  return db
    .select()
    .from(services)
    .where(includeInactive ? undefined : eq(services.active, true))
    .orderBy(asc(services.priceCents), asc(services.id));
}

export async function getService(db: Db, id: number): Promise<Service | null> {
  const [service] = await db.select().from(services).where(eq(services.id, id));
  return service ?? null;
}

async function confirmedIntervalsOn(db: Db, day: string): Promise<Interval[]> {
  const dayStart = parseDay(day);
  if (!dayStart) return [];
  return db
    .select({ start: bookings.startAt, end: bookings.endAt })
    .from(bookings)
    .where(
      and(
        eq(bookings.status, 'confirmed'),
        lt(bookings.startAt, addDays(dayStart, 1)),
        gt(bookings.endAt, dayStart),
      ),
    );
}

export async function getSlots(db: Db, service: Service, day: string, now = new Date()) {
  const taken = await confirmedIntervalsOn(db, day);
  return getAvailableSlots({ day, durationMin: service.durationMin, bookings: taken, now });
}

function isOverlapViolation(err: unknown): boolean {
  const e = err as { code?: string; cause?: { code?: string } };
  return e?.code === '23P01' || e?.cause?.code === '23P01';
}

export async function createBooking(
  db: Db,
  input: { serviceId: number; start: Date; name: string; email: string; phone: string | null },
  now = new Date(),
) {
  const service = await getService(db, input.serviceId);
  if (!service?.active) throw new BookingError('This service is no longer available.');

  const slots = await getSlots(db, service, toDayString(input.start), now);
  if (!slots.some((slot) => slot.getTime() === input.start.getTime())) {
    throw new BookingError('That time is no longer available. Please pick another slot.');
  }

  try {
    const [booking] = await db
      .insert(bookings)
      .values({
        serviceId: service.id,
        customerName: input.name,
        customerEmail: input.email,
        customerPhone: input.phone,
        startAt: input.start,
        endAt: addMinutes(input.start, service.durationMin),
        cancelToken: randomBytes(24).toString('base64url'),
      })
      .returning();
    return booking;
  } catch (err) {
    if (isOverlapViolation(err)) {
      throw new BookingError('Someone just booked that time. Please pick another slot.');
    }
    throw err;
  }
}

const bookingWithService = {
  id: bookings.id,
  customerName: bookings.customerName,
  customerEmail: bookings.customerEmail,
  customerPhone: bookings.customerPhone,
  startAt: bookings.startAt,
  endAt: bookings.endAt,
  status: bookings.status,
  cancelToken: bookings.cancelToken,
  serviceName: services.name,
  priceCents: services.priceCents,
};

export async function getBookingByToken(db: Db, token: string) {
  const [booking] = await db
    .select(bookingWithService)
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(eq(bookings.cancelToken, token));
  return booking ?? null;
}

/** Cancels an upcoming booking through the customer's private link. */
export async function cancelByToken(db: Db, token: string, now = new Date()) {
  const [booking] = await db
    .update(bookings)
    .set({ status: 'cancelled' })
    .where(and(eq(bookings.cancelToken, token), eq(bookings.status, 'confirmed'), gt(bookings.startAt, now)))
    .returning({ id: bookings.id });
  if (!booking) throw new BookingError('This booking can no longer be cancelled.');
  return booking;
}

export async function cancelById(db: Db, id: number) {
  const [booking] = await db
    .update(bookings)
    .set({ status: 'cancelled' })
    .where(and(eq(bookings.id, id), eq(bookings.status, 'confirmed')))
    .returning({ id: bookings.id });
  return booking ?? null;
}

export async function listBookingsOn(db: Db, day: string) {
  const dayStart = parseDay(day);
  if (!dayStart) return [];
  return db
    .select(bookingWithService)
    .from(bookings)
    .innerJoin(services, eq(bookings.serviceId, services.id))
    .where(and(lt(bookings.startAt, addDays(dayStart, 1)), gt(bookings.endAt, dayStart)))
    .orderBy(asc(bookings.startAt));
}

type ServiceInput = { name: string; description: string; durationMin: number; price: number };

const toServiceRow = ({ price, ...rest }: ServiceInput) => ({ ...rest, priceCents: Math.round(price * 100) });

export async function createService(db: Db, input: ServiceInput) {
  const [service] = await db.insert(services).values(toServiceRow(input)).returning();
  return service;
}

export async function updateService(db: Db, id: number, input: ServiceInput) {
  const [service] = await db.update(services).set(toServiceRow(input)).where(eq(services.id, id)).returning();
  return service ?? null;
}

export async function setServiceActive(db: Db, id: number, active: boolean) {
  await db.update(services).set({ active }).where(eq(services.id, id));
}
