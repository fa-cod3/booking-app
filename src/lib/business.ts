/** Opening hours per weekday (0 = Sunday), as local [open, close] ranges. */
export type OpeningHours = Record<number, [string, string][]>;

export type BusinessConfig = {
  name: string;
  tagline: string;
  address: string;
  timeZone: string;
  currency: string;
  /** Minutes between possible start times. */
  slotStepMinutes: number;
  /** Minimum notice before a booking can start. */
  minLeadMinutes: number;
  /** How many days ahead (including today) customers can book. */
  bookingWindowDays: number;
  openingHours: OpeningHours;
};

const weekday: [string, string][] = [
  ['10:00', '14:00'],
  ['16:00', '20:00'],
];

export const business: BusinessConfig = {
  name: 'Northside Barbers',
  tagline: 'Classic cuts, skin fades and beard trims. Book your chair online in under a minute.',
  address: 'Carrer de Mallorca 123, Barcelona',
  timeZone: 'Europe/Madrid',
  currency: 'EUR',
  slotStepMinutes: 15,
  minLeadMinutes: 60,
  bookingWindowDays: 14,
  openingHours: {
    0: [],
    1: weekday,
    2: weekday,
    3: weekday,
    4: weekday,
    5: weekday,
    6: [['10:00', '14:00']],
  },
};
