'use client';

import { useActionState } from 'react';
import { saveServiceAction, type FormState } from '@/app/admin/actions';
import { FieldError, FormAlert } from '@/components/form';
import type { Service } from '@/db/schema';

export function ServiceForm({ service }: { service?: Service }) {
  const [state, action, pending] = useActionState<FormState, FormData>(saveServiceAction, {});
  const errors = state.fieldErrors ?? {};
  const values = state.values;
  const id = (field: string) => `${field}-${service?.id ?? 'new'}`;

  return (
    <form action={action} className="space-y-3">
      {service && <input type="hidden" name="id" value={service.id} />}
      <FormAlert tone="success" message={state.ok ? (service ? 'Saved.' : 'Service added.') : undefined} />
      <div className="grid gap-3 sm:grid-cols-[2fr_1fr_1fr]">
        <div>
          <label htmlFor={id('name')} className="label">
            Name
          </label>
          <input id={id('name')} name="name" className="input" defaultValue={values?.name ?? service?.name} required />
          <FieldError messages={errors.name} />
        </div>
        <div>
          <label htmlFor={id('duration')} className="label">
            Minutes
          </label>
          <input
            id={id('duration')}
            name="durationMin"
            type="number"
            min={10}
            max={240}
            step={5}
            className="input"
            defaultValue={values?.durationMin ?? service?.durationMin ?? 30}
            required
          />
          <FieldError messages={errors.durationMin} />
        </div>
        <div>
          <label htmlFor={id('price')} className="label">
            Price (€)
          </label>
          <input
            id={id('price')}
            name="price"
            type="number"
            min={0}
            step="0.5"
            className="input"
            defaultValue={values?.price ?? (service ? service.priceCents / 100 : undefined)}
            required
          />
          <FieldError messages={errors.price} />
        </div>
      </div>
      <div>
        <label htmlFor={id('description')} className="label">
          Description
        </label>
        <input id={id('description')} name="description" className="input" defaultValue={values?.description ?? service?.description} />
        <FieldError messages={errors.description} />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {pending ? 'Saving…' : service ? 'Save changes' : 'Add service'}
      </button>
    </form>
  );
}
