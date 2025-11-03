"use client";

import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/common/components/ui/card";

interface QuizRatingsDetailProps {
  average: number;
  total: number;
  breakdown?: { stars: number; count: number }[];
}

const QuizRatingsDetail: React.FC<QuizRatingsDetailProps> = ({
  average,
  total,
  breakdown = [],
}) => {
  return (
    <Card className="bg-red-light dark:bg-gray-dark w-full">
      <CardContent className="space-y-3">
        <CardHeader>
          <CardTitle className="flex items-end gap-4">
            <div className="text-3xl font-semibold">{average.toFixed(1)}</div>
            <div className="text-sm text-gray-600">{total} lượt đánh giá</div>
          </CardTitle>
        </CardHeader>
        <div className="space-y-1">
          {breakdown.map((b) => (
            <div key={b.stars} className="flex items-center gap-2 text-xs">
              <span>{b.stars}★</span>
              <div className="flex-1 h-2 bg-gray-100 rounded">
                <div
                  className="h-2 bg-yellow-400 rounded"
                  style={{
                    width: `${Math.min(
                      100,
                      (b.count / Math.max(1, total)) * 100
                    )}%`,
                  }}
                />
              </div>
              <span>{b.count}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuizRatingsDetail;
