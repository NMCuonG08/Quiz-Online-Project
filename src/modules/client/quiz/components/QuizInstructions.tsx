"use client";

import React from "react";

interface QuizInstructionsProps {
  instructions?: string | null;
}

const QuizInstructions: React.FC<QuizInstructionsProps> = ({
  instructions,
}) => {
  if (!instructions) return null;
  return (
    <div className="bg-red-light dark:bg-gray-dark rounded-lg p-6 border">
      <div className="font-medium mb-2">Hướng dẫn</div>
      <p className="text-sm whitespace-pre-line">{instructions}</p>
    </div>
  );
};

export default QuizInstructions;
