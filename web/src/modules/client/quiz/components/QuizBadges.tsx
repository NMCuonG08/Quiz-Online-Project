"use client";

import React from "react";
import { Badge } from "@/common/components/ui/badge";

interface BadgeItem {
  icon?: React.ReactNode;
  label: string;
}

interface QuizBadgesProps {
  items: BadgeItem[];
}

const QuizBadges: React.FC<QuizBadgesProps> = ({ items }) => {
  if (!items?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it, idx) => (
        <Badge
          key={idx}
          variant="secondary"
          title={it.label}
          className="px-2.5 py-1 text-xs hover:bg-secondary/80 transition-colors rounded-lg"
        >
          {it.icon}
          <span className="truncate max-w-[12rem]">{it.label}</span>
        </Badge>
      ))}
    </div>
  );
};

export default QuizBadges;
