import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDb } from '@/db';
import { bookableDays } from '@/lib/availability';
import { getService, getSlots } from '@/lib/bookings';
import { formatDateTime, formatDay, formatDuration, formatPrice, formatTime } from '@/lib/format';
import { BookingForm } from './booking-form';

export const metadata: Metadata = { title: 'Book an appointment' };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function BookPage({ params, searchParams }: PageProps<'/book/[serviceId]'>) {
  const { serviceId } = await params;
  const query = await searchParams;

  const id = Number(serviceId);
  const service = Number.isInteger(id) && id > 0 ? await getService(getDb(), id) : null;
  if (!service?.active) notFound();

  const days = bookableDays(new Date());
  const openDays = days.filter((d) => d.open);
  const requestedDay = openDays.find((d) => d.day === one(query.date))?.day;

  // Without a valid day in the URL, open the first day that still has free times.
  let day = requestedDay ?? openDays[0]?.day;
  let slots = day ? await getSlots(getDb(), service, day) : [];
  for (const candidate of requestedDay ? [] : openDays.slice(1)) {
    if (slots.length) break;
    day = candidate.day;
    slots = await getSlots(getDb(), service, day);
  }
  const requestedTime = one(query.time);
  const selected = slots.find((slot) => slot.toISOString() === requestedTime);

  const href = (params: Record<string, string>) => `/book/${service.id}?${new URLSearchParams(params)}`;

  return (
    <div className="space-y-8">
      <div className="space-y-1">
        <Link href="/#services" className="text-sm text-stone-500 hover:text-stone-800">
          ← All services
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{service.name}</h1>
        <p className="text-stone-600">
          {formatDuration(service.durationMin)} · {formatPrice(service.priceCents)}
        </p>
      </div>

      <section aria-labelledby="day-heading" className="space-y-3">
        <h2 id="day-heading" className="font-semibold">
          1. Pick a day
        </h2>
        <ul className="flex gap-2 overflow-x-auto pb-2">
          {days.map((d) => (
            <li key={d.day} className="shrink-0">
              {d.open ? (
                <Link
                  href={href({ date: d.day })}
                  aria-current={d.day === day ? 'date' : undefined}
                  className={`flex w-16 flex-col items-center rounded-xl border px-2 py-2 text-sm transition-colors ${
                    d.day === day
                      ? 'border-stone-900 bg-stone-900 text-white'
                      : 'border-stone-200 bg-white hover:border-stone-400'
                  }`}
                >
                  <span className="text-xs uppercase opacity-70">{formatDay(d.day, 'EEE')}</span>
                  <span className="text-lg font-semibold">{formatDay(d.day, 'd')}</span>
                  <span className="text-xs opacity-70">{formatDay(d.day, 'MMM')}</span>
                </Link>
              ) : (
                <span className="flex w-16 flex-col items-center rounded-xl border border-dashed border-stone-200 px-2 py-2 text-sm text-stone-400">
                  <span className="text-xs uppercase">{formatDay(d.day, 'EEE')}</span>
                  <span className="text-lg font-semibold">{formatDay(d.day, 'd')}</span>
                  <span className="text-xs">Closed</span>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="time-heading" className="space-y-3">
        <h2 id="time-heading" className="font-semibold">
          2. Pick a time {day && <span className="font-normal text-stone-500">on {formatDay(day, 'EEEE d MMMM')}</span>}
        </h2>
        {slots.length === 0 ? (
          <p className="card p-5 text-sm text-stone-600">No free times left on this day. Please try another day.</p>
        ) : (
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-8">
            {slots.map((slot) => {
              const iso = slot.toISOString();
              const active = iso === selected?.toISOString();
              return (
                <li key={iso}>
                  <Link
                    href={href({ date: day!, time: iso })}
                    scroll={false}
                    aria-current={active ? 'true' : undefined}
                    className={`block rounded-lg border py-2 text-center text-sm font-medium tabular-nums transition-colors ${
                      active ? 'border-amber-600 bg-amber-50 text-amber-900' : 'border-stone-200 bg-white hover:border-stone-400'
                    }`}
                  >
                    {formatTime(slot)}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {selected && (
        <section aria-labelledby="details-heading" className="card space-y-4 p-5">
          <div>
            <h2 id="details-heading" className="font-semibold">
              3. Your details
            </h2>
            <p className="text-sm text-stone-600">
              {service.name} on {formatDateTime(selected)}
            </p>
          </div>
          <BookingForm key={selected.toISOString()} serviceId={service.id} start={selected.toISOString()} />
        </section>
      )}
    </div>
  );
}
