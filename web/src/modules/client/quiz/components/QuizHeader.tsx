"use client";

import React from "react";

interface QuizHeaderProps {
  title: string;
  description?: string;
  tags?: string[];
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
  title,
  description,
  tags,
}) => {
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizHeader;
