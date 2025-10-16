"use client";

import React from "react";

interface QuizRatingsProps {
  average: number;
  total: number;
}

const QuizRatings: React.FC<QuizRatingsProps> = ({ average, total }) => {
  return (
    <div className="rounded-md dark:bg-gray-dark border p-4">
      <div className="font-medium mb-2">Đánh giá</div>
      <div className="text-sm">
        ⭐ {average} ({total})
      </div>
    </div>
  );
};

export default QuizRatings;
