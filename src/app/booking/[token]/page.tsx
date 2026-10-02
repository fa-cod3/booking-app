import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { cancelBookingAction } from '@/app/actions';
import { FormAlert } from '@/components/form';
import { getDb } from '@/db';
import { getBookingByToken } from '@/lib/bookings';
import { business } from '@/lib/business';
import { formatDateTime, formatPrice } from '@/lib/format';

export const metadata: Metadata = { title: 'Your booking', robots: { index: false } };

export default async function BookingPage({ params, searchParams }: PageProps<'/booking/[token]'>) {
  const { token } = await params;
  const { new: isNew } = await searchParams;

  const booking = await getBookingByToken(getDb(), token);
  if (!booking) notFound();

  const upcoming = booking.startAt > new Date();
  const cancelled = booking.status === 'cancelled';

  return (
    <div className="mx-auto max-w-lg space-y-6">
      {isNew && !cancelled && <FormAlert tone="success" message="You're booked! Keep this page's link to manage your booking." />}

      <div className="card space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm text-stone-500">Booking #{booking.id}</p>
            <h1 className="text-2xl font-bold tracking-tight">{booking.serviceName}</h1>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              cancelled ? 'bg-stone-100 text-stone-600' : 'bg-green-100 text-green-800'
            }`}
          >
            {cancelled ? 'Cancelled' : 'Confirmed'}
          </span>
        </div>

        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
          <dt className="text-stone-500">When</dt>
          <dd className="font-medium">{formatDateTime(booking.startAt)}</dd>
          <dt className="text-stone-500">Where</dt>
          <dd>{business.address}</dd>
          <dt className="text-stone-500">Price</dt>
          <dd>{formatPrice(booking.priceCents)}, pay at the shop</dd>
          <dt className="text-stone-500">Name</dt>
          <dd>{booking.customerName}</dd>
        </dl>

        {!cancelled && upcoming && (
          <form action={cancelBookingAction} className="border-t border-stone-100 pt-5">
            <input type="hidden" name="token" value={booking.cancelToken} />
            <p className="mb-3 text-sm text-stone-600">Can&apos;t make it? Free up the chair for someone else.</p>
            <button type="submit" className="btn btn-danger">
              Cancel booking
            </button>
          </form>
        )}
      </div>

      <Link href="/" className="btn btn-secondary">
        Book another appointment
      </Link>
    </div>
  );
}
