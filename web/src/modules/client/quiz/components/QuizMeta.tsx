"use client";

import React from "react";

interface QuizMetaProps {
  difficulty: string;
  timeLimit: number;
  maxAttempts: number;
  passingScore: number;
  quizType: string;
  categoryName?: string | null;
  questionsCount: number;
  attemptsCount: number;
  publishedAt?: string | null;
  updatedAt?: string | null;
}

const QuizMeta: React.FC<QuizMetaProps> = ({
  difficulty,
  timeLimit,
  maxAttempts,
  passingScore,
  quizType,
  categoryName,
  questionsCount,
  attemptsCount,
  publishedAt,
  updatedAt,
}) => {
  return (
    <div className="rounded-md border p-4 space-y-3">
      <div className="font-medium">Thông tin</div>
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          Độ khó: {difficulty}
        </span>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          {timeLimit}s
        </span>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          Attempts: {maxAttempts}
        </span>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          Pass: {passingScore}
        </span>
        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
          {quizType}
        </span>
        {categoryName && (
          <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs">
            {categoryName}
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>Câu hỏi: {questionsCount}</div>
        <div>Lượt làm: {attemptsCount}</div>
        {publishedAt && (
          <div>Public: {new Date(publishedAt).toLocaleDateString()}</div>
        )}
        {updatedAt && (
          <div>Update: {new Date(updatedAt).toLocaleDateString()}</div>
        )}
      </div>
    </div>
  );
};

export default QuizMeta;
