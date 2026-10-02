import Link from 'next/link';
import { logoutAction } from '@/app/admin/actions';
import { requireAdmin } from '@/lib/session';

export default async function AdminLayout({ children }: LayoutProps<'/admin'>) {
  const admin = await requireAdmin();

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <nav className="flex gap-1 text-sm font-medium">
          <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-stone-100">
            Bookings
          </Link>
          <Link href="/admin/services" className="rounded-lg px-3 py-2 hover:bg-stone-100">
            Services
          </Link>
        </nav>
        <form action={logoutAction} className="flex items-center gap-3 text-sm text-stone-500">
          <span>{admin}</span>
          <button type="submit" className="btn btn-secondary">
            Log out
          </button>
        </form>
      </div>
      {children}
    </div>
  );
}
