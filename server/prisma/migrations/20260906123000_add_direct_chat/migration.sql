DO $$ BEGIN
  CREATE TYPE "ConversationType" AS ENUM ('DIRECT', 'GROUP');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE "MessageType" AS ENUM ('TEXT', 'QUIZ_SHARE', 'RESULT_SHARE', 'ROOM_INVITE', 'CHALLENGE', 'SYSTEM');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "conversations" (
  "id" UUID NOT NULL,
  "type" "ConversationType" NOT NULL DEFAULT 'DIRECT',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);
CREATE TABLE IF NOT EXISTS "conversation_members" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "user_id" UUID NOT NULL,
  "last_read_at" TIMESTAMP(3),
  "muted" BOOLEAN NOT NULL DEFAULT false,
  "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE TABLE IF NOT EXISTS "messages" (
  "id" UUID NOT NULL,
  "conversation_id" UUID NOT NULL,
  "sender_id" UUID NOT NULL,
  "client_message_id" TEXT NOT NULL,
  "type" "MessageType" NOT NULL DEFAULT 'TEXT',
  "body" TEXT NOT NULL,
  "data" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "messages_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "conversation_members_conversation_id_user_id_key" ON "conversation_members" ("conversation_id", "user_id");
CREATE UNIQUE INDEX IF NOT EXISTS "messages_sender_id_client_message_id_key" ON "messages" ("sender_id", "client_message_id");
CREATE INDEX IF NOT EXISTS "conversations_updated_at_idx" ON "conversations" ("updated_at");
CREATE INDEX IF NOT EXISTS "conversation_members_user_id_last_read_at_idx" ON "conversation_members" ("user_id", "last_read_at");
CREATE INDEX IF NOT EXISTS "messages_conversation_id_created_at_idx" ON "messages" ("conversation_id", "created_at");
