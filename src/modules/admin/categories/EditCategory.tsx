"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Button } from "@/common/components/ui/button";
import InputGroup from "@/modules/admin/common/components/InputGroup";
import { TextAreaGroup } from "@/modules/admin/common/components/InputGroup/text-area";
import { Switch } from "@/modules/admin/common/components/switch";
import { UploadIcon } from "@/modules/admin/common/components/icons";
import { ArrowLeftIcon } from "@/modules/admin/common/components/icons";
import { cn } from "@/lib/utils";
import { useAdminCategory } from "./hooks/useAdminCategory";
import type { Category as BaseCategory } from "./services/admin.category.service";

type AdminCategory = BaseCategory & {
  description?: string;
  is_active?: boolean | null;
  created_at?: string;
  parent_id?: number | null;
  parent?: { name: string } | null;
  parent_name?: string;
};

type FormState = {
  name: string;
  slug: string;
  description: string;
  isActive: boolean;
  iconFile: File | null;
  iconPreview: string | null;
  parentId: string;
};

const emptyState: FormState = {
  name: "",
  slug: "",
  description: "",
  isActive: true,
  iconFile: null,
  iconPreview: null,
  parentId: "",
};

const EditCategory = () => {
  const params = useParams();
  const slugParam = (params?.slug as string) || "";
  const {
    currentCategory,
    getCategoryBySlug,
    loading,
    error,
    categories,
    getCategories,
  } = useAdminCategory();

  const [form, setForm] = useState<FormState>(emptyState);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (slugParam) {
      getCategoryBySlug(slugParam);
    }
  }, [slugParam, getCategoryBySlug]);

  useEffect(() => {
    getCategories();
  }, [getCategories]);

  useEffect(() => {
    if (!currentCategory) return;
    const cat = currentCategory as AdminCategory;
    setForm((prev) => ({
      ...prev,
      name: currentCategory.name || "",
      slug: currentCategory.slug || "",
      description: cat.description || "",
      isActive: (cat.is_active ?? true) === true,
      iconFile: null,
      iconPreview: currentCategory.icon_url || null,
      parentId: String(cat.parent_id ?? ""),
    }));
  }, [currentCategory]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleDescChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setForm((prev) => ({ ...prev, description: e.target.value }));
  };

  const handleParentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, parentId: e.target.value }));
  };

  const handleToggleActive = () => {
    setForm((prev) => ({ ...prev, isActive: !prev.isActive }));
  };

  const setIconFile = useCallback((file: File | null) => {
    if (!file) {
      setForm((prev) => ({ ...prev, iconFile: null, iconPreview: null }));
      return;
    }
    const url = URL.createObjectURL(file);
    setForm((prev) => ({ ...prev, iconFile: file, iconPreview: url }));
  }, []);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Placeholder for update integration
    console.log("Updating category (", slugParam, "):", form);
  };

  if (loading && !currentCategory) {
    return <div>Loading...</div>;
  }
  if (error && !currentCategory) {
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
        onSubmit={handleSubmit}
        className="grid grid-cols-1 gap-7.5 md:grid-cols-2"
      >
        <div className="flex flex-col gap-5.5">
          <InputGroup
            label="Category name"
            placeholder="Enter category name"
            type="text"
            name="name"
            required
            handleChange={handleTextChange}
            value={form.name}
          />

          <InputGroup
            label="Slug"
            placeholder="category-slug"
            type="text"
            name="slug"
            handleChange={handleTextChange}
            value={form.slug}
          />

          <div className="space-y-3">
            <span className="text-body-sm font-medium text-dark dark:text-white">
              Status
            </span>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={handleToggleActive}
              />
              <span className="text-body-sm text-dark-6 dark:text-white/70">
                {form.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-body-sm font-medium text-dark dark:text-white">
              Parent category (optional)
            </label>
            <div className="relative">
              <select
                value={form.parentId}
                onChange={handleParentChange}
                className={
                  "w-full appearance-none rounded-lg border border-stroke bg-transparent px-5.5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-dark-3 dark:bg-dark-2 dark:focus:border-primary [&>option]:text-dark-5 dark:[&>option]:text-dark-6"
                }
              >
                <option value="">No parent</option>
                {categories
                  .filter(
                    (c) =>
                      String(c.id) !== form.parentId && c.slug !== form.slug
                  )
                  .map((c) => (
                    <option key={c.id} value={String(c.id)}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-5.5">
          <TextAreaGroup
            label="Description"
            placeholder="Short description about this category"
            value={form.description}
            onChange={handleDescChange}
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

              {form.iconPreview ? (
                <div className="flex w-full flex-col items-center gap-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-md">
                    <Image
                      src={form.iconPreview}
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
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={clearIcon}
                    >
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
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              currentCategory &&
              setForm({
                name: currentCategory.name || "",
                slug: currentCategory.slug || "",
                description:
                  (currentCategory as AdminCategory).description || "",
                isActive:
                  ((currentCategory as AdminCategory).is_active ?? true) ===
                  true,
                iconFile: null,
                iconPreview: currentCategory.icon_url || null,
                parentId: String(
                  (currentCategory as AdminCategory).parent_id ?? ""
                ),
              })
            }
          >
            Reset
          </Button>
          <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </div>
  );
};

export default EditCategory;
