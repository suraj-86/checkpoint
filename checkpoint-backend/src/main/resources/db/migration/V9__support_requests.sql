CREATE TABLE support_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID         NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    kind        VARCHAR(20)  NOT NULL CHECK (kind IN ('TOPIC_REQUEST', 'FEEDBACK', 'BUG')),
    subject     VARCHAR(100),
    message     VARCHAR(1000) NOT NULL,
    status      VARCHAR(10)  NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'DONE')),
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_support_requests_user ON support_requests (user_id, created_at DESC);
CREATE INDEX idx_support_requests_status ON support_requests (status, created_at DESC);
