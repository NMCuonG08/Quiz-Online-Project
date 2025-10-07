"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/common/components/ui/button";
import InputGroup from "@/modules/admin/common/components/InputGroup";
import { TextAreaGroup } from "@/modules/admin/common/components/InputGroup/text-area";
import { Switch } from "@/modules/admin/common/components/switch";
import { UploadIcon } from "@/modules/admin/common/components/icons";
import { ArrowLeftIcon } from "@/modules/admin/common/components/icons";
import { Select } from "@/modules/admin/common/components/select";
import { cn } from "@/lib/utils";
import { useAdminQuiz } from "./hooks/useAdminQuiz";
import { quizSchema, type QuizFormData } from "./schema/quiz";
import type { Quiz } from "./types";
import {
  showError,
  showLoading,
  closeLoading,
  showSuccess,
} from "@/lib/Notification";

const EditQuiz = () => {
  const params = useParams();
  const slugParam = (params?.slug as string) || "";
  const router = useRouter();
  const { currentQuiz, getQuizBySlug, loading, error, updateQuiz } =
    useAdminQuiz();

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
      thumbnailFile: null,
      thumbnailPreview: null,
    },
  });

  const {
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors },
  } = form;
  const watchedValues = watch();

  useEffect(() => {
    if (slugParam) {
      getQuizBySlug(slugParam);
    }
  }, [slugParam, getQuizBySlug]);

  useEffect(() => {
    if (!currentQuiz) return;
    const quiz = currentQuiz as Quiz;
    reset({
      title: quiz.title || "",
      slug: quiz.slug || "",
      description: quiz.description || "",
      instructions: quiz.instructions || "",
      category_id: quiz.category_id || "",
      difficulty_level: quiz.difficulty_level || "EASY",
      time_limit: quiz.time_limit || 30,
      max_attempts: quiz.max_attempts || 3,
      passing_score: quiz.passing_score || 60,
      is_active: quiz.is_active ?? true,
      quiz_type: quiz.quiz_type || "MULTIPLE_CHOICE",
      thumbnailFile: null,
      thumbnailPreview: quiz.thumbnail_url || null,
    });
  }, [currentQuiz, reset]);

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
        setValue("thumbnailFile", null);
        setValue("thumbnailPreview", null);
        return;
      }
      const url = URL.createObjectURL(file);
      setValue("thumbnailFile", file);
      setValue("thumbnailPreview", url);
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
      const id = (currentQuiz as Quiz)?.id;
      if (!id) {
        showError("Quiz is not loaded yet. Please try again.");
        return;
      }
      showLoading("Saving changes...", "Please wait");
      const payload = {
        title: data.title,
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
        thumbnailFile: data.thumbnailFile ?? undefined,
      };
      const res = await updateQuiz(id, payload);
      closeLoading();
      if (res.success) {
        showSuccess("Quiz updated successfully");
        router.push("/admin/quizzes");
      } else {
        showError(String(res.error || "Failed to update quiz"));
      }
    } catch (e) {
      closeLoading();
      showError("Failed to update quiz");
    }
  };

  if (loading && !currentQuiz) {
    return <div>Loading...</div>;
  }
  if (error && !currentQuiz) {
    return <div className="text-red">{String(error)}</div>;
  }

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-[#122031] dark:shadow-card sm:p-7.5">
      <div className="mb-5 flex items-center gap-2">
        <button
          type="button"
          onClick={() => history.back()}
          className="inline-flex hover:cursor-pointer items-center gap-2 text-dark hover:text-primary dark:text-white"
          aria-label="Go back"
          title="Go back"
        >
          <ArrowLeftIcon />
          <span className="text-body-sm font-medium">Back</span>
        </button>
      </div>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 gap-7.5 md:grid-cols-2"
      >
        <div className="flex flex-col gap-5.5">
          <InputGroup
            label="Quiz Title"
            placeholder="Enter quiz title"
            type="text"
            name="title"
            required
            handleChange={(e) =>
              setValue("title", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            value={watchedValues.title}
            error={errors.title?.message}
          />

          <InputGroup
            label="Slug"
            placeholder="quiz-slug"
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
              { value: "", label: "Select a category" },
              { value: "1", label: "General Knowledge" },
              { value: "2", label: "Science" },
              { value: "3", label: "History" },
              { value: "4", label: "Technology" },
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
              { value: "FILL_BLANK", label: "Fill in the Blank" },
              { value: "MIXED", label: "Mixed" },
            ]}
            value={watchedValues.quiz_type}
            onChange={(e) =>
              setValue(
                "quiz_type",
                e.target.value as
                  | "MULTIPLE_CHOICE"
                  | "TRUE_FALSE"
                  | "FILL_BLANK"
                  | "MIXED",
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
              <span className="text-body-sm text-dark-6 dark:text-white/70">
                {watchedValues.is_active ? "Active" : "Inactive"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5.5">
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

          <InputGroup
            label="Tags"
            placeholder="Enter tags separated by commas"
            type="text"
            name="tags"
            handleChange={(e) =>
              setValue("tags", e.target.value, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            value={watchedValues.tags}
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
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              if (currentQuiz) {
                const quiz = currentQuiz as Quiz;
                reset({
                  title: quiz.title || "",
                  slug: quiz.slug || "",
                  description: quiz.description || "",
                  instructions: quiz.instructions || "",
                  category_id: quiz.category_id || "",
                  difficulty_level: quiz.difficulty_level || "EASY",
                  time_limit: quiz.time_limit || 30,
                  max_attempts: quiz.max_attempts || 3,
                  passing_score: quiz.passing_score || 60,
                  is_public: quiz.is_public ?? true,
                  is_active: quiz.is_active ?? true,
                  quiz_type: quiz.quiz_type || "MULTIPLE_CHOICE",
                  tags: quiz.tags?.join(", ") || "",
                  thumbnailFile: null,
                  thumbnailPreview: quiz.thumbnail_url || null,
                });
              }
            }}
          >
            Reset
          </Button>
          <Button
            type="submit"
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)();
            }}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
};

export default EditQuiz;
