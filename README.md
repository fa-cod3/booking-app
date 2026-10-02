# Booking App — Next.js + PostgreSQL

[![CI](https://github.com/fa-cod3/booking-app/actions/workflows/ci.yml/badge.svg)](https://github.com/fa-cod3/booking-app/actions/workflows/ci.yml)

An online booking system for a small business (a fictional barbershop, **Northside Barbers**). Customers pick a service, a day and a free time slot and book in under a minute; staff manage the day's bookings and the service list from a protected admin panel.

**Live demo:** https://fa-code-booking.vercel.app (the staff login page shows demo credentials)

## Features

**For customers**
- Service list with prices and durations, plus opening hours
- Day picker for the next 14 days and a grid of free time slots that respects opening hours, lunch breaks, minimum notice and existing bookings
- Booking form with server-side validation and friendly error messages
- Private link to view or cancel the booking (no account needed)

**For staff**
- Login with a signed, HTTP-only session cookie (JWT via `jose`)
- Bookings per day with expected revenue, previous/next day navigation and one-click cancellation
- Create and edit services, or hide them from customers

**Under the hood**
- 🛡️ **No double bookings, guaranteed by the database**: a PostgreSQL exclusion constraint on `tstzrange(start_at, end_at)` rejects overlapping confirmed bookings, even when two customers submit the same slot at the same moment
- 🕒 **Time zone aware**: slots are computed in the business time zone (Europe/Madrid) and stay correct across daylight saving changes
- ⚡ Next.js 16 App Router with Server Components and Server Actions; every admin action re-checks the session
- 🧪 **32 tests** (Vitest) running against a real in-memory PostgreSQL ([PGlite]), including the overlap constraint and a race between two customers
- ✅ GitHub Actions CI: lint, type check, tests and production build

## Tech stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Database | PostgreSQL (Neon in production), Drizzle ORM |
| Validation | zod |
| Auth | `jose` (HS256 session JWT in an HTTP-only cookie) |
| Dates | date-fns + @date-fns/tz |
| Testing | Vitest, PGlite |
| Hosting | Vercel |

## Getting started

```bash
git clone https://github.com/fa-cod3/booking-app.git
cd booking-app
npm install

cp .env.example .env.local   # set DATABASE_URL, SESSION_SECRET and the admin login
npm run db:setup             # creates the schema and the demo services
npm run dev                  # http://localhost:3000
```

Any PostgreSQL 14+ database works (local Docker, Neon, Supabase...).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server |
| `npm run build` / `npm start` | Production build and server |
| `npm test` | Run the test suite |
| `npm run typecheck` | Generate route types and run `tsc` |
| `npm run lint` | Run ESLint |
| `npm run db:setup` | Create the schema and seed demo services (idempotent) |

## Project structure

```
src/
├── app/
│   ├── page.tsx                 # Services and opening hours
│   ├── book/[serviceId]/        # Day and time picker + booking form
│   ├── booking/[token]/         # Private booking page with cancellation
│   ├── admin/                   # Login, bookings per day, services
│   └── actions.ts               # Public Server Actions
├── db/
│   ├── schema.sql               # Tables + the no-overlap exclusion constraint
│   └── schema.ts                # Drizzle schema
├── lib/
│   ├── availability.ts          # Pure slot calculation (time zone aware)
│   ├── bookings.ts              # Data access and booking rules
│   ├── auth.ts / session.ts     # Credentials check and session cookie
│   └── validation.ts            # zod schemas
└── proxy.ts                     # Optimistic redirect for /admin
tests/                           # Vitest suites (PGlite-backed)
```

## Configuration

Opening hours, slot length, minimum notice and the booking window live in [`src/lib/business.ts`](src/lib/business.ts).

## License

MIT

[PGlite]: https://pglite.dev
