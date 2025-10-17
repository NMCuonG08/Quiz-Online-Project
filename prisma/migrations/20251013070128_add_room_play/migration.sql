-- CreateEnum
CREATE TYPE "public"."RoomStatus" AS ENUM ('OPEN', 'IN_GAME', 'CLOSED');

-- AlterTable
ALTER TABLE "public"."active_connections" ADD COLUMN     "room_id" UUID;

-- CreateTable
CREATE TABLE "public"."quiz_rooms" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "owner_id" UUID NOT NULL,
    "room_code" TEXT NOT NULL,
    "status" "public"."RoomStatus" NOT NULL DEFAULT 'OPEN',
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "password_hash" TEXT,
    "max_participants" INTEGER NOT NULL DEFAULT 100,
    "current_participants" INTEGER NOT NULL DEFAULT 0,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."room_participants" (
    "id" UUID NOT NULL,
    "room_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "status" "public"."ParticipantStatus" NOT NULL DEFAULT 'JOINED',
    "device_info" JSONB NOT NULL DEFAULT '{}',
    "ip_address" TEXT,

    CONSTRAINT "room_participants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "quiz_rooms_room_code_key" ON "public"."quiz_rooms"("room_code");

-- CreateIndex
CREATE INDEX "quiz_rooms_quiz_id_idx" ON "public"."quiz_rooms"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_rooms_owner_id_idx" ON "public"."quiz_rooms"("owner_id");

-- CreateIndex
CREATE INDEX "quiz_rooms_status_idx" ON "public"."quiz_rooms"("status");

-- CreateIndex
CREATE INDEX "quiz_rooms_room_code_idx" ON "public"."quiz_rooms"("room_code");

-- CreateIndex
CREATE INDEX "room_participants_room_id_idx" ON "public"."room_participants"("room_id");

-- CreateIndex
CREATE INDEX "room_participants_user_id_idx" ON "public"."room_participants"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "room_participants_room_id_user_id_key" ON "public"."room_participants"("room_id", "user_id");

-- CreateIndex
CREATE INDEX "active_connections_room_id_idx" ON "public"."active_connections"("room_id");

-- AddForeignKey
ALTER TABLE "public"."quiz_rooms" ADD CONSTRAINT "quiz_rooms_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."room_participants" ADD CONSTRAINT "room_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."quiz_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."active_connections" ADD CONSTRAINT "active_connections_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "public"."quiz_rooms"("id") ON DELETE SET NULL ON UPDATE CASCADE;
