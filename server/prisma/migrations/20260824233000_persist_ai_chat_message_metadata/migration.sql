ALTER TABLE "ai_chat_messages"
ADD COLUMN "metadata" JSONB NOT NULL DEFAULT '{}';
