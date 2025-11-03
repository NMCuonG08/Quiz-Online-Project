"use client";

import React from "react";
import { Question, QuestionOption, UserAnswer } from "../types/quiz.types";

interface AnswerOptionsProps {
  question: Question;
  userAnswer?: UserAnswer;
  onAnswerSelect: (
    answer: Omit<UserAnswer, "question_id" | "answered_at">
  ) => void;
  isSubmitting: boolean;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  question,
  userAnswer,
  onAnswerSelect,
  isSubmitting,
}) => {
  const handleOptionSelect = (option: QuestionOption) => {
    if (isSubmitting) return;

    const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
      selected_option_id: option.id,
      text_answer: undefined,
      is_correct: option.is_correct,
      points_earned: option.is_correct ? question.points : 0,
      time_spent: 0, // This should be calculated based on timer
    };

    onAnswerSelect(answer);
  };

  const handleTextAnswer = (text: string) => {
    if (isSubmitting) return;

    const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
      selected_option_id: undefined,
      text_answer: text,
      is_correct: false, // Will be determined by backend
      points_earned: 0, // Will be determined by backend
      time_spent: 0,
    };

    onAnswerSelect(answer);
  };

  const isOptionSelected = (optionId: string) => {
    return userAnswer?.selected_option_id === optionId;
  };

  const renderMultipleChoice = () => (
    <div className="space-y-3">
      {question.options
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(option)}
            disabled={isSubmitting}
            className={`w-full p-4 text-left rounded-lg border-2 transition-all duration-200 ${
              isOptionSelected(option.id)
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <div className="flex items-center space-x-3">
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  isOptionSelected(option.id)
                    ? "border-blue-500 bg-blue-500"
                    : "border-gray-300"
                }`}
              >
                {isOptionSelected(option.id) && (
                  <div className="w-2 h-2 bg-white rounded-full" />
                )}
              </div>
              <span className="text-gray-900">{option.content}</span>
            </div>
          </button>
        ))}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="space-y-3">
      {question.options
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => (
          <button
            key={option.id}
            onClick={() => handleOptionSelect(option)}
            disabled={isSubmitting}
            className={`w-full p-4 text-center rounded-lg border-2 transition-all duration-200 ${
              isOptionSelected(option.id)
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            } ${
              isSubmitting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
            }`}
          >
            <span className="text-lg font-medium">{option.content}</span>
          </button>
        ))}
    </div>
  );

  const renderFillBlank = () => (
    <div className="space-y-4">
      <textarea
        value={userAnswer?.text_answer || ""}
        onChange={(e) => handleTextAnswer(e.target.value)}
        disabled={isSubmitting}
        placeholder="Enter your answer here..."
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        rows={4}
      />
    </div>
  );

  const renderEssay = () => (
    <div className="space-y-4">
      <textarea
        value={userAnswer?.text_answer || ""}
        onChange={(e) => handleTextAnswer(e.target.value)}
        disabled={isSubmitting}
        placeholder="Write your essay answer here..."
        className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
        rows={8}
      />
    </div>
  );

  const renderAnswerOptions = () => {
    switch (question.question_type) {
      case "multiple_choice":
        return renderMultipleChoice();
      case "true_false":
        return renderTrueFalse();
      case "fill_blank":
        return renderFillBlank();
      case "essay":
        return renderEssay();
      default:
        return <div>Unsupported question type</div>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h4 className="text-lg font-medium text-gray-900 mb-4">Your Answer:</h4>
      {renderAnswerOptions()}
    </div>
  );
};

export default AnswerOptions;
