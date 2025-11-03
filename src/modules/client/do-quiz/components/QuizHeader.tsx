"use client";

import React from "react";
import { QuizProgress } from "../types/quiz.types";

interface QuizHeaderProps {
  title: string;
  progress: QuizProgress;
  timeRemaining: number;
  timerActive: boolean;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
  title,
  progress,
  timeRemaining,
  timerActive,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Quiz Title */}
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 truncate">
              {title}
            </h1>
            <p className="text-sm text-gray-500">
              Question {progress.current_question} of {progress.total_questions}
            </p>
          </div>

          {/* Timer */}
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div
                className={`text-2xl font-mono font-bold ${
                  timeRemaining <= 60 ? "text-red-600" : "text-gray-900"
                }`}
              >
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-gray-500">Time Remaining</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
            <span>Progress</span>
            <span>{progress.percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizHeader;
