ALTER TABLE score RENAME TO user_scores;

ALTER TABLE user_scores
    ADD COLUMN game_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    ADD COLUMN hints INT NOT NULL DEFAULT 0;

ALTER TABLE rating RENAME TO user_ratings;

ALTER TABLE email_tokens RENAME TO email_verification_tokens;

ALTER TABLE email_change_requests RENAME TO email_change_tokens;

ALTER TABLE oauth_accounts
    ADD CONSTRAINT oauth_accounts_provider_check
    CHECK (provider IN ('GOOGLE', 'GITHUB'));
