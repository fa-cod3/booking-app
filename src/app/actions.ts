'use server';

import { redirect } from 'next/navigation';
import { getDb } from '@/db';
import { BookingError, cancelByToken, createBooking } from '@/lib/bookings';
import { bookingSchema, fieldErrors, formToObject, type FieldErrors } from '@/lib/validation';

// `values` refills the inputs, because React resets a form after its action runs.
export type BookingFormState = { error?: string; fieldErrors?: FieldErrors; values?: Record<string, string> };

export async function bookAction(_prev: BookingFormState, formData: FormData): Promise<BookingFormState> {
  // Hidden honeypot field: real visitors never fill it in.
  if (formData.get('company')) return { error: 'Something went wrong. Please try again.' };

  const values = formToObject(formData, ['serviceId', 'start', 'name', 'email', 'phone']);
  const parsed = bookingSchema.safeParse(values);
  if (!parsed.success) return { fieldErrors: fieldErrors(parsed.error), values };

  let token: string;
  try {
    token = (await createBooking(getDb(), parsed.data)).cancelToken;
  } catch (err) {
    if (err instanceof BookingError) return { error: err.message, values };
    throw err;
  }
  redirect(`/booking/${token}?new=1`);
}

export async function cancelBookingAction(formData: FormData) {
  const token = String(formData.get('token') ?? '');
  try {
    await cancelByToken(getDb(), token);
  } catch (err) {
    if (!(err instanceof BookingError)) throw err;
  }
  redirect(`/booking/${encodeURIComponent(token)}`);
}
