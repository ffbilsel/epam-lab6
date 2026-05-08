-- Migration 001: initial auth schema (data-model.md).
-- Up
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE IF NOT EXISTS users (
    id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email                  citext NOT NULL UNIQUE,
    password_hash          text NOT NULL,
    email_verified_at      timestamptz,
    failed_attempt_count   integer NOT NULL DEFAULT 0,
    failed_attempt_window_start timestamptz,
    locked_until           timestamptz,
    created_at             timestamptz NOT NULL DEFAULT now(),
    updated_at             timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_locked_until ON users(locked_until) WHERE locked_until IS NOT NULL;

CREATE TABLE IF NOT EXISTS email_verifications (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   text NOT NULL UNIQUE,
    issued_at    timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL,
    consumed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_email_verifications_user ON email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_live
    ON email_verifications(user_id) WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS sessions (
    jti          uuid PRIMARY KEY,
    user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issued_at    timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL,
    revoked_at   timestamptz
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_active
    ON sessions(user_id) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
    id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   text NOT NULL UNIQUE,
    issued_at    timestamptz NOT NULL DEFAULT now(),
    expires_at   timestamptz NOT NULL,
    consumed_at  timestamptz
);
CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id);
CREATE INDEX IF NOT EXISTS idx_password_resets_live
    ON password_resets(user_id) WHERE consumed_at IS NULL;

CREATE TABLE IF NOT EXISTS audit_events (
    id           bigserial PRIMARY KEY,
    user_id      uuid REFERENCES users(id) ON DELETE SET NULL,
    event_type   text NOT NULL,
    outcome      text NOT NULL CHECK (outcome IN ('success','failure')),
    ip           inet,
    user_agent   text,
    metadata     jsonb NOT NULL DEFAULT '{}'::jsonb,
    occurred_at  timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_user_time ON audit_events(user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_type_time ON audit_events(event_type, occurred_at DESC);

-- Down
-- DROP TABLE IF EXISTS audit_events;
-- DROP TABLE IF EXISTS password_resets;
-- DROP TABLE IF EXISTS sessions;
-- DROP TABLE IF EXISTS email_verifications;
-- DROP TABLE IF EXISTS users;
