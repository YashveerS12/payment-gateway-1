-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────
-- TABLE: merchants
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS merchants (
    id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(100) NOT NULL,
    email        VARCHAR(150) NOT NULL UNIQUE,
    api_key      VARCHAR(64)  NOT NULL UNIQUE,
    password     VARCHAR(255),
    callback_url TEXT,
    rate_limit   INT          NOT NULL DEFAULT 100,
    is_active    BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_merchants_email   ON merchants(email);
CREATE INDEX IF NOT EXISTS idx_merchants_api_key ON merchants(api_key);

-- ─────────────────────────────────────────
-- TABLE: password_reset_tokens
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id UUID      NOT NULL REFERENCES merchants(id),
    token_hash  VARCHAR(64) NOT NULL UNIQUE,
    expires_at  TIMESTAMP NOT NULL,
    used        BOOLEAN   NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_merchant_id ON password_reset_tokens(merchant_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires_at  ON password_reset_tokens(expires_at);

-- ─────────────────────────────────────────
-- TABLE: payments
-- ─────────────────────────────────────────
CREATE TYPE payment_status AS ENUM (
    'INITIATED', 'PROCESSING', 'SUCCESS', 'FAILED', 'REFUNDED'
);

CREATE TABLE IF NOT EXISTS payments (
    id               UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    merchant_id      UUID           NOT NULL REFERENCES merchants(id),
    idempotency_key  VARCHAR(64)    NOT NULL UNIQUE,
    amount           DECIMAL(15, 2) NOT NULL,
    currency         CHAR(3)        NOT NULL DEFAULT 'INR',
    status           payment_status NOT NULL DEFAULT 'INITIATED',
    bank_adapter     VARCHAR(50),
    bank_ref_id      VARCHAR(100),
    metadata         JSONB,
    failure_reason   TEXT,
    created_at       TIMESTAMP      NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_merchant_id ON payments(merchant_id);
CREATE INDEX IF NOT EXISTS idx_payments_status      ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at  ON payments(created_at);

-- ─────────────────────────────────────────
-- TABLE: webhook_logs
-- ─────────────────────────────────────────
CREATE TYPE webhook_status AS ENUM ('PENDING', 'DELIVERED', 'FAILED');

CREATE TABLE IF NOT EXISTS webhook_logs (
    id              UUID           PRIMARY KEY DEFAULT uuid_generate_v4(),
    payment_id      UUID,
    merchant_id     UUID           REFERENCES merchants(id),
    event_type      VARCHAR(50)    NOT NULL,
    payload         JSONB,
    attempt_count   INT            NOT NULL DEFAULT 0,
    response_code   INT,
    status          webhook_status NOT NULL DEFAULT 'PENDING',
    next_retry_at   TIMESTAMP,
    last_attempt_at TIMESTAMP,
    created_at      TIMESTAMP      NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_payment_id  ON webhook_logs(payment_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_merchant_id ON webhook_logs(merchant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_status      ON webhook_logs(status);

-- ─────────────────────────────────────────
-- TABLE: recon_records
-- ─────────────────────────────────────────
CREATE TYPE mismatch_type AS ENUM (
    'AMOUNT_MISMATCH', 'MISSING_IN_LEDGER', 'MISSING_IN_DB',
    'DUPLICATE', 'STATUS_MISMATCH', 'EXTRA_IN_LEDGER'
);

CREATE TABLE IF NOT EXISTS recon_records (
    id                   UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
    recon_date           DATE          NOT NULL,
    payment_id           UUID,
    merchant_id          UUID          REFERENCES merchants(id),
    ledger_amount        DECIMAL(15,2),
    transaction_amount   DECIMAL(15,2),
    mismatch_type        mismatch_type,
    mismatch_description TEXT,
    resolved             BOOLEAN       NOT NULL DEFAULT FALSE,
    resolved_at          TIMESTAMP,
    created_at           TIMESTAMP     NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recon_records_date        ON recon_records(recon_date);
CREATE INDEX IF NOT EXISTS idx_recon_records_merchant_id ON recon_records(merchant_id);
CREATE INDEX IF NOT EXISTS idx_recon_records_resolved    ON recon_records(resolved);
CREATE INDEX IF NOT EXISTS idx_recon_records_payment_id  ON recon_records(payment_id);

-- ─────────────────────────────────────────
-- AUTO-UPDATE updated_at trigger
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_merchants_updated_at
    BEFORE UPDATE ON merchants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();