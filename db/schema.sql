CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_sub    TEXT UNIQUE NOT NULL,
  email         TEXT,
  display_name  TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS saves (
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  rom_id         TEXT NOT NULL,
  slot_number    SMALLINT NOT NULL CHECK (slot_number IN (1, 2, 3)),
  state_data     TEXT NOT NULL,
  rom_title      TEXT NOT NULL,
  saved_at       TIMESTAMPTZ DEFAULT NOW(),
  raw_size_bytes INT,
  PRIMARY KEY (user_id, rom_id, slot_number)
);
