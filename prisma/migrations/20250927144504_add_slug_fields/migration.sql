-- AlterTable
ALTER TABLE "public"."categories" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "public"."questions" ADD COLUMN     "slug" TEXT;

-- AlterTable
ALTER TABLE "public"."quizzes" ADD COLUMN     "slug" TEXT;

-- Update existing records with unique slugs
UPDATE "public"."categories" SET "slug" = CONCAT('category-', "id") WHERE "slug" IS NULL;
UPDATE "public"."questions" SET "slug" = CONCAT('question-', "id") WHERE "slug" IS NULL;
UPDATE "public"."quizzes" SET "slug" = CONCAT('quiz-', "id") WHERE "slug" IS NULL;

-- Make slug NOT NULL for categories and quizzes
ALTER TABLE "public"."categories" ALTER COLUMN "slug" SET NOT NULL;
ALTER TABLE "public"."quizzes" ALTER COLUMN "slug" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "categories_slug_key" ON "public"."categories"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "questions_slug_key" ON "public"."questions"("slug") WHERE "slug" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "quizzes_slug_key" ON "public"."quizzes"("slug");