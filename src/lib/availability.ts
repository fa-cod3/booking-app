import { TZDate } from '@date-fns/tz';
import { addDays, addMinutes, format } from 'date-fns';
import { business, type BusinessConfig } from './business';

export type Interval = { start: Date; end: Date };

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;

/** Parses a `yyyy-MM-dd` string as midnight in the business time zone. */
export function parseDay(day: string, timeZone = business.timeZone): TZDate | null {
  if (!DAY_RE.test(day)) return null;
  const [y, m, d] = day.split('-').map(Number);
  const date = new TZDate(y, m - 1, d, timeZone);
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

export function toDayString(date: Date, timeZone = business.timeZone): string {
  return format(new TZDate(date, timeZone), 'yyyy-MM-dd');
}

function atLocalTime(day: TZDate, hhmm: string, timeZone: string): TZDate {
  const [h, m] = hhmm.split(':').map(Number);
  return new TZDate(day.getFullYear(), day.getMonth(), day.getDate(), h, m, timeZone);
}

/** The days customers can currently pick from, flagged open or closed. */
export function bookableDays(now: Date, config: BusinessConfig = business) {
  const today = parseDay(toDayString(now, config.timeZone), config.timeZone)!;
  return Array.from({ length: config.bookingWindowDays }, (_, i) => {
    const date = addDays(today, i);
    return {
      day: format(date, 'yyyy-MM-dd'),
      open: (config.openingHours[date.getDay()] ?? []).length > 0,
    };
  });
}

export function isWithinBookingWindow(day: string, now: Date, config: BusinessConfig = business): boolean {
  const days = bookableDays(now, config);
  return day >= days[0].day && day <= days[days.length - 1].day;
}

/**
 * Start times on `day` where a service of `durationMin` fits inside opening hours,
 * respects the minimum notice and does not overlap any existing booking.
 */
export function getAvailableSlots({
  day,
  durationMin,
  bookings,
  now,
  config = business,
}: {
  day: string;
  durationMin: number;
  bookings: Interval[];
  now: Date;
  config?: BusinessConfig;
}): Date[] {
  const date = parseDay(day, config.timeZone);
  if (!date || !isWithinBookingWindow(day, now, config)) return [];

  const earliest = addMinutes(now, config.minLeadMinutes);
  const slots: Date[] = [];

  for (const [open, close] of config.openingHours[date.getDay()] ?? []) {
    const closesAt = atLocalTime(date, close, config.timeZone);
    for (
      let start = atLocalTime(date, open, config.timeZone);
      addMinutes(start, durationMin) <= closesAt;
      start = addMinutes(start, config.slotStepMinutes)
    ) {
      const end = addMinutes(start, durationMin);
      if (start < earliest) continue;
      if (bookings.some((b) => start < b.end && end > b.start)) continue;
      slots.push(new Date(start.getTime()));
    }
  }
  return slots;
}
