DROP INDEX IF EXISTS idx_score_leaderboard;
DROP INDEX IF EXISTS idx_email_tokens_user_id;
DROP INDEX IF EXISTS idx_email_verification_tokens_user_id;
DROP INDEX IF EXISTS idx_rating_commented_on;
DROP INDEX IF EXISTS idx_email_change_new_email;
DROP INDEX IF EXISTS idx_email_change_expires;
DROP INDEX IF EXISTS idx_user_sessions_user_active;

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
