"use client";

import React from "react";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { cn } from "@/lib/utils";

interface GameControlsProps {
  onSubmitAnswer: () => void;
  onNextQuestion?: () => void;
  isAnswered: boolean;
  hasSelectedAnswer: boolean;
  isLastQuestion: boolean;
  isLoading?: boolean;
}

export const GameControls: React.FC<GameControlsProps> = ({
  onSubmitAnswer,
  onNextQuestion,
  isAnswered,
  hasSelectedAnswer,
  isLastQuestion,
  isLoading = false,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[70] bg-card border-t border-border px-4 sm:px-8 py-4 sm:py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-3 sm:gap-6">
        {!isAnswered ? (
          <Button
            size="xl"
            onClick={onSubmitAnswer}
            disabled={!hasSelectedAnswer || isLoading}
            className="text-xl sm:text-2xl md:text-3xl font-bold px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6"
          >
            {isLoading ? "Đang gửi..." : "Gửi câu trả lời"}
          </Button>
        ) : (
          <>
            {onNextQuestion && !isLastQuestion && (
              <Button
                size="xl"
                variant="default"
                onClick={onNextQuestion}
                disabled={isLoading}
                className="text-xl sm:text-2xl md:text-3xl font-bold px-8 sm:px-12 md:px-16 py-4 sm:py-5 md:py-6"
              >
                {isLoading ? "Đang tải..." : "Câu tiếp theo →"}
              </Button>
            )}
            {isLastQuestion && (
              <Badge variant="secondary" className="text-xl sm:text-2xl md:text-3xl px-6 sm:px-8 py-3 sm:py-4">
                Đã hoàn thành tất cả câu hỏi! 🎉
              </Badge>
            )}
          </>
        )}
      </div>
    </div>
  );
};

