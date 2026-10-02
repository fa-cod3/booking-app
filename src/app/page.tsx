import Link from 'next/link';
import { connection } from 'next/server';
import { getDb } from '@/db';
import { listServices } from '@/lib/bookings';
import { business } from '@/lib/business';
import { formatDuration, formatPrice } from '@/lib/format';

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default async function HomePage() {
  await connection();
  const services = await listServices(getDb());

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm font-semibold tracking-widest text-amber-700 uppercase">Online booking</p>
        <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-5xl">{business.name}</h1>
        <p className="max-w-xl text-lg text-stone-600">{business.tagline}</p>
      </section>

      <section id="services" className="scroll-mt-6 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Choose a service</h2>
        {services.length === 0 ? (
          <p className="text-stone-500">No services are available right now.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {services.map((service) => (
              <li key={service.id} className="card flex flex-col gap-4 p-5">
                <div className="flex-1 space-y-1">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="font-semibold">{service.name}</h3>
                    <span className="font-semibold">{formatPrice(service.priceCents)}</span>
                  </div>
                  <p className="text-sm text-stone-500">{formatDuration(service.durationMin)}</p>
                  {service.description && <p className="pt-1 text-sm text-stone-600">{service.description}</p>}
                </div>
                <Link href={`/book/${service.id}`} className="btn btn-primary self-start">
                  Book {service.name.toLowerCase()}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold">Opening hours</h2>
        <dl className="grid gap-x-8 gap-y-1 text-sm sm:grid-cols-2">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => {
            const ranges = business.openingHours[d] ?? [];
            return (
              <div key={d} className="flex justify-between gap-4">
                <dt className="text-stone-600">{dayNames[d]}</dt>
                <dd className="font-medium">{ranges.length ? ranges.map((r) => r.join('–')).join(', ') : 'Closed'}</dd>
              </div>
            );
          })}
        </dl>
      </section>
    </div>
  );
}
