import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { business } from './business';
import { parseDay } from './availability';

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('en-IE', { style: 'currency', currency: business.currency }).format(cents / 100);
}

export function formatTime(date: Date): string {
  return format(new TZDate(date, business.timeZone), 'HH:mm');
}

export function formatDateTime(date: Date): string {
  return format(new TZDate(date, business.timeZone), "EEEE d MMMM yyyy 'at' HH:mm");
}

export function formatDay(day: string, pattern = 'EEE d MMM'): string {
  const date = parseDay(day);
  return date ? format(date, pattern) : day;
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return [h && `${h} h`, m && `${m} min`].filter(Boolean).join(' ');
}
