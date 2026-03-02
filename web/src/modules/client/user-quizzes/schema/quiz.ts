import { z } from "zod";

export const quizSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Quiz title is required")
    .max(200, "Title must be less than 200 characters"),
  slug: z
    .string()
    .trim()
    .min(1, "Slug is required")
    .max(100, "Slug must be less than 100 characters"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description must be less than 1000 characters"),
  instructions: z
    .string()
    .trim()
    .min(1, "Instructions are required")
    .max(2000, "Instructions must be less than 2000 characters"),
  category_id: z.string().min(1, "Category is required"),
  difficulty_level: z.enum(["EASY", "MEDIUM", "HARD"], {
    required_error: "Difficulty level is required",
  }),
  time_limit: z
    .number()
    .min(1, "Time limit must be at least 1 minute")
    .max(300, "Time limit cannot exceed 300 minutes"),
  max_attempts: z
    .number()
    .min(1, "Max attempts must be at least 1")
    .max(10, "Max attempts cannot exceed 10"),
  passing_score: z
    .number()
    .min(0, "Passing score must be at least 0")
    .max(100, "Passing score cannot exceed 100"),
  is_active: z.boolean().default(true),
  quiz_type: z.enum(
    ["MULTIPLE_CHOICE", "TRUE_FALSE", "FILL_IN_THE_BLANK", "ESSAY"],
    {
      required_error: "Quiz type is required",
    }
  ),
  tags: z.array(z.string()).optional().default([]),
  thumbnailFile: z.instanceof(File).optional().nullable(),
  thumbnailPreview: z.string().optional().nullable(),
});

export const createQuizSchema = quizSchema
  .omit({
    thumbnailFile: true,
    thumbnailPreview: true,
  })
  .extend({
    thumbnailFile: z.instanceof(File).optional().nullable(),
  });

export const updateQuizSchema = quizSchema.partial().extend({
  id: z.string().optional(),
});

export type QuizFormData = z.infer<typeof quizSchema>;
export type CreateQuizData = z.infer<typeof createQuizSchema>;
export type UpdateQuizData = z.infer<typeof updateQuizSchema>;
