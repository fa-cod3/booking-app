import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import Link from 'next/link';
import { business } from '@/lib/business';
import './globals.css';

const geistSans = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });
const geistMono = Geist_Mono({ variable: '--font-geist-mono', subsets: ['latin'] });

export const metadata: Metadata = {
  title: { default: `${business.name} · Book online`, template: `%s · ${business.name}` },
  description: business.tagline,
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <header className="border-b border-stone-200 bg-white">
          <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-stone-900 text-sm text-amber-400">
                NB
              </span>
              {business.name}
            </Link>
            <Link href="/#services" className="btn btn-primary">
              Book now
            </Link>
          </div>
        </header>

        <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-10">{children}</main>

        <footer className="border-t border-stone-200 bg-white">
          <div className="mx-auto flex max-w-4xl flex-col gap-1 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:justify-between">
            <p>{business.address}</p>
            <p>
              Demo project by{' '}
              <a href="https://fa-cod3.vercel.app" className="font-medium text-stone-700 underline-offset-2 hover:underline">
                FA Code
              </a>{' '}
              ·{' '}
              <Link href="/admin" className="font-medium text-stone-700 underline-offset-2 hover:underline">
                Staff login
              </Link>
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
