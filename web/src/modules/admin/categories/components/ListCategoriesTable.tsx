"use client";

import React, { useEffect } from "react";
import { TrashIcon } from "@/modules/admin/common/components/icons";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/common/components/ui/table";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/lib/utils";
import dayjs from "dayjs";
import {
  PreviewIcon,
  PencilSquareIcon,
} from "@/modules/admin/common/components/icons";
import { useAdminCategory } from "../hooks/useAdminCategory";
import Image from "next/image";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { showDeleteConfirm, showError, showSuccess } from "@/lib/Notification";

const ListCategoriesTable = () => {
  const { categories, loading, error, getCategories, deleteCategory } =
    useAdminCategory();
  const router = useLocalizedRouter();
  useEffect(() => {
    getCategories();
  }, [getCategories]);
  if (loading) {
    return <div>Loading...</div>;
  }
  if (error) {
    return <div>Error: {String(error)}</div>;
  }
  return (
    <div>
      <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-[#122031] dark:shadow-card sm:p-7.5">
        <div className="mb-4 flex items-center justify-end">
          <Button
            className="hover:cursor-pointer"
            onClick={() => router.push("/admin/quiz-categories/add")}
          >
            Add
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-[#122031] [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead className="min-w-[120px] xl:pl-7.5">Actions</TableHead>
              <TableHead className="min-w-[155px]">Icon</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Parent</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400">
                    No categories found
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              categories.map((item, index) => (
                <TableRow
                  key={index}
                  className="border-[#eee] dark:border-dark-3"
                >
                  {/* Actions first */}
                  <TableCell className="min-w-[120px] xl:pl-7.5">
                    <div className="flex items-center gap-x-3.5">
                      <button
                        className="hover:text-primary hover:cursor-pointer"
                        title="View quiz category"
                        aria-label="View quiz category"
                      >
                        <span className="sr-only">View Category</span>
                        <PreviewIcon />
                      </button>

                      <button
                        className="hover:text-primary hover:cursor-pointer"
                        title="Edit quiz category"
                        aria-label="Edit quiz category"
                        onClick={() =>
                          router.push(
                            `/admin/quiz-categories/edit/${item.slug}`
                          )
                        }
                      >
                        <span className="sr-only">Edit Category</span>
                        <PencilSquareIcon />
                      </button>

                      <button
                        className="hover:text-primary hover:cursor-pointer"
                        title="Delete quiz category"
                        aria-label="Delete quiz category"
                        onClick={async () => {
                          const res = await showDeleteConfirm(item.name);
                          if (res.isConfirmed) {
                            const result = await deleteCategory(item.id);
                            if (result.success) {
                              showSuccess("Deleted successfully");
                            } else {
                              showError(
                                String(result.error || "Delete failed")
                              );
                            }
                          }
                        }}
                      >
                        <span className="sr-only">Delete Category</span>
                        <TrashIcon />
                      </button>
                    </div>
                  </TableCell>

                  <TableCell className="min-w-[155px]">
                    <Image
                      src={item.icon_url || "/logo.jpg"}
                      alt={item.name}
                      width={50}
                      height={50}
                    />
                  </TableCell>
                  <TableCell className="min-w-[155px] xl:pl-7.5">
                    <h5 className="text-dark dark:text-white">{item.name}</h5>
                    <p className="mt-[3px] text-body-sm font-medium">
                      {item.slug}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {item.description}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {(item as unknown as { parent_name?: string })
                        .parent_name ??
                        (item as unknown as { parent?: { name?: string } })
                          .parent?.name ??
                        "—"}
                    </p>
                  </TableCell>
                  <TableCell>
                    <p className="text-dark dark:text-white">
                      {dayjs(item.created_at).format("MMM DD, YYYY")}
                    </p>
                  </TableCell>

                  <TableCell>
                    <div
                      className={cn(
                        "max-w-fit rounded-full px-3.5 py-1 text-sm font-medium",
                        {
                          "bg-[#219653]/[0.08] text-[#219653]":
                            item.is_active === true,
                          "bg-[#D34053]/[0.08] text-[#D34053]":
                            item.is_active === false,
                          "bg-[#FFA70B]/[0.08] text-[#FFA70B]":
                            item.is_active === null,
                        }
                      )}
                    >
                      {item.is_active === true ? "Active" : "Inactive"}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ListCategoriesTable;
