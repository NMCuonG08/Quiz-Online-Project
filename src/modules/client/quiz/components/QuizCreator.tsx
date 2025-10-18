"use client";

import React from "react";

interface QuizCreatorProps {
  creatorName?: string | null;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ creatorName }) => {
  if (!creatorName) return null;
  return (
    <div className="bg-violet dark:bg-gray-dark rounded-lg p-6 border">
      <div className="font-medium mb-2">Người tạo</div>
      <div className="text-sm">{creatorName}</div>
    </div>
  );
};

export default QuizCreator;
