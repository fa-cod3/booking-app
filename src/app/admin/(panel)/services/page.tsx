import type { Metadata } from 'next';
import { toggleServiceAction } from '@/app/admin/actions';
import { getDb } from '@/db';
import { listServices } from '@/lib/bookings';
import { requireAdmin } from '@/lib/session';
import { ServiceForm } from './service-form';

export const metadata: Metadata = { title: 'Services', robots: { index: false } };

export default async function AdminServicesPage() {
  await requireAdmin();
  const services = await listServices(getDb(), { includeInactive: true });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Services</h1>

      <ul className="space-y-4">
        {services.map((service) => (
          <li key={service.id} className={`card space-y-4 p-5 ${service.active ? '' : 'bg-stone-50'}`}>
            <div className="flex items-center justify-between gap-4">
              <h2 className="font-semibold">
                {service.name}{' '}
                {!service.active && <span className="text-xs font-normal text-stone-500">(hidden from customers)</span>}
              </h2>
              <form action={toggleServiceAction}>
                <input type="hidden" name="id" value={service.id} />
                <input type="hidden" name="active" value={String(!service.active)} />
                <button type="submit" className="btn btn-secondary">
                  {service.active ? 'Hide' : 'Show'}
                </button>
              </form>
            </div>
            <ServiceForm service={service} />
          </li>
        ))}
      </ul>

      <section className="card space-y-4 p-5">
        <h2 className="font-semibold">Add a service</h2>
        <ServiceForm />
      </section>
    </div>
  );
}
