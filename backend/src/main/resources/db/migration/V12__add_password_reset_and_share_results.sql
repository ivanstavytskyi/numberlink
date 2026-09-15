CREATE TABLE password_reset_tokens
(
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    token_hash VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, used_at, created_at)
SELECT user_id, token_hash, expires_at, used_at, created_at
FROM email_verification_tokens
WHERE action = 'PASSWORD_RESET';

DELETE FROM email_verification_tokens
WHERE action = 'PASSWORD_RESET';

DROP INDEX IF EXISTS idx_email_tokens_user_action_unused;

ALTER TABLE email_verification_tokens
    DROP COLUMN action;

CREATE TABLE share_results
(
    id BIGSERIAL PRIMARY KEY,
    share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    game_id BIGINT NOT NULL REFERENCES user_scores (id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (game_id)
);
