CREATE TABLE IF NOT EXISTS services (
  id           SERIAL PRIMARY KEY,
  name         TEXT        NOT NULL,
  description  TEXT        NOT NULL DEFAULT '',
  duration_min INTEGER     NOT NULL CHECK (duration_min > 0),
  price_cents  INTEGER     NOT NULL CHECK (price_cents >= 0),
  active       BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bookings (
  id             SERIAL PRIMARY KEY,
  service_id     INTEGER     NOT NULL REFERENCES services(id),
  customer_name  TEXT        NOT NULL,
  customer_email TEXT        NOT NULL,
  customer_phone TEXT,
  start_at       TIMESTAMPTZ NOT NULL,
  end_at         TIMESTAMPTZ NOT NULL,
  status         TEXT        NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  cancel_token   TEXT        NOT NULL UNIQUE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT bookings_valid_range CHECK (end_at > start_at),
  -- The database itself guarantees no two confirmed bookings overlap,
  -- even if two customers submit the same slot at the same moment.
  CONSTRAINT bookings_no_overlap EXCLUDE USING gist (
    tstzrange(start_at, end_at, '[)') WITH &&
  ) WHERE (status = 'confirmed')
);

CREATE INDEX IF NOT EXISTS bookings_start_at_idx ON bookings (start_at);
