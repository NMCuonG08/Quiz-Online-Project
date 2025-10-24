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

  const handleAddOption = () => {
    const newOption: QuestionOption = {
      id: `temp-${Math.random().toString(36).substr(2, 9)}`,
      question_id: "",
      option_text: "",
      is_correct: false,
      sort_order: (questionData.options?.length || 0) + 1,
      explanation: "",
      media_url: null, // Set to null instead of empty string
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
    setQuestionData((prev) => ({
      ...prev,
      options:
        prev.options?.map((opt, i) =>
          i === index ? { ...opt, ...patch } : opt
        ) || [],
    }));
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

            <div className="grid grid-cols-4 gap-4">
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
              <div>
                <label className="text-sm font-medium">Type</label>
                <Select
                  value={questionData.question_type || "MULTIPLE_CHOICE"}
                  onValueChange={(value) =>
                    setQuestionData((prev) => ({
                      ...prev,
                      question_type: value as QuestionItem["question_type"],
                      // Reset options when type changes
                      options: [],
                    }))
                  }
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

          {/* Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Options</h3>

            <div className="space-y-3">
              {(questionData.options || []).map((opt, index) => (
                <div key={opt.id}>
                  {renderer.render(opt, (patch) =>
                    handleUpdateOption(index, patch)
                  )}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemoveOption(index)}
                    className="mt-2"
                  >
                    Remove Option
                  </Button>
                </div>
              ))}

              {/* Add Option Card */}
              <AddOptionCard onClick={handleAddOption} />
            </div>
          </div>

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
