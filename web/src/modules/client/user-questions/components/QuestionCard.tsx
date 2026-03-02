"use client";
import React, { useMemo, useState } from "react";
import { Button } from "@/common/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import Image from "next/image";
import type { QuestionItem } from "../types/user.question";
import EditQuestionModal from "./EditQuestionModal";
import { showConfirm, showError, showSuccess } from "@/lib/Notification";
import { useUserQuestions } from "../hooks/useUserQuestions";

type Props = {
  question: QuestionItem;
  onRefresh?: () => void;
};

const truncateToLines = (text: string, maxChars: number): string => {
  if (!text) return "";
  if (text.length <= maxChars) return text;
  return text.slice(0, Math.max(0, maxChars - 1)) + "…";
};

const QuestionCard: React.FC<Props> = ({ question, onRefresh }) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { removeQuestion } = useUserQuestions();
  const maxTitleChars = 120;

  const titleText = useMemo(
    () => truncateToLines(question.question_text, maxTitleChars),
    [question.question_text]
  );

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await showConfirm({
      title: "Delete Question",
      text: `Are you sure you want to delete this question: "${titleText}"?`,
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      icon: "warning",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (result.isConfirmed) {
      try {
        const deleteResult = await removeQuestion(question.id);

        if (deleteResult.success) {
          showSuccess("Question deleted successfully!");
          onRefresh?.();
        } else {
          showError(String(deleteResult.error || "Failed to delete question"));
        }
      } catch (error) {
        showError("An unexpected error occurred");
        console.error("Delete question error:", error);
      }
    }
  };

  return (
    <>
      <div
        onClick={() => setIsEditModalOpen(true)}
        className="bg-white dark:bg-gray-dark border-2 border-stroke dark:border-dark-3 rounded-xl h-[240px] w-full p-4 flex flex-col hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors relative group cursor-pointer"
      >
        {/* Action buttons */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="outline"
            size="sm"
            onClick={handleEditClick}
            className="h-8 w-8 p-0"
            title="Edit question"
          >
            <Edit className="w-3 h-3" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteClick}
            className="h-8 w-8 p-0"
            title="Delete question"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>

        <div className="pb-1">
          <div className="text-base font-semibold line-clamp-2 min-h-[48px] pr-20">
            {titleText}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-gray-100 px-2 py-0.5 dark:bg-[#1f2937]">
                {question.question_type.replace(/_/g, " ")}
              </span>
              <span>{question.points} pts</span>
              <span>{question.time_limit}s</span>
              <span className="capitalize text-blue-600 dark:text-blue-400">
                {question.difficulty_level.toLowerCase()}
              </span>
            </div>
            <div className="text-[11px] text-gray-500">
              {question.options_count ?? (question.options?.length || 0)}{" "}
              options
            </div>
          </div>
        </div>

        {/* Question image preview */}
        {question.media_url && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full h-20 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center overflow-hidden relative">
              <Image
                src={question.media_url}
                alt="Question"
                fill
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {!question.media_url && (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-sm text-gray-500">No image</div>
          </div>
        )}
      </div>

      <EditQuestionModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => {
          onRefresh?.();
        }}
        question={question}
      />
    </>
  );
};

export default QuestionCard;
