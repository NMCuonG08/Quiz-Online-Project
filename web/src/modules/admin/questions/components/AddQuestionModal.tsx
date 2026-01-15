"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/common/components/ui/dialog";
import { Input } from "@/common/components/ui/input";
import { Textarea } from "@/common/components/ui/textarea";
import { Button } from "@/common/components/ui/button";
import { UploadImage } from "@/common/components/ui/upload-image";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/common/components/ui/select";
import { OptionRendererFactory } from "../strategies/OptionRenderer";
import AddOptionCard from "./AddOptionCard";
import type { QuestionItem, QuestionOption } from "../types/admin.question";
import {
  createQuestionSchema,
  transformQuestionData,
} from "../schema/question";
import {
  showError,
  showSuccess,
  showLoading,
  closeLoading,
} from "@/lib/Notification";
import { useAdminQuestions } from "../hooks/useAdminQuestions";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  quizId: string;
};

const AddQuestionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  onSuccess,
  quizId,
}) => {
  const { addQuestion, loading } = useAdminQuestions();
  const [questionData, setQuestionData] = useState<Partial<QuestionItem>>({
    quiz_id: quizId,
    question_text: "",
    question_type: "MULTIPLE_CHOICE",
    points: 1,
    time_limit: 30,
    difficulty_level: "EASY",
    options: [],
    media_url: null,
  });

  // Auto-generate options for TRUE_FALSE when type changes
  const handleTypeChange = (value: string) => {
    const newType = value as QuestionItem["question_type"];

    if (newType === "TRUE_FALSE") {
      // Auto-create True and False options
      const trueOption: QuestionOption = {
        id: `temp-true-${Date.now()}`,
        question_id: "",
        option_text: "True",
        is_correct: false,
        sort_order: 1,
        explanation: "",
        media_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        question_text: "",
        question_type: "",
      };
      const falseOption: QuestionOption = {
        id: `temp-false-${Date.now()}`,
        question_id: "",
        option_text: "False",
        is_correct: false,
        sort_order: 2,
        explanation: "",
        media_url: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        question_text: "",
        question_type: "",
      };
      setQuestionData((prev) => ({
        ...prev,
        question_type: newType,
        options: [trueOption, falseOption],
      }));
    } else if (newType === "ESSAY") {
      // ESSAY doesn't need options
      setQuestionData((prev) => ({
        ...prev,
        question_type: newType,
        options: [],
      }));
    } else {
      // Reset options for other types
      setQuestionData((prev) => ({
        ...prev,
        question_type: newType,
        options: [],
      }));
    }
  };

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      question_id: "",
      option_text: "",
      is_correct: false,
      sort_order: (questionData.options?.length || 0) + 1,
      explanation: "",
      media_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      question_text: "",
      question_type: "",
    };

    setQuestionData((prev) => ({
      ...prev,
      options: [...(prev.options || []), newOption],
    }));
  };

  const handleUpdateOption = (
    index: number,
    patch: Partial<QuestionOption>
  ) => {
    setQuestionData((prev) => {
      // For SINGLE_CHOICE and TRUE_FALSE, only one option can be correct
      if (
        (prev.question_type === "SINGLE_CHOICE" ||
          prev.question_type === "TRUE_FALSE") &&
        patch.is_correct === true
      ) {
        return {
          ...prev,
          options:
            prev.options?.map((opt, i) => ({
              ...opt,
              is_correct: i === index, // Only the clicked one is correct
            })) || [],
        };
      }

      // Default behavior for other question types
      return {
        ...prev,
        options:
          prev.options?.map((opt, i) =>
            i === index ? { ...opt, ...patch } : opt
          ) || [],
      };
    });
  };

  const handleRemoveOption = (index: number) => {
    setQuestionData((prev) => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async () => {
    // Transform data to remove empty arrays/fields before validation
    const dataToValidate = transformQuestionData({
      ...questionData,
      quiz_id: quizId,
    });

    const parsed = createQuestionSchema.safeParse(dataToValidate);

    if (!parsed.success) {
      // Surface the first validation error via error toast notification
      const firstError = parsed.error.issues?.[0]?.message || "Invalid input";
      const fieldPath = Array.isArray(parsed.error.issues?.[0]?.path)
        ? parsed.error.issues[0].path.join(".")
        : "unknown field";
      const errorMessage = `${fieldPath}: ${firstError}`;

      showError(errorMessage);
      return;
    }

    showLoading("Creating question...", "Please wait");

    try {
      const result = await addQuestion(parsed.data);

      if (result.success) {
        showSuccess("Question created successfully!");
        // Reset form
        setQuestionData({
          quiz_id: quizId,
          question_text: "",
          question_type: "MULTIPLE_CHOICE",
          points: 1,
          time_limit: 30,
          difficulty_level: "EASY",
          options: [],
          media_url: null,
        });
        onSuccess?.();
        onClose();
      } else {
        showError(String(result.error || "Failed to create question"));
      }
    } catch (error) {
      showError("An unexpected error occurred");
      console.error("Create question error:", error);
    } finally {
      closeLoading();
    }
  };

  const renderer = OptionRendererFactory.getRenderer(
    questionData.question_type || "MULTIPLE_CHOICE"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[80vw] h-[80vh] overflow-y-auto z-40">
        <DialogHeader>
          <DialogTitle>Add New Question</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Question Details */}
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Question Text</label>
              <Textarea
                value={questionData.question_text || ""}
                onChange={(e) =>
                  setQuestionData((prev) => ({
                    ...prev,
                    question_text: e.target.value,
                  }))
                }
                className="mt-1"
                rows={4}
                placeholder="Enter your question here..."
              />
            </div>

            {/* Question Image Upload */}
            <div>
              <label className="text-sm font-medium">
                Question Image (Optional)
              </label>
              <UploadImage
                value={questionData.media_url}
                onChange={(file) =>
                  setQuestionData((prev) => ({
                    ...prev,
                    media_url: file,
                  }))
                }
                placeholder="Upload question image"
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Points</label>
                <Input
                  type="number"
                  value={questionData.points || 1}
                  onChange={(e) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      points: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="mt-1"
                  min="1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Time Limit (s)</label>
                <Input
                  type="number"
                  value={questionData.time_limit || 30}
                  onChange={(e) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      time_limit: parseInt(e.target.value) || 30,
                    }))
                  }
                  className="mt-1"
                  min="1"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={questionData.question_type || "MULTIPLE_CHOICE"}
                  onValueChange={handleTypeChange}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select question type" />
                  </SelectTrigger>
                  <SelectContent>
                    {OptionRendererFactory.getSupportedTypes().map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, " ")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Difficulty</label>
                <Select
                  value={questionData.difficulty_level || "EASY"}
                  onValueChange={(value) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      difficulty_level:
                        value as QuestionItem["difficulty_level"],
                    }))
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select difficulty" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EASY">Easy</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HARD">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Options - Hide for ESSAY */}
          {questionData.question_type !== "ESSAY" && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {questionData.question_type === "TRUE_FALSE"
                  ? "Select the correct answer"
                  : "Options"}
              </h3>

              <div className="space-y-3">
                {(questionData.options || []).map((opt, index) => (
                  <div key={opt.id}>
                    {renderer.render(opt, (patch) =>
                      handleUpdateOption(index, patch)
                    )}
                    {/* Hide Remove button for TRUE_FALSE since options are fixed */}
                    {questionData.question_type !== "TRUE_FALSE" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveOption(index)}
                        className="mt-2 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      >
                        Remove Option
                      </Button>
                    )}
                  </div>
                ))}

                {/* Add Option Card - Only show for CHOICE, FILL_BLANK, and MATCHING */}
                {(questionData.question_type === "SINGLE_CHOICE" ||
                  questionData.question_type === "MULTIPLE_CHOICE" ||
                  questionData.question_type === "FILL_BLANK" ||
                  questionData.question_type === "MATCHING") && (
                    <AddOptionCard onClick={handleAddOption} />
                  )}
              </div>
            </div>
          )}

          {/* Info message for ESSAY */}
          {questionData.question_type === "ESSAY" && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Essay questions are open-ended and will be graded manually.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? "Creating..." : "Create Question"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddQuestionModal;
