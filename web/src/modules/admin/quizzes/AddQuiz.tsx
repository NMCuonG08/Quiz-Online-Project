"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/common/components/ui/button";
import InputGroup from "@/modules/admin/common/components/InputGroup";
import { TextAreaGroup } from "@/modules/admin/common/components/InputGroup/text-area";
import { Switch } from "@/modules/admin/common/components/switch";
import { UploadIcon } from "@/modules/admin/common/components/icons";
import { ArrowLeftIcon } from "@/modules/admin/common/components/icons";
import { Select } from "@/modules/admin/common/components/select";
import TagInput from "@/modules/admin/common/components/TagInput";
import { cn } from "@/lib/utils";
import { useAdminQuiz } from "./hooks/useAdminQuiz";
import { useAdminCategory } from "@/modules/admin/categories/hooks/useAdminCategory";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { quizSchema, type QuizFormData } from "./schema/quiz";
import type { Category } from "@/modules/admin/categories/services/admin.category.service";
import {
  showError,
  showLoading,
  closeLoading,
  showSuccess,
} from "@/lib/Notification";

const generateSlug = (str: string) => {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") /* Xóa khoảng trắng có dấu */
    .replace(/[đĐ]/g, "d")
    .replace(/([^0-9a-z-\s])/g, "")
    .replace(/(\s+)/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
};

const AddQuiz = () => {
  const router = useLocalizedRouter();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    mode: "onChange",
    reValidateMode: "onChange",
    defaultValues: {
      title: "",
      slug: "",
      description: "",
      instructions: "",
      category_id: "",
      difficulty_level: "EASY",
      time_limit: 30,
      max_attempts: 3,
      passing_score: 60,
      is_active: true,
      quiz_type: "MULTIPLE_CHOICE",
      tags: [],
      thumbnailFile: null,
      thumbnailPreview: null,
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    trigger,
    getValues,
    formState: { errors, submitCount },
  } = form;
  const watchedValues = watch();
  const { createQuiz } = useAdminQuiz();
  const { categories, getCategories } = useAdminCategory();
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!categories || categories.length === 0) {
      void getCategories();
    }
  }, [categories, getCategories]);

  // removed is_public

  const handleToggleActive = () => {
    setValue("is_active", !watchedValues.is_active, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const setThumbnailFile = useCallback(
    (file: File | null) => {
      if (!file) {
        setValue("thumbnailFile", null, {
          shouldDirty: true,
          shouldValidate: true,
        });
        setValue("thumbnailPreview", null, {
          shouldDirty: true,
          shouldValidate: true,
        });
        return;
      }
      const url = URL.createObjectURL(file);
      setValue("thumbnailFile", file, {
        shouldDirty: true,
        shouldValidate: true,
      });
      setValue("thumbnailPreview", url, {
        shouldDirty: true,
        shouldValidate: true,
      });
    },
    [setValue]
  );

  const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const file = files[0];
      if (file.type.startsWith("image/")) {
        setThumbnailFile(file);
      }
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const onFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    if (file && file.type.startsWith("image/")) {
      setThumbnailFile(file);
    }
  };

  const clearThumbnail = () => setThumbnailFile(null);

  const onSubmit = async (data: QuizFormData) => {
    try {
      // Extra guard: ensure client-side validation passes before calling API
      const isValid = await trigger();
      if (!isValid) {
        onInvalid();
        return;
      }
      showLoading("Creating quiz...", "Please wait");
      const payload = {
        title: (getValues("title") ?? data.title) as string,
        slug: data.slug,
        description: data.description,
        instructions: data.instructions,
        category_id: data.category_id,
        difficulty_level: data.difficulty_level,
        time_limit: data.time_limit,
        max_attempts: data.max_attempts,
        passing_score: data.passing_score,
        is_active: data.is_active,
        quiz_type: data.quiz_type,
        tags: data.tags || [],
        thumbnailFile: data.thumbnailFile ?? undefined,
      };

      // Debug logging
      console.log("Quiz payload:", payload);
      console.log("Thumbnail file:", data.thumbnailFile);

      const res = await createQuiz(payload);
      closeLoading();
      if (res.success) {
        showSuccess("Quiz created successfully");
        router.push("/admin/quizzes");
      } else {
        // Try to extract server validation errors
        const err = res.error as
          | {
            message?: string;
            code?: string;
            details?: Array<{ field?: string; message?: string }>;
          }
          | string
          | undefined;

        // If validation details exist, set them into form errors and show a readable toast
        if (
          err &&
          typeof err === "object" &&
          "details" in err &&
          Array.isArray(err.details)
        ) {
          err.details.forEach((d) => {
            if (!d) return;
            const field = (d.field || "").trim();
            const message = d.message || "Invalid value";
            if (field && field in errors) {
              // @ts-expect-error dynamic key is safe here due to schema alignment
              form.setError(field as keyof QuizFormData, {
                type: "server",
                message,
              });
            }
          });
          const list = err.details
            .map((d) => `${d.field || "field"}: ${d.message || "Invalid"}`)
            .join("\n");
          showError(`Validation failed:\n${list}`);
        } else {
          showError(
            String(
              (typeof err === "string" ? err : err?.message) ||
              "Failed to create quiz"
            )
          );
        }
      }
    } catch {
      closeLoading();
      showError("Failed to create quiz");
    }
  };

  const onInvalid = () => {
    const sanitize = (s?: string) => (s || "Invalid").replace(/<[^>]*>/g, "");
    const messages = Object.values(errors)
      .map((err) => sanitize((err as { message?: string }).message))
      .filter(Boolean);
    if (messages.length > 0) {
      showError(`Validation failed:\n${messages.join("\n")}`);
    }
    if (typeof window !== "undefined") {
      const HEADER_OFFSET = 140; // push further below header
      const el = errorSummaryRef.current;
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
          // adjust by header height after scrollIntoView
          window.scrollBy({ top: -HEADER_OFFSET, left: 0, behavior: "smooth" });
        });
      } else {
        window.scrollTo({ top: HEADER_OFFSET, behavior: "smooth" });
      }
    }
  };

  const onFormKeyDown = async (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    const tag = target.tagName?.toLowerCase();
    if (tag === "textarea") return;

    e.preventDefault();
    await handleSubmit(onSubmit, () => {
      onInvalid();
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        // @ts-expect-error dynamic path is acceptable here
        form.setFocus(firstErrorField);
      }
    })();
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-[#122031] dark:shadow-card sm:p-7.5">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-dark hover:text-primary dark:text-white"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeftIcon />
          <span className="text-body-sm hover:cursor-pointer font-medium">
            Back
          </span>
        </button>
      </div>
      <form
        onKeyDown={onFormKeyDown}
        onSubmit={handleSubmit(onSubmit, onInvalid)}
        className="grid grid-cols-1 gap-7.5 md:grid-cols-2"
      >
        {submitCount > 0 && Object.keys(errors).length > 0 && (
          <div
            ref={errorSummaryRef}
            className="md:col-span-2 rounded-md border border-red-300 bg-red-50 p-3 text-red-700"
          >
            <p className="font-medium">Please fix the following errors:</p>
            <div className="mt-2 space-y-1">
              {Object.values(errors).map((err, idx) => {
                const message = (err as { message?: string }).message;
                if (!message) return null;
                return <p key={idx}>- {message}</p>;
              })}
            </div>
          </div>
        )}
        <div className="flex flex-col gap-5.5">
          <InputGroup
            label="Quiz Title"
            placeholder="Enter quiz title"
            type="text"
            name="title"
            handleChange={(e) => {
              const val = e.target.value;
              setValue("title", val, {
                shouldDirty: true,
                shouldValidate: true,
              });
              setValue("slug", generateSlug(val), {
                shouldDirty: true,
                shouldValidate: true,
              });
            }}
            value={watchedValues.title}
            error={errors.title?.message}
          />

          <InputGroup
            label="Slug"
            placeholder="auto-generated or enter manually"
            type="text"
            name="slug"
            handleChange={(e) =>
              setValue("slug", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            value={watchedValues.slug}
            error={errors.slug?.message}
          />

          <Select
            label="Category"
            placeholder="Select category"
            items={[
              ...(categories || []).map((c: Category) => ({
                value: String(c.id),
                label: c.name,
              })),
            ]}
            value={watchedValues.category_id}
            onChange={(e) =>
              setValue("category_id", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.category_id?.message}
          />

          <TextAreaGroup
            label="Description"
            placeholder="Short description about this quiz"
            value={watchedValues.description}
            onChange={(e) =>
              setValue("description", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.description?.message}
          />

          <TextAreaGroup
            label="Instructions"
            placeholder="Instructions for taking this quiz"
            value={watchedValues.instructions}
            onChange={(e) =>
              setValue("instructions", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.instructions?.message}
          />
        </div>

        <div className="flex flex-col gap-5.5">
          <Select
            label="Difficulty Level"
            placeholder="Select difficulty"
            items={[
              { value: "EASY", label: "Easy" },
              { value: "MEDIUM", label: "Medium" },
              { value: "HARD", label: "Hard" },
            ]}
            value={watchedValues.difficulty_level}
            onChange={(e) =>
              setValue(
                "difficulty_level",
                e.target.value as "EASY" | "MEDIUM" | "HARD",
                { shouldDirty: true, shouldValidate: true }
              )
            }
            error={errors.difficulty_level?.message}
          />

          <Select
            label="Quiz Type"
            placeholder="Select quiz type"
            items={[
              { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
              { value: "TRUE_FALSE", label: "True/False" },
              { value: "FILL_IN_THE_BLANK", label: "Fill in the Blank" },
              { value: "ESSAY", label: "ESSAY" },
            ]}
            value={watchedValues.quiz_type}
            onChange={(e) =>
              setValue(
                "quiz_type",
                e.target.value as
                | "MULTIPLE_CHOICE"
                | "TRUE_FALSE"
                | "FILL_IN_THE_BLANK"
                | "ESSAY",
                { shouldDirty: true, shouldValidate: true }
              )
            }
            error={errors.quiz_type?.message}
          />

          <div className="space-y-3">
            <span className="text-body-sm font-medium text-dark dark:text-white">
              Status
            </span>
            <div className="flex items-center gap-3">
              <Switch
                checked={watchedValues.is_active}
                onCheckedChange={handleToggleActive}
              />
              <span className={cn(
                "text-body-sm font-bold",
                watchedValues.is_active ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
              )}>
                {watchedValues.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>


          <InputGroup
            label="Time Limit (minutes)"
            placeholder="30"
            type="number"
            name="time_limit"
            handleChange={(e) =>
              setValue("time_limit", parseInt(e.target.value) || 0, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            value={watchedValues.time_limit}
            error={errors.time_limit?.message}
          />

          <InputGroup
            label="Max Attempts"
            placeholder="3"
            type="number"
            name="max_attempts"
            handleChange={(e) =>
              setValue("max_attempts", parseInt(e.target.value) || 0, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            value={watchedValues.max_attempts}
            error={errors.max_attempts?.message}
          />

          <InputGroup
            label="Passing Score (%)"
            placeholder="60"
            type="number"
            name="passing_score"
            handleChange={(e) =>
              setValue("passing_score", parseInt(e.target.value) || 0, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            value={watchedValues.passing_score}
            error={errors.passing_score?.message}
          />

          <TagInput
            label="Tags"
            placeholder="Type a tag and press Enter"
            value={watchedValues.tags || []}
            onChange={(tags) =>
              setValue("tags", tags, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            error={errors.tags?.message}
          />

          <div>
            <span className="text-body-sm font-medium text-dark dark:text-white">
              Thumbnail
            </span>
            <label
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={onDragLeave}
              className={cn(
                "mt-3 flex w-full items-center justify-center rounded-lg border-[1.5px] border-dashed p-6 text-center transition-colors cursor-pointer hover:border-primary hover:bg-primary/5 dark:border-dark-3",
                isDragging
                  ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                  : "border-stroke"
              )}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={onFilePick}
              />

              {watchedValues.thumbnailPreview ? (
                <div className="flex w-full flex-col items-center gap-3">
                  <div className="relative h-32 w-40 overflow-hidden rounded-md">
                    <Image
                      src={watchedValues.thumbnailPreview}
                      alt="Thumbnail preview"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Change
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={clearThumbnail}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <UploadIcon className="h-8 w-8 text-dark-5 dark:text-white/70" />
                  <p className="mt-2 text-body-sm text-dark-6 dark:text-white/70">
                    Drag and drop thumbnail here, or
                    <button
                      type="button"
                      className="ml-1 text-primary underline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-body-xs text-dark-6 dark:text-white/50">
                    PNG, JPG, SVG up to 2MB
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>

        <div className="col-span-1 md:col-span-2 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => form.reset()}>
            Reset
          </Button>
          <Button type="submit">Create Quiz</Button>
        </div>
      </form>
    </div>
  );
};

export default AddQuiz;
