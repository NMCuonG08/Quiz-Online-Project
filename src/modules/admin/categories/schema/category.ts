import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name must be less than 100 characters"),
  slug: z.string().min(1, "Slug is required").max(100, "Slug must be less than 100 characters"),
  description: z.string().min(1, "Description is required").max(500, "Description must be less than 500 characters"),
  isActive: z.boolean().default(true),
  iconFile: z.instanceof(File).optional().nullable(),
  iconPreview: z.string().optional().nullable(),
  parentId: z.string().optional(),
});

export const createCategorySchema = categorySchema.omit({
  iconFile: true,
  iconPreview: true,
}).extend({
  iconFile: z.instanceof(File).optional().nullable(),
});

export const updateCategorySchema = categorySchema.partial().extend({
  id: z.number().optional(),
});

export type CategoryFormData = z.infer<typeof categorySchema>;
export type CreateCategoryData = z.infer<typeof createCategorySchema>;
export type UpdateCategoryData = z.infer<typeof updateCategorySchema>;
