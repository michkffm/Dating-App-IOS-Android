CREATE TABLE IF NOT EXISTS hp_users (
  id uuid PRIMARY KEY,
  email varchar(254) UNIQUE NOT NULL,
  password_hash text NOT NULL,
  nickname varchar(24) NOT NULL,
  birthdate date NOT NULL,
  bio varchar(500) NOT NULL DEFAULT '',
  photo_id uuid UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS hp_sessions (
  key_hash char(64) PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS hp_session_expiry ON hp_sessions(expires_at);
CREATE TABLE IF NOT EXISTS hp_choices (
  actor uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  target uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  decision varchar(4) NOT NULL CHECK (decision IN ('like','pass')),
  CHECK (actor <> target),
  PRIMARY KEY(actor,target)
);
CREATE TABLE IF NOT EXISTS hp_blocks (
  actor uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  target uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  CHECK (actor <> target),
  PRIMARY KEY(actor,target)
);
CREATE TABLE IF NOT EXISTS hp_matches (
  id uuid PRIMARY KEY,
  first_user uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  second_user uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  CHECK (first_user < second_user),
  UNIQUE(first_user,second_user)
);
CREATE INDEX IF NOT EXISTS hp_matches_second_user ON hp_matches(second_user);
CREATE TABLE IF NOT EXISTS hp_messages (
  id uuid PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES hp_matches(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  body varchar(1000) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS hp_chat_history ON hp_messages(match_id,created_at DESC,id);
CREATE TABLE IF NOT EXISTS hp_reports (
  id uuid PRIMARY KEY,
  reporter uuid REFERENCES hp_users(id) ON DELETE SET NULL,
  target uuid REFERENCES hp_users(id) ON DELETE SET NULL,
  reason varchar(1000) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reporter,target)
);
CREATE TABLE IF NOT EXISTS hp_media_gc (
  id uuid PRIMARY KEY,
  enqueued_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE hp_users ADD COLUMN IF NOT EXISTS verified_at timestamptz;
CREATE TABLE IF NOT EXISTS hp_account_tokens (
  token_hash char(64) PRIMARY KEY,
  purpose varchar(6) NOT NULL CHECK (purpose IN ('verify','reset')),
  user_id uuid NOT NULL REFERENCES hp_users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL
);
CREATE INDEX IF NOT EXISTS hp_account_token_expiry ON hp_account_tokens(expires_at);
CREATE INDEX IF NOT EXISTS hp_account_token_owner ON hp_account_tokens(user_id,purpose);
ALTER TABLE hp_users ADD COLUMN IF NOT EXISTS suspended_at timestamptz;
ALTER TABLE hp_reports ADD COLUMN IF NOT EXISTS handled_at timestamptz;
ALTER TABLE hp_reports ADD COLUMN IF NOT EXISTS resolution varchar(16) CHECK (resolution IN ('dismissed','suspended'));
CREATE INDEX IF NOT EXISTS hp_open_reports ON hp_reports(created_at,id) WHERE handled_at IS NULL;
CREATE TABLE IF NOT EXISTS hp_mail_daily_usage (
  day date PRIMARY KEY,
  count integer NOT NULL CHECK (count > 0)
);

-- Foreign-key lookups used when invalidating sessions or deleting an account.
CREATE INDEX IF NOT EXISTS hp_sessions_user ON hp_sessions(user_id);
CREATE INDEX IF NOT EXISTS hp_choices_target ON hp_choices(target);
CREATE INDEX IF NOT EXISTS hp_blocks_target ON hp_blocks(target);
CREATE INDEX IF NOT EXISTS hp_messages_sender ON hp_messages(sender_id);
CREATE INDEX IF NOT EXISTS hp_reports_target ON hp_reports(target);
