"use client";
import React, { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import { Button } from "@/common/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { useAdminQuestions } from "../hooks/useAdminQuestions";
import QuestionCard from "./QuestionCard";
import AddQuestionModal from "./AddQuestionModal";

// Question types matching backend
const QUESTION_TYPES = [
  { value: "ALL", label: "All Types" },
  { value: "MULTIPLE_CHOICE", label: "Multiple Choice" },
  { value: "TRUE_FALSE", label: "True/False" },
  { value: "FILL_BLANK", label: "Fill in the Blank" },
  { value: "ESSAY", label: "Essay" },
  { value: "MATCHING", label: "Matching" },
];

const ITEMS_PER_PAGE = 18;

const ListQuestionsOfQuiz = () => {
  const params = useParams();
  const router = useRouter();
  const id = (params?.id as string) || "";
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [filterType, setFilterType] = useState("ALL");

  const { items, pagination, loading, error, getQuestions } = useAdminQuestions();

  const fetchQuestions = useCallback(async () => {
    if (!id) return;
    await getQuestions(id, { page: currentPage, limit: ITEMS_PER_PAGE });
  }, [id, currentPage, getQuestions]);

  useEffect(() => {
    if (!id) return;
    void fetchQuestions();
  }, [id, fetchQuestions]);

  // Filter items by question type (client-side filtering)
  const filteredItems = filterType === "ALL"
    ? items
    : items.filter(item => item.question_type === filterType);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  // Handle filter change
  const handleFilterChange = (value: string) => {
    setFilterType(value);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  // Calculate pagination info
  const totalPages = pagination?.totalPages || 1;
  const totalItems = pagination?.totalItems || 0;
  const hasNext = pagination?.hasNext || false;
  const hasPrev = pagination?.hasPrev || false;

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  if (loading) return <div className="p-4">Loading questions...</div>;
  if (error) return <div className="text-red-500 p-4">{String(error)}</div>;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay về
        </Button>

        <div className="flex items-center gap-3">
          {/* Filter by Question Type */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <Select value={filterType} onValueChange={handleFilterChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                {QUESTION_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button onClick={() => setIsAddModalOpen(true)}>Add Question</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredItems.length} of {totalItems} questions
        {filterType !== "ALL" && ` (filtered by ${QUESTION_TYPES.find(t => t.value === filterType)?.label})`}
      </div>

      {/* Questions Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredItems.length === 0 ? (
          <div className="text-sm text-gray-500 col-span-full text-center py-8">
            {filterType !== "ALL"
              ? `No ${QUESTION_TYPES.find(t => t.value === filterType)?.label} questions found.`
              : "No questions found."}
          </div>
        ) : (
          filteredItems.map((q) => (
            <QuestionCard
              key={q.id}
              question={q}
              onRefresh={fetchQuestions}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4 pb-8">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!hasPrev || currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous
          </Button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, index) => (
              <React.Fragment key={index}>
                {page === "..." ? (
                  <span className="px-2 text-gray-500">...</span>
                ) : (
                  <Button
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePageChange(page as number)}
                    className="min-w-[40px]"
                  >
                    {page}
                  </Button>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={!hasNext || currentPage === totalPages}
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Page Info */}
      {totalPages > 1 && (
        <div className="text-center text-sm text-gray-500">
          Page {currentPage} of {totalPages}
        </div>
      )}

      <AddQuestionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          // Refresh the questions list after successful creation
          void fetchQuestions();
        }}
        quizId={id}
      />
    </div>
  );
};

export default ListQuestionsOfQuiz;
