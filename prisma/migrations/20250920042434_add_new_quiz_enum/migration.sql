-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "public"."QuizType" ADD VALUE 'MULTIPLE_CHOICE';
ALTER TYPE "public"."QuizType" ADD VALUE 'TRUE_FALSE';
ALTER TYPE "public"."QuizType" ADD VALUE 'FILL_IN_THE_BLANK';
ALTER TYPE "public"."QuizType" ADD VALUE 'ESSAY';
