"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/common/components/ui/button";
import InputGroup from "@/modules/admin/common/components/InputGroup";
import { TextAreaGroup } from "@/modules/admin/common/components/InputGroup/text-area";
import { Switch } from "@/modules/admin/common/components/switch";
import { Select } from "@/modules/admin/common/components/select";
import { ArrowLeftIcon, UploadIcon } from "@/modules/admin/common/components/icons";
import { useAdminCourses } from "./hooks/useAdminCourses";
import { useAdminCourseCategory } from "@/modules/admin/course-categories/hooks/useAdminCourseCategory";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { cn } from "@/lib/utils";
import Image from "next/image";

const courseSchema = z.object({
    title: z.string().min(1, "Title is required").max(200, "Title is too long"),
    description: z.string().optional(),
    category_id: z.string().min(1, "Category is required"),
    difficulty_level: z.enum(["EASY", "MEDIUM", "HARD"]).default("EASY"),
    price: z.number().min(0, "Price cannot be negative").default(0),
    thumbnailPreview: z.string().nullable().optional(),
    is_published: z.boolean().default(false),
    thumbnailFile: z.any().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

export default function AddCourse() {
    const router = useLocalizedRouter();
    const { createCourse } = useAdminCourses();
    const { categories, getCategories } = useAdminCourseCategory();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = React.useRef<HTMLInputElement | null>(null);

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<CourseFormData>({
        resolver: zodResolver(courseSchema),
        defaultValues: {
            title: "",
            description: "",
            category_id: "",
            difficulty_level: "EASY",
            price: 0,
            thumbnailPreview: null,
            thumbnailFile: null,
            is_published: false,
        },
    });

    const watchedValues = watch();

    useEffect(() => {
        getCategories();
    }, [getCategories]);

    const onSubmit = async (data: CourseFormData) => {
        setIsSubmitting(true);
        const submitData = {
            ...data,
            price: Number(data.price),
            thumbnailFile: data.thumbnailFile ?? undefined,
        };
        const success = await createCourse(submitData);
        setIsSubmitting(false);

        if (success) {
            router.push("/admin/courses");
        }
    };

    const setThumbnailFile = React.useCallback(
        (file: File | null) => {
            if (!file) {
                setValue("thumbnailFile", null, { shouldValidate: true });
                setValue("thumbnailPreview", null, { shouldValidate: true });
                return;
            }
            const url = URL.createObjectURL(file);
            setValue("thumbnailFile", file, { shouldValidate: true });
            setValue("thumbnailPreview", url, { shouldValidate: true });
        },
        [setValue]
    );

    const onDrop = (e: React.DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files && files[0] && files[0].type.startsWith("image/")) {
            setThumbnailFile(files[0]);
        }
    };

    const clearThumbnail = () => setThumbnailFile(null);

    return (
        <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-[#122031] dark:shadow-card sm:p-7.5">
            <div className="mb-5 flex items-center gap-2">
                <button
                    onClick={() => router.back()}
                    className="inline-flex hover:cursor-pointer items-center gap-2 text-dark hover:text-primary dark:text-white"
                >
                    <ArrowLeftIcon />
                    <span className="text-body-sm font-medium">Quay lại</span>
                </button>
            </div>

            <h3 className="mb-5 text-xl font-bold text-black dark:text-white">
                Thêm khóa học mới
            </h3>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-7.5 md:grid-cols-2">
                <div className="flex flex-col gap-5.5">
                    <InputGroup
                        label="Tên khóa học"
                        placeholder="Nhập tên khóa học"
                        type="text"
                        required
                        handleChange={(e) => setValue("title", e.target.value)}
                        value={watchedValues.title}
                        error={errors.title?.message}
                    />

                    <Select
                        label="Danh mục"
                        items={[
                            { value: "", label: "Chọn danh mục" },
                            ...categories.map((c) => ({
                                value: String(c.id),
                                label: c.name,
                            })),
                        ]}
                        value={watchedValues.category_id}
                        onChange={(e) => setValue("category_id", e.target.value, { shouldValidate: true })}
                        error={errors.category_id?.message}
                    />

                    <Select
                        label="Độ khó"
                        items={[
                            { value: "EASY", label: "Dễ" },
                            { value: "MEDIUM", label: "Trung bình" },
                            { value: "HARD", label: "Khó" },
                        ]}
                        value={watchedValues.difficulty_level}
                        onChange={(e) => setValue("difficulty_level", e.target.value as any, { shouldValidate: true })}
                        error={errors.difficulty_level?.message}
                    />

                    <InputGroup
                        label="Giá (VNĐ hoặc USD)"
                        placeholder="0 cho miễn phí"
                        type="number"
                        handleChange={(e) => setValue("price", Number(e.target.value))}
                        value={String(watchedValues.price)}
                        error={errors.price?.message}
                    />
                </div>

                <div className="flex flex-col gap-5.5">
                    <TextAreaGroup
                        label="Mô tả thẻ khóa học"
                        placeholder="Mô tả ngắn"
                        value={watchedValues.description || ""}
                        onChange={(e) => setValue("description", e.target.value)}
                        error={errors.description?.message}
                    />

                    <div>
                        <span className="text-body-sm font-medium text-dark dark:text-white">
                            Ảnh bìa (Thumbnail)
                        </span>
                        <label
                            onDrop={onDrop}
                            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
                            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
                            className={cn(
                                "mt-3 flex w-full items-center justify-center rounded-lg border-[1.5px] border-dashed p-6 text-center transition-colors cursor-pointer dark:border-dark-3",
                                isDragging ? "border-primary bg-primary/10 ring-2 ring-primary/30" : "border-stroke"
                            )}
                        >
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    if (file && file.type.startsWith("image/")) setThumbnailFile(file);
                                }}
                            />

                            {watchedValues.thumbnailPreview ? (
                                <div className="flex w-full flex-col items-center gap-3">
                                    <div className="relative h-32 w-40 overflow-hidden rounded-md">
                                        <Image src={watchedValues.thumbnailPreview} alt="Thumbnail preview" fill className="object-cover" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>Thay đổi</Button>
                                        <Button type="button" variant="destructive" onClick={clearThumbnail}>Xóa</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center">
                                    <UploadIcon className="h-8 w-8 text-dark-5 dark:text-white/70" />
                                    <p className="mt-2 text-body-sm text-dark-6 dark:text-white/70">
                                        Kéo thả ảnh vào đây, hoặc <button type="button" className="ml-1 text-primary underline" onClick={() => fileInputRef.current?.click()}>chọn file</button>
                                    </p>
                                    <p className="text-body-xs text-dark-6 dark:text-white/50">PNG, JPG, SVG tối đa 2MB</p>
                                </div>
                            )}
                        </label>
                    </div>

                    <div className="space-y-3 mt-2">
                        <span className="text-body-sm font-medium text-dark dark:text-white">
                            Trạng thái xuất bản
                        </span>
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={watchedValues.is_published}
                                onCheckedChange={(checked) => setValue("is_published", checked)}
                            />
                            <span className="text-body-sm text-dark-6 dark:text-white/70">
                                {watchedValues.is_published ? "Đã xuất bản (Công khai)" : "Bản nháp (Ẩn)"}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="col-span-1 md:col-span-2 flex justify-end gap-3 mt-4">
                    <Button type="button" variant="outline" onClick={() => router.back()}>
                        Hủy
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? "Đang thêm..." : "Thêm Khóa học"}
                    </Button>
                </div>
            </form>
        </div>
    );
}
