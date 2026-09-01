CREATE TABLE "ai_write_idempotency" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "idempotency_key" VARCHAR(128) NOT NULL,
    "operation" VARCHAR(80) NOT NULL,
    "request_hash" VARCHAR(64) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'PROCESSING',
    "response" JSONB,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_write_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_write_idempotency_user_id_idempotency_key_key"
    ON "ai_write_idempotency"("user_id", "idempotency_key");
CREATE INDEX "ai_write_idempotency_expires_at_idx"
    ON "ai_write_idempotency"("expires_at");

ALTER TABLE "ai_write_idempotency"
    ADD CONSTRAINT "ai_write_idempotency_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
