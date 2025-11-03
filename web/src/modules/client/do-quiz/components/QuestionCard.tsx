"use client";

import React from "react";
import { Question } from "../types/quiz.types";

interface QuestionCardProps {
  question: Question;
  questionNumber: number;
  totalQuestions: number;
}

const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  questionNumber,
  totalQuestions,
}) => {
  const renderMedia = () => {
    if (!question.media_url) return null;

    switch (question.media_type) {
      case "image":
        return (
          <div className="mb-4">
            <img
              src={question.media_url}
              alt="Question media"
              className="w-full max-w-md mx-auto rounded-lg shadow-sm"
            />
          </div>
        );
      case "video":
        return (
          <div className="mb-4">
            <video
              src={question.media_url}
              controls
              className="w-full max-w-md mx-auto rounded-lg shadow-sm"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
      case "audio":
        return (
          <div className="mb-4">
            <audio
              src={question.media_url}
              controls
              className="w-full max-w-md mx-auto"
            >
              Your browser does not support the audio element.
            </audio>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Question Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
            Question {questionNumber} of {totalQuestions}
          </div>
          <div className="bg-gray-100 text-gray-700 text-sm font-medium px-3 py-1 rounded-full">
            {question.points} point{question.points !== 1 ? "s" : ""}
          </div>
        </div>
        {question.time_limit && (
          <div className="text-sm text-gray-500">
            Time limit: {question.time_limit}s
          </div>
        )}
      </div>

      {/* Media */}
      {renderMedia()}

      {/* Question Content */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 leading-relaxed">
          {question.content}
        </h3>
      </div>

      {/* Question Type Indicator */}
      <div className="mb-4">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          {question.question_type.replace("_", " ").toUpperCase()}
        </span>
      </div>
    </div>
  );
};

export default QuestionCard;
