"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
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
import {
  PreviewIcon,
  PencilSquareIcon,
  TrashIcon,
} from "@/modules/admin/common/components/icons";
import { useUserQuiz } from "../hooks/useUserQuiz";
import { showDeleteConfirm, showError, showSuccess } from "@/lib/Notification";

const ListQuizTable = () => {
  const { quizzes, pagination, loading, error, getQuizzes, deleteQuiz } =
    useUserQuiz();
  const router = useLocalizedRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    getQuizzes({ page: currentPage, limit: pageSize });
  }, [getQuizzes, currentPage, pageSize]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {String(error)}</div>;

  return (
    <div>
      <div className="rounded-[10px] border border-stroke bg-white p-4 shadow-1 dark:border-dark-3 dark:bg-[#122031] dark:shadow-card sm:p-7.5">
        <div className="mb-4 flex items-center justify-end">
          <Button
            className="hover:cursor-pointer"
            onClick={() => router.push("/user/quizzes/add")}
          >
            Add
          </Button>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-[#F7F9FC] dark:bg-[#122031] [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
                <TableHead className="min-w-[120px] xl:pl-7.5">
                  Actions
                </TableHead>
                <TableHead className="min-w-[80px]">Thumbnail</TableHead>
                <TableHead className="min-w-[200px]">Name</TableHead>
                <TableHead className="min-w-[300px]">Description</TableHead>
                <TableHead className="min-w-[150px]">Category</TableHead>
                <TableHead className="min-w-[100px]">Questions</TableHead>
                <TableHead className="min-w-[100px]">Attempts</TableHead>
                <TableHead className="min-w-[120px]">Created At</TableHead>
                <TableHead className="min-w-[100px]">Status</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {!quizzes || quizzes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8">
                    <div className="text-gray-500 dark:text-gray-400">
                      No quizzes found
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                quizzes.map((item, index) => (
                  <TableRow
                    key={index}
                    className="border-[#eee] dark:border-dark-3"
                  >
                    {/* Actions first */}
                    <TableCell className="min-w-[120px] xl:pl-7.5">
                      <div className="flex items-center gap-x-3.5">
                        <button
                          className="hover:text-primary hover:cursor-pointer"
                          title="View quiz"
                          aria-label="View quiz"
                          onClick={() =>
                            router.push(`/user/quizzes/questions/${item.id}`)
                          }
                        >
                          <span className="sr-only">View Quiz</span>
                          <PreviewIcon width={24} height={24} />
                        </button>

                        <button
                          className="hover:text-primary hover:cursor-pointer"
                          title="Edit quiz"
                          aria-label="Edit quiz"
                          onClick={() =>
                            router.push(`/user/quizzes/edit/${item.slug}`)
                          }
                        >
                          <span className="sr-only">Edit Quiz</span>
                          <PencilSquareIcon width={24} height={24} />
                        </button>

                        <button
                          className="hover:text-primary hover:cursor-pointer"
                          title="Delete quiz"
                          aria-label="Delete quiz"
                          onClick={async () => {
                            const res = await showDeleteConfirm(item.title);
                            if (res.isConfirmed) {
                              const result = await deleteQuiz(item.id);
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
                          <span className="sr-only">Delete Quiz</span>
                          <TrashIcon width={24} height={24} />
                        </button>
                      </div>
                    </TableCell>

                    {/* Thumbnail */}
                    <TableCell className="min-w-[80px] xl:pl-7.5">
                      <div className="flex-shrink-0">
                        <Image
                          src={item.thumbnail_url || "/logo.jpg"}
                          alt={item.title}
                          width={60}
                          height={60}
                          className="rounded-md object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="min-w-[200px] max-w-[200px]">
                      <h5
                        className="text-dark dark:text-white truncate block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={item.title}
                      >
                        {item.title}
                      </h5>
                      <p
                        className="mt-[3px] text-body-sm font-medium truncate block overflow-hidden text-ellipsis whitespace-nowrap text-gray-500"
                        title={item.slug}
                      >
                        {item.slug}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-[300px] max-w-[300px]">
                      <p
                        className="text-dark dark:text-white truncate block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={item.description}
                      >
                        {item.description}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-[150px] max-w-[150px]">
                      <p
                        className="text-dark dark:text-white truncate block overflow-hidden text-ellipsis whitespace-nowrap"
                        title={item.category_name || "—"}
                      >
                        {item.category_name || "—"}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-[100px] text-center">
                      <p className="text-dark dark:text-white">
                        {item.questions_count || 0}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-[100px] text-center">
                      <p className="text-dark dark:text-white">
                        {item.attempts_count || 0}
                      </p>
                    </TableCell>
                    <TableCell className="min-w-[120px]">
                      <p className="text-dark dark:text-white truncate">
                        {item.created_at
                          ? dayjs(item.created_at).format("MMM DD, YYYY")
                          : "—"}
                      </p>
                    </TableCell>

                    <TableCell className="min-w-[100px]">
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
                    {/* (Actions moved to first column) */}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {pagination && (
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
              {Math.min(
                pagination.page * pagination.limit,
                pagination.totalItems
              )}{" "}
              of {pagination.totalItems} results
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={!pagination.hasPrev}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={!pagination.hasNext}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListQuizTable;
