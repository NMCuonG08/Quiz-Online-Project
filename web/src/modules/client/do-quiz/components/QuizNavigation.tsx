"use client";

import React from "react";

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSubmitting: boolean;
  hasAnswered: boolean;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  isFirstQuestion,
  isLastQuestion,
  isSubmitting,
  hasAnswered,
}) => {
  return (
    <div className="bg-white border-t border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Previous Button */}
        <button
          onClick={onPrevious}
          disabled={isFirstQuestion || isSubmitting}
          className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
            isFirstQuestion || isSubmitting
              ? "border-gray-200 text-gray-400 cursor-not-allowed"
              : "border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          ← Previous
        </button>

        {/* Question Progress */}
        <div className="flex items-center space-x-2">
          <span className="text-sm text-gray-600">
            {currentQuestion} of {totalQuestions}
          </span>
        </div>

        {/* Next/Submit Button */}
        {isLastQuestion ? (
          <button
            onClick={onSubmit}
            disabled={!hasAnswered || isSubmitting}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              !hasAnswered || isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Submit Quiz"}
          </button>
        ) : (
          <button
            onClick={onNext}
            disabled={!hasAnswered || isSubmitting}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              !hasAnswered || isSubmitting
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isSubmitting ? "Saving..." : "Next →"}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizNavigation;
