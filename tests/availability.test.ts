import { describe, expect, it } from 'vitest';
import { bookableDays, getAvailableSlots, isWithinBookingWindow, parseDay } from '@/lib/availability';
import { business } from '@/lib/business';
import { formatTime } from '@/lib/format';
import { madrid } from './helpers';

// Monday 5 October 2026, 08:00 in Madrid.
const now = madrid('2026-10-05', '08:00');
const times = (slots: Date[]) => slots.map(formatTime);

describe('parseDay', () => {
  it('parses valid days in the business time zone', () => {
    expect(parseDay('2026-10-05')?.toISOString()).toBe('2026-10-05T00:00:00.000+02:00');
  });

  it('rejects malformed or impossible dates', () => {
    expect(parseDay('2026-02-30')).toBeNull();
    expect(parseDay('05/10/2026')).toBeNull();
    expect(parseDay('')).toBeNull();
  });
});

describe('bookableDays', () => {
  it('covers the booking window starting today and flags closed days', () => {
    const days = bookableDays(now);
    expect(days).toHaveLength(business.bookingWindowDays);
    expect(days[0]).toEqual({ day: '2026-10-05', open: true });
    expect(days.find((d) => d.day === '2026-10-11')).toEqual({ day: '2026-10-11', open: false }); // Sunday
  });

  it('knows which days are inside the window', () => {
    expect(isWithinBookingWindow('2026-10-04', now)).toBe(false);
    expect(isWithinBookingWindow('2026-10-18', now)).toBe(true);
    expect(isWithinBookingWindow('2026-10-19', now)).toBe(false);
  });
});

describe('getAvailableSlots', () => {
  it('offers slots that fit inside each opening range', () => {
    const slots = times(getAvailableSlots({ day: '2026-10-06', durationMin: 60, bookings: [], now }));
    expect(slots[0]).toBe('10:00');
    expect(slots).toContain('13:00');
    expect(slots).not.toContain('13:15'); // would end after 14:00
    expect(slots).toContain('16:00');
    expect(slots.at(-1)).toBe('19:00');
  });

  it('skips slots that overlap an existing booking', () => {
    const bookings = [{ start: madrid('2026-10-06', '11:00'), end: madrid('2026-10-06', '11:30') }];
    const slots = times(getAvailableSlots({ day: '2026-10-06', durationMin: 30, bookings, now }));
    expect(slots).toContain('10:30'); // ends exactly when the booking starts
    expect(slots).not.toContain('10:45');
    expect(slots).not.toContain('11:00');
    expect(slots).not.toContain('11:15');
    expect(slots).toContain('11:30'); // starts exactly when the booking ends
  });

  it('respects the minimum notice on the current day', () => {
    const slots = times(getAvailableSlots({ day: '2026-10-05', durationMin: 30, bookings: [], now: madrid('2026-10-05', '11:10') }));
    expect(slots[0]).toBe('12:15');
  });

  it('returns nothing on closed days, past days or days outside the window', () => {
    const args = { durationMin: 30, bookings: [], now };
    expect(getAvailableSlots({ ...args, day: '2026-10-11' })).toEqual([]); // Sunday
    expect(getAvailableSlots({ ...args, day: '2026-10-04' })).toEqual([]);
    expect(getAvailableSlots({ ...args, day: '2026-11-30' })).toEqual([]);
    expect(getAvailableSlots({ ...args, day: 'not-a-day' })).toEqual([]);
  });

  it('keeps local opening hours across the daylight saving change', () => {
    // Clocks go back on Sunday 25 October 2026; Monday 26 is on CET (UTC+1).
    const slots = getAvailableSlots({ day: '2026-10-26', durationMin: 30, bookings: [], now: madrid('2026-10-20', '08:00') });
    expect(slots[0].toISOString()).toBe('2026-10-26T09:00:00.000Z'); // 10:00 local
    expect(formatTime(slots[0])).toBe('10:00');
  });
});
