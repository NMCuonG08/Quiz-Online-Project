-- DropIndex
DROP INDEX "public"."categories_slug_key";

-- DropIndex
DROP INDEX "public"."quizzes_slug_key";

-- AlterTable
ALTER TABLE "public"."quizzes" ADD COLUMN     "average_rating" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
ADD COLUMN     "total_ratings" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "public"."quiz_ratings" (
    "id" UUID NOT NULL,
    "quiz_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "rating" SMALLINT NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quiz_ratings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quiz_ratings_quiz_id_idx" ON "public"."quiz_ratings"("quiz_id");

-- CreateIndex
CREATE INDEX "quiz_ratings_user_id_idx" ON "public"."quiz_ratings"("user_id");

-- CreateIndex
CREATE INDEX "quiz_ratings_rating_idx" ON "public"."quiz_ratings"("rating");

-- CreateIndex
CREATE UNIQUE INDEX "quiz_ratings_quiz_id_user_id_key" ON "public"."quiz_ratings"("quiz_id", "user_id");

-- AddForeignKey
ALTER TABLE "public"."quiz_ratings" ADD CONSTRAINT "quiz_ratings_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."quiz_ratings" ADD CONSTRAINT "quiz_ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
