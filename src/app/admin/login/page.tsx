import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getAdmin } from '@/lib/session';
import { LoginForm } from './login-form';

export const metadata: Metadata = { title: 'Staff login', robots: { index: false } };

export default async function LoginPage() {
  if (await getAdmin()) redirect('/admin');

  const demo =
    process.env.DEMO_MODE === 'true' ? { email: process.env.ADMIN_EMAIL ?? '', password: process.env.ADMIN_PASSWORD ?? '' } : null;

  return (
    <div className="mx-auto max-w-sm space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Staff login</h1>
        <p className="text-sm text-stone-600">Manage today&apos;s bookings and your services.</p>
      </div>
      {demo && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-semibold">Demo access</p>
          <p>
            Email: <code>{demo.email}</code>
            <br />
            Password: <code>{demo.password}</code>
          </p>
        </div>
      )}
      <LoginForm defaultEmail={demo?.email} />
    </div>
  );
}
