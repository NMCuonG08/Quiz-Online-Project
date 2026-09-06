DO $$ BEGIN
  CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'BLOCKED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "friendships" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "friendId" UUID NOT NULL,
  "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "friendships_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "friendships_no_self_check" CHECK ("userId" <> "friendId"),
  CONSTRAINT "friendships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "friendships_friendId_fkey" FOREIGN KEY ("friendId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "friendships_userId_friendId_key"
  ON "friendships" ("userId", "friendId");
CREATE UNIQUE INDEX IF NOT EXISTS "friendships_unordered_pair_key"
  ON "friendships" (LEAST("userId", "friendId"), GREATEST("userId", "friendId"));
CREATE INDEX IF NOT EXISTS "friendships_userId_idx" ON "friendships" ("userId");
CREATE INDEX IF NOT EXISTS "friendships_friendId_idx" ON "friendships" ("friendId");
