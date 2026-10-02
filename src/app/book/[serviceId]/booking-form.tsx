'use client';

import { useActionState } from 'react';
import { bookAction, type BookingFormState } from '@/app/actions';
import { FieldError, FormAlert } from '@/components/form';

export function BookingForm({ serviceId, start }: { serviceId: number; start: string }) {
  const [state, action, pending] = useActionState<BookingFormState, FormData>(bookAction, {});
  const errors = state.fieldErrors ?? {};
  const values = state.values ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="serviceId" value={serviceId} />
      <input type="hidden" name="start" value={start} />
      <div aria-hidden className="hidden">
        <label>
          Company <input name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <FormAlert message={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="label">
            Name
          </label>
          <input id="name" name="name" className="input" autoComplete="name" defaultValue={values.name} required aria-invalid={!!errors.name} />
          <FieldError messages={errors.name} />
        </div>
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input id="email" name="email" type="email" className="input" autoComplete="email" defaultValue={values.email} required aria-invalid={!!errors.email} />
          <FieldError messages={errors.email} />
        </div>
        <div>
          <label htmlFor="phone" className="label">
            Phone <span className="font-normal text-stone-400">(optional)</span>
          </label>
          <input id="phone" name="phone" type="tel" className="input" autoComplete="tel" defaultValue={values.phone} aria-invalid={!!errors.phone} />
          <FieldError messages={errors.phone} />
        </div>
      </div>

      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={pending}>
        {pending ? 'Booking…' : 'Confirm booking'}
      </button>
    </form>
  );
}
