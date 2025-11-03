import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  question_id: z.string().optional(),
  option_text: z.string().trim().min(1, "Option text is required"),
  is_correct: z.boolean().default(false),
  sort_order: z.number().int().min(1, "Sort order must be >= 1"),
  explanation: z.string().optional().nullable(),
  media_url: z.union([
    z.string().url(),
    z.instanceof(File),
    z.literal(""),
    z.null()
  ]).optional().nullable(),
});

export const baseQuestionSchema = z.object({
  quiz_id: z.string().min(1, "Quiz is required"),
  question_text: z
    .string()
    .trim()
    .min(1, "Question text is required")
    .max(2000, "Question text too long"),
  question_type: z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_IN_THE_BLANK",
    "ESSAY",
  ]),
  points: z.number().int().min(1).max(100),
  time_limit: z.number().int().min(1).max(600),
  difficulty_level: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
  explanation: z.string().optional().nullable(),
  media_type: z.string().optional().nullable(),
  media_url: z.union([
    z.string().url(),
    z.instanceof(File),
    z.literal(""),
    z.null()
  ]).optional().nullable(),
  sort_order: z.number().int().optional().nullable(),
  is_required: z.boolean().optional().nullable(),
  settings: z.string().optional().nullable(),
  options: z
    .array(questionOptionSchema)
    .optional()
    .refine(
      (opts) => {
        if (!opts || opts.length === 0) return true; // allow no options for non-MC
        const hasCorrect = opts.some((o) => o.is_correct);
        return hasCorrect;
      },
      { message: "At least one option must be marked correct" }
    ),
});

export const createQuestionSchema = baseQuestionSchema.omit({}).extend({});

export const updateQuestionSchema = baseQuestionSchema.extend({
  id: z.string().min(1, "Question id is required"),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;

// Helper function to transform question data before validation
export const transformQuestionData = (data: Record<string, unknown>) => {
  const transformed = { ...data };
  
  // Remove options field if it's empty array
  if (transformed.options && Array.isArray(transformed.options) && transformed.options.length === 0) {
    delete transformed.options;
  }
  
  // Don't convert File objects to null - keep them as File
  if (transformed.media_url === "") {
    transformed.media_url = null;
  }
  
  // Handle options media_url
  if (transformed.options && Array.isArray(transformed.options)) {
    transformed.options = transformed.options.map((option: Record<string, unknown>) => ({
      ...option,
      media_url: option.media_url === "" ? null : option.media_url
    }));
  }
  
  console.log("Transformed data:", transformed);
  
  return transformed;
};
