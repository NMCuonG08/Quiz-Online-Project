"use client";
import React from "react";
import Image from "next/image";
import dayjs from "dayjs";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { Button } from "@/common/components/ui/button";
import { Edit, Trash2, Eye, HelpCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { showDeleteConfirm, showError, showSuccess } from "@/lib/Notification";
import { useAdminQuiz } from "../hooks/useAdminQuiz";
import type { Quiz } from "../types";

type Props = {
    quiz: Quiz;
    onRefresh?: () => void;
};

const QuizCard: React.FC<Props> = ({ quiz, onRefresh }) => {
    const router = useLocalizedRouter();
    const { deleteQuiz } = useAdminQuiz();

    const handleViewQuestions = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/admin/quizzes/questions/${quiz.id}`);
    };

    const handleEdit = (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/admin/quizzes/edit/${quiz.slug}`);
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const res = await showDeleteConfirm(quiz.title);
        if (res.isConfirmed) {
            const result = await deleteQuiz(quiz.id);
            if (result.success) {
                showSuccess("Deleted successfully");
                onRefresh?.();
            } else {
                showError(String(result.error || "Delete failed"));
            }
        }
    };

    return (
        <div className="bg-white dark:bg-gray-dark border-2 border-stroke dark:border-dark-3 rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group relative">
            {/* Thumbnail */}
            <div className="relative h-40 w-full bg-gray-100 dark:bg-dark-2">
                <Image
                    src={quiz.thumbnail_url || "/logo.jpg"}
                    alt={quiz.title}
                    fill
                    className="object-cover"
                />
                {/* Status badge */}
                <div className="absolute top-2 left-2">
                    <span
                        className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            quiz.is_active
                                ? "bg-green-500/90 text-white"
                                : "bg-red-500/90 text-white"
                        )}
                    >
                        {quiz.is_active ? "Active" : "Inactive"}
                    </span>
                </div>
                {/* Action buttons */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleViewQuestions}
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-dark-2/90 dark:hover:bg-dark-2"
                        title="View Questions"
                    >
                        <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleEdit}
                        className="h-8 w-8 p-0 bg-white/90 hover:bg-white dark:bg-dark-2/90 dark:hover:bg-dark-2"
                        title="Edit Quiz"
                    >
                        <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDelete}
                        className="h-8 w-8 p-0"
                        title="Delete Quiz"
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="p-4">
                {/* Title */}
                <h3
                    className="font-semibold text-lg text-dark dark:text-white line-clamp-1 mb-1"
                    title={quiz.title}
                >
                    {quiz.title}
                </h3>

                {/* Slug */}
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">
                    {quiz.slug}
                </p>

                {/* Description */}
                <p
                    className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 mb-3 min-h-[40px]"
                    title={quiz.description}
                >
                    {quiz.description || "No description"}
                </p>

                {/* Meta info */}
                <div className="flex flex-wrap gap-2 mb-3">
                    {quiz.category_name && (
                        <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs">
                            {quiz.category_name}
                        </span>
                    )}
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full text-xs capitalize">
                        {quiz.difficulty_level?.toLowerCase() || "medium"}
                    </span>
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 border-t border-stroke dark:border-dark-3 pt-3">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1" title="Questions">
                            <HelpCircle className="w-4 h-4" />
                            {quiz.questions_count || 0}
                        </span>
                        <span className="flex items-center gap-1" title="Attempts">
                            <Users className="w-4 h-4" />
                            {quiz.attempts_count || 0}
                        </span>
                    </div>
                    <span className="text-xs">
                        {quiz.created_at
                            ? dayjs(quiz.created_at).format("MMM DD, YYYY")
                            : "—"}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default QuizCard;
