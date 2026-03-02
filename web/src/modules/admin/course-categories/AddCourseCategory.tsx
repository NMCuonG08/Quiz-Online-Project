"use client";

import React, { useCallback, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import { useAdminCourseCategory } from "./hooks/useAdminCourseCategory";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { categorySchema, type CategoryFormData } from "@/modules/admin/categories/schema/category";
import {
    showError,
    showLoading,
    closeLoading,
    showSuccess,
} from "@/lib/Notification";
import {
    extractFieldErrors,
    mapServerFieldToForm,
    formatErrorMessageWithDetails,
} from "@/lib/apiError";

const AddCourseCategory = () => {
    const router = useLocalizedRouter();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const { categories, getCategories, createCategory } = useAdminCourseCategory();

    const form = useForm<CategoryFormData>({
        resolver: zodResolver(categorySchema),
        defaultValues: {
            name: "",
            slug: "",
            description: "",
            isActive: true,
            iconFile: null,
            iconPreview: null,
            parentId: "",
        },
    });

    const {
        watch,
        setValue,
        handleSubmit,
        setError,
        formState: { errors },
    } = form;
    const watchedValues = watch();

    React.useEffect(() => {
        getCategories();
    }, [getCategories]);

    const handleToggleActive = () => {
        setValue("isActive", !watchedValues.isActive);
    };

    const setIconFile = useCallback(
        (file: File | null) => {
            if (!file) {
                setValue("iconFile", null);
                setValue("iconPreview", null);
                return;
            }
            const url = URL.createObjectURL(file);
            setValue("iconFile", file);
            setValue("iconPreview", url);
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
                setIconFile(file);
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
            setIconFile(file);
        }
    };

    const clearIcon = () => setIconFile(null);

    const onSubmit = async (data: CategoryFormData) => {
        try {
            const payload = {
                name: data.name,
                slug: data.slug,
                description: data.description || "",
                isActive: data.isActive,
                parentId: data.parentId && data.parentId.trim() !== "" ? data.parentId : null,
                iconFile: data.iconFile ?? null,
            };
            showLoading("Creating course category...", "Please wait");
            const res = await createCategory(payload);
            closeLoading();
            if (res.success) {
                showSuccess("Course category created successfully");
                router.push("/admin/course-categories");
            } else {
                const errObj = (res as { error?: unknown }).error;
                const msg = formatErrorMessageWithDetails(errObj, "Failed to create course category");
                const fieldErrs = extractFieldErrors(errObj);
                Object.entries(fieldErrs).forEach(([field, message]) => {
                    const mapped = mapServerFieldToForm(field) as keyof CategoryFormData;
                    setError(mapped, { type: "server", message });
                });
                showError(msg);
            }
        } catch {
            closeLoading();
            showError("Failed to create course category");
        }
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
                    <span className="text-body-sm hover:cursor-pointer font-medium">Back</span>
                </button>
            </div>
            <form
                onSubmit={handleSubmit(onSubmit)}
                className="grid grid-cols-1 gap-7.5 md:grid-cols-2"
            >
                <div className="flex flex-col gap-5.5">
                    <InputGroup
                        label="Category name"
                        placeholder="Enter course category name"
                        type="text"
                        name="name"
                        required
                        handleChange={(e) => {
                            const val = e.target.value;
                            setValue("name", val);
                            const generatedSlug = val
                                .toLowerCase()
                                .normalize("NFD")
                                .replace(/[\u0300-\u036f]/g, "")
                                .replace(/đ/g, "d")
                                .replace(/[^a-z0-9 -]/g, "")
                                .replace(/\s+/g, "-")
                                .replace(/-+/g, "-")
                                .replace(/^-+|-+$/g, "");
                            setValue("slug", generatedSlug, { shouldValidate: true });
                        }}
                        value={watchedValues.name}
                        error={errors.name?.message}
                    />

                    <InputGroup
                        label="Slug"
                        placeholder="auto-generated or enter manually"
                        type="text"
                        name="slug"
                        handleChange={(e) => setValue("slug", e.target.value)}
                        value={watchedValues.slug}
                        error={errors.slug?.message}
                    />

                    <div className="space-y-3">
                        <span className="text-body-sm font-medium text-dark dark:text-white">
                            Status
                        </span>
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={watchedValues.isActive}
                                onCheckedChange={handleToggleActive}
                            />
                            <span className="text-body-sm text-dark-6 dark:text-white/70">
                                {watchedValues.isActive ? "Active" : "Inactive"}
                            </span>
                        </div>
                    </div>

                    <Select
                        label="Parent category (optional)"
                        placeholder="Select parent category"
                        items={[
                            { value: "", label: "No parent" },
                            ...categories.map((c) => ({
                                value: String(c.id),
                                label: c.name,
                            })),
                        ]}
                        value={watchedValues.parentId}
                        onChange={(e) =>
                            setValue("parentId", e.target.value, {
                                shouldDirty: true,
                                shouldValidate: true,
                            })
                        }
                        error={errors.parentId?.message}
                    />
                </div>

                <div className="flex flex-col gap-5.5">
                    <TextAreaGroup
                        label="Description"
                        placeholder="Short description about this course category"
                        value={watchedValues.description}
                        onChange={(e) => setValue("description", e.target.value)}
                        error={errors.description?.message}
                    />

                    <div>
                        <span className="text-body-sm font-medium text-dark dark:text-white">
                            Icon
                        </span>
                        <label
                            onDrop={onDrop}
                            onDragOver={onDragOver}
                            onDragLeave={onDragLeave}
                            className={cn(
                                "mt-3 flex w-full items-center justify-center rounded-lg border-[1.5px] border-dashed p-6 text-center transition-colors dark:border-dark-3",
                                isDragging ? "border-primary bg-primary/5" : "border-stroke"
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={onFilePick}
                            />

                            {watchedValues.iconPreview ? (
                                <div className="flex w-full flex-col items-center gap-3">
                                    <div className="relative h-16 w-16 overflow-hidden rounded-md">
                                        <Image
                                            src={watchedValues.iconPreview}
                                            alt="Icon preview"
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
                                        <Button type="button" variant="destructive" onClick={clearIcon}>
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <UploadIcon className="h-6 w-6 text-dark-5 dark:text-white/70" />
                                    <p className="mt-2 text-body-sm text-dark-6 dark:text-white/70">
                                        Drag and drop icon here, or
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
                    <Button type="submit">Create Course Category</Button>
                </div>
            </form>
        </div>
    );
};

export default AddCourseCategory;
