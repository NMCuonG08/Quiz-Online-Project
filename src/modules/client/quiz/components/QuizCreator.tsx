"use client";

import React from "react";

interface QuizCreatorProps {
  creatorName?: string | null;
}

const QuizCreator: React.FC<QuizCreatorProps> = ({ creatorName }) => {
  if (!creatorName) return null;
  return (
    <div className="rounded-md border dark:bg-gray-dark p-4">
      <div className="font-medium mb-2">Người tạo</div>
      <div className="text-sm">{creatorName}</div>
    </div>
  );
};

export default QuizCreator;
