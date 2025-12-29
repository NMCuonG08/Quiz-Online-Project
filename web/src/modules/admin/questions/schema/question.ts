import { z } from "zod";

export const questionOptionSchema = z.object({
  id: z.string().optional(),
  question_id: z.string().optional(),
  option_text: z.string().trim().default(""), // Made optional, will validate at question level
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

// Base object schema WITHOUT refinement - can be extended
const baseQuestionObjectSchema = z.object({
  quiz_id: z.string().min(1, "Quiz is required"),
  question_text: z
    .string()
    .trim()
    .min(1, "Question text is required")
    .max(2000, "Question text too long"),
  question_type: z.enum([
    "MULTIPLE_CHOICE",
    "TRUE_FALSE",
    "FILL_BLANK",
    "ESSAY",
    "MATCHING",
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
    .nullable(),
});

// Refinement function to validate options based on question type
const questionOptionsRefinement = (data: z.infer<typeof baseQuestionObjectSchema>, ctx: z.RefinementCtx) => {
  const { question_type, options } = data;
  
  // ESSAY doesn't need options
  if (question_type === "ESSAY") {
    return;
  }
  
  // TRUE_FALSE needs exactly 2 options: True and False
  if (question_type === "TRUE_FALSE") {
    if (!options || options.length !== 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TRUE_FALSE questions must have exactly 2 options (True and False)",
        path: ["options"],
      });
      return;
    }
    const hasTrue = options.some(o => o.option_text === "True");
    const hasFalse = options.some(o => o.option_text === "False");
    if (!hasTrue || !hasFalse) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "TRUE_FALSE questions must have 'True' and 'False' options",
        path: ["options"],
      });
      return;
    }
    const hasCorrect = options.some(o => o.is_correct);
    if (!hasCorrect) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Please select the correct answer (True or False)",
        path: ["options"],
      });
    }
    return;
  }
  
  // MULTIPLE_CHOICE, FILL_BLANK, and MATCHING need at least one option
  if (question_type === "MULTIPLE_CHOICE" || question_type === "FILL_BLANK" || question_type === "MATCHING") {
    if (!options || options.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one option is required",
        path: ["options"],
      });
      return;
    }
    
    // For MULTIPLE_CHOICE, check that options have text
    if (question_type === "MULTIPLE_CHOICE") {
      const emptyOptions = options.filter(o => !o.option_text || o.option_text.trim() === "");
      if (emptyOptions.length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "All options must have text",
          path: ["options"],
        });
        return;
      }
    }
    
    // Check for at least one correct answer
    const hasCorrect = options.some(o => o.is_correct);
    if (!hasCorrect) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "At least one option must be marked as correct",
        path: ["options"],
      });
    }
  }
};

// Base schema with refinement (for backward compatibility export)
export const baseQuestionSchema = baseQuestionObjectSchema.superRefine(questionOptionsRefinement);

// Create schema - extend from base object, then add refinement
export const createQuestionSchema = baseQuestionObjectSchema.superRefine(questionOptionsRefinement);

// Update schema - extend from base object first, then add refinement
export const updateQuestionSchema = baseQuestionObjectSchema.extend({
  id: z.string().min(1, "Question id is required"),
}).superRefine(questionOptionsRefinement);

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type QuestionOptionInput = z.infer<typeof questionOptionSchema>;

// Helper function to transform question data before validation
export const transformQuestionData = (data: Record<string, unknown>) => {
  const transformed = { ...data };
  const questionType = transformed.question_type as string;
  
  // For ESSAY, remove options entirely (it doesn't need them)
  if (questionType === "ESSAY") {
    delete transformed.options;
  }
  // For other types, keep options but remove if empty (validation will catch missing options)
  else if (transformed.options && Array.isArray(transformed.options) && transformed.options.length === 0) {
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
