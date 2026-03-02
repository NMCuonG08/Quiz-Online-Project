"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { Button } from "@/common/components/ui/button";
import { Plus } from "lucide-react";
import { useUserQuiz } from "../hooks/useUserQuiz";
import QuizCard from "./QuizCard";

const ListQuizGrid = () => {
    const { quizzes, pagination, loading, error, getQuizzes } = useUserQuiz();
    const router = useLocalizedRouter();
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize] = useState(12);

    const fetchQuizzes = useCallback(async () => {
        await getQuizzes({ page: currentPage, limit: pageSize });
    }, [getQuizzes, currentPage, pageSize]);

    useEffect(() => {
        void fetchQuizzes();
    }, [fetchQuizzes]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-gray-500 dark:text-gray-400">Loading quizzes...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-red-500">Error: {String(error)}</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-dark dark:text-white">
                    Quizzes
                </h2>
                <Button
                    onClick={() => router.push("/user/quizzes/add")}
                    className="flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Add Quiz
                </Button>
            </div>

            {/* Quiz Grid */}
            {!quizzes || quizzes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-dark rounded-xl border-2 border-dashed border-stroke dark:border-dark-3">
                    <div className="text-gray-500 dark:text-gray-400 mb-4">
                        No quizzes found
                    </div>
                    <Button
                        variant="outline"
                        onClick={() => router.push("/user/quizzes/add")}
                    >
                        Create your first quiz
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                    {quizzes.map((quiz) => (
                        <QuizCard
                            key={quiz.id}
                            quiz={quiz}
                            onRefresh={fetchQuizzes}
                        />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between bg-white dark:bg-gray-dark rounded-xl p-4 border border-stroke dark:border-dark-3">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                        Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                        {Math.min(
                            pagination.page * pagination.limit,
                            pagination.totalItems
                        )}{" "}
                        of {pagination.totalItems} quizzes
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
                        <span className="text-sm text-gray-600 dark:text-gray-400 px-2">
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
    );
};

export default ListQuizGrid;
