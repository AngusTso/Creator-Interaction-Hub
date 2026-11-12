CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT polls_title_not_empty CHECK (LENGTH(BTRIM(title)) BETWEEN 1 AND 200),
  CONSTRAINT polls_status_valid CHECK (status IN ('DRAFT', 'ACTIVE', 'CLOSED'))
);

CREATE INDEX polls_event_id_idx ON polls (event_id);
CREATE UNIQUE INDEX polls_one_active_per_event_idx
  ON polls (event_id)
  WHERE status = 'ACTIVE';

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_text VARCHAR(200) NOT NULL,
  position INTEGER NOT NULL,
  CONSTRAINT poll_options_text_not_empty
    CHECK (LENGTH(BTRIM(option_text)) BETWEEN 1 AND 200),
  CONSTRAINT poll_options_position_nonnegative CHECK (position >= 0),
  CONSTRAINT poll_options_poll_position_unique UNIQUE (poll_id, position),
  CONSTRAINT poll_options_poll_id_id_unique UNIQUE (poll_id, id)
);

CREATE TABLE votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL,
  option_id UUID NOT NULL,
  voter_key VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT votes_poll_voter_unique UNIQUE (poll_id, voter_key),
  CONSTRAINT votes_poll_option_fk
    FOREIGN KEY (poll_id, option_id)
    REFERENCES poll_options(poll_id, id)
    ON DELETE CASCADE
);
