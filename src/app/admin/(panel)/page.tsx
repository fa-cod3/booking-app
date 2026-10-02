import type { Metadata } from 'next';
import Link from 'next/link';
import { addDays, format } from 'date-fns';
import { cancelBookingByIdAction } from '@/app/admin/actions';
import { getDb } from '@/db';
import { parseDay, toDayString } from '@/lib/availability';
import { listBookingsOn } from '@/lib/bookings';
import { formatDay, formatPrice, formatTime } from '@/lib/format';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = { title: 'Bookings', robots: { index: false } };

export default async function AdminBookingsPage({ searchParams }: PageProps<'/admin'>) {
  await requireAdmin();
  const { date } = await searchParams;

  const today = toDayString(new Date());
  const day = typeof date === 'string' && parseDay(date) ? date : today;
  const shift = (n: number) => format(addDays(parseDay(day)!, n), 'yyyy-MM-dd');

  const bookings = await listBookingsOn(getDb(), day);
  const confirmed = bookings.filter((b) => b.status === 'confirmed');
  const revenue = confirmed.reduce((sum, b) => sum + b.priceCents, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{formatDay(day, 'EEEE d MMMM')}</h1>
          <p className="text-sm text-stone-600">
            {confirmed.length} {confirmed.length === 1 ? 'booking' : 'bookings'} · {formatPrice(revenue)} expected
          </p>
        </div>
        <div className="flex gap-2">
          <Link href={`/admin?date=${shift(-1)}`} className="btn btn-secondary" aria-label="Previous day">
            ←
          </Link>
          {day !== today && (
            <Link href="/admin" className="btn btn-secondary">
              Today
            </Link>
          )}
          <Link href={`/admin?date=${shift(1)}`} className="btn btn-secondary" aria-label="Next day">
            →
          </Link>
        </div>
      </div>

      {bookings.length === 0 ? (
        <p className="card p-6 text-center text-stone-500">No bookings on this day.</p>
      ) : (
        <ul className="card divide-y divide-stone-100">
          {bookings.map((b) => {
            const cancelled = b.status === 'cancelled';
            return (
              <li key={b.id} className={`flex flex-wrap items-center gap-4 p-4 ${cancelled ? 'opacity-50' : ''}`}>
                <div className="w-24 font-mono text-sm tabular-nums">
                  {formatTime(b.startAt)}–{formatTime(b.endAt)}
                </div>
                <div className="min-w-48 flex-1">
                  <p className="font-medium">
                    {b.customerName} {cancelled && <span className="text-xs font-normal text-stone-500">(cancelled)</span>}
                  </p>
                  <p className="text-sm text-stone-500">
                    {b.serviceName} · {b.customerEmail}
                    {b.customerPhone && ` · ${b.customerPhone}`}
                  </p>
                </div>
                {!cancelled && (
                  <form action={cancelBookingByIdAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <button type="submit" className="btn btn-danger">
                      Cancel
                    </button>
                  </form>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
