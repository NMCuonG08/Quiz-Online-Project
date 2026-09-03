-- Keep the database enum aligned with server/prisma/schema.prisma.
ALTER TYPE "public"."QuizType" ADD VALUE IF NOT EXISTS 'SINGLE_CHOICE';
