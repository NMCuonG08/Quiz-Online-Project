CREATE TABLE "ai_chat_conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "session_id" TEXT NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "scope" VARCHAR(24) NOT NULL DEFAULT 'learner',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ai_chat_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_chat_messages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "role" VARCHAR(16) NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ai_chat_messages_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ai_chat_conversations_user_id_session_id_key" ON "ai_chat_conversations"("user_id", "session_id");
CREATE INDEX "ai_chat_conversations_user_id_updated_at_idx" ON "ai_chat_conversations"("user_id", "updated_at");
CREATE INDEX "ai_chat_messages_conversation_id_created_at_idx" ON "ai_chat_messages"("conversation_id", "created_at");

ALTER TABLE "ai_chat_conversations" ADD CONSTRAINT "ai_chat_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ai_chat_messages" ADD CONSTRAINT "ai_chat_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "ai_chat_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
