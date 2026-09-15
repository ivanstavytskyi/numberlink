CREATE TABLE users
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    version BIGINT DEFAULT 0 NOT NULL,
    email VARCHAR(255) UNIQUE,
    username VARCHAR(128) NOT NULL UNIQUE,
    avatar_url VARCHAR(512),
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    email_verified_at TIMESTAMPTZ,
    session_epoch INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE email_verification_tokens
(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE password_reset_tokens (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE email_change_tokens
(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    current_email VARCHAR(255),
    new_email VARCHAR(255) NOT NULL,
    confirm_code_hash (64) NOT NULL,
    cancel_token_hash VARCHAR(64) UNIQUE,
    attempts INTEGER NOT NULL DEFAULT 0,
    expires_at TIMESTAMPTZ NOT NULL,
    last_sent_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_totp
(
    user_id UUID PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
    secret VARCHAR(64),
    pending_secret VARCHAR(64),
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    confirmed_at TIMESTAMPTZ
);

CREATE TABLE user_sessions
(
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    http_session_hash VARCHAR(64) NOT NULL UNIQUE,
    device VARCHAR(128) NOT NULL,
    os VARCHAR(64) NOT NULL,
    browser VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    revoked_at TIMESTAMPTZ
);

CREATE TABLE user_scores
(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    game_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    score_result INT NOT NULL,
    hints INT DEFAULT 0 NOT NULL,
    elapsed_seconds INT NOT NULL,
    field_width INT NOT NULL,
    field_height INT NOT NULL,
    played_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE user_ratings
(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT,
    value INTEGER NOT NULL CHECK (value >= 1 AND value <= 5),
    commented_on TIMESTAMPTZ,
    rated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (user_id)
);

CREATE TABLE local_accounts
(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    encoded_password VARCHAR(255) NOT NULL,
    UNIQUE (user_id)
);

CREATE TABLE oauth_accounts
(
    id BIGSERIAL PRIMARY KEY,
    provider VARCHAR(32) NOT NULL CHECK (provider IN ('GOOGLE', 'GITHUB'),
    sub VARCHAR(255) NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id),
    display_name VARCHAR(255),
    email VARCHAR(255),
    joined_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
    UNIQUE (provider, sub),
    UNIQUE (user_id, provider)
);

CREATE TABLE share_results
(
    id BIGSERIAL PRIMARY KEY,
    share_token UUID DEFAULT gen_random_uuid() NOT NULL UNIQUE,
    game_id BIGINT NOT NULL references user_scores(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX uq_users_email_lower
    ON users (LOWER(email))
    WHERE email IS NOT NULL;

CREATE UNIQUE INDEX uq_users_username_lower
    ON users (LOWER(username));

CREATE INDEX idx_email_verification_tokens_user_unused
    ON email_verification_tokens (user_id)
    WHERE used_at IS NULL;

CREATE INDEX idx_password_reset_tokens_user_unused
    ON password_reset_tokens (user_id)
    WHERE used_at IS NULL;

CREATE INDEX idx_user_sessions_user_active
    ON user_sessions (user_id, last_seen_at DESC)
    WHERE revoked_at IS NULL;

CREATE INDEX idx_user_scores_user_played
    ON user_scores (user_id, played_at DESC);

CREATE INDEX idx_user_scores_user_best
    ON user_scores (user_id, score_result DESC);