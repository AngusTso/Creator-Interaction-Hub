CREATE TABLE creator_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(100) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT creator_users_username_format
    CHECK (username = LOWER(username) AND LENGTH(BTRIM(username)) BETWEEN 1 AND 100)
);

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES creator_users(id) ON DELETE RESTRICT,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  public_code VARCHAR(32) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT events_title_not_empty CHECK (LENGTH(BTRIM(title)) BETWEEN 1 AND 200),
  CONSTRAINT events_public_code_format CHECK (public_code ~ '^[a-f0-9]{32}$'),
  CONSTRAINT events_status_valid CHECK (status IN ('DRAFT', 'ACTIVE', 'ENDED'))
);

CREATE INDEX events_creator_id_idx ON events (creator_id);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  display_name VARCHAR(80) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questions_display_name_not_empty
    CHECK (LENGTH(BTRIM(display_name)) BETWEEN 1 AND 80),
  CONSTRAINT questions_content_not_empty
    CHECK (LENGTH(BTRIM(content)) BETWEEN 1 AND 2000),
  CONSTRAINT questions_status_valid
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'ANSWERED'))
);

CREATE INDEX questions_event_status_created_idx
  ON questions (event_id, status, created_at);
