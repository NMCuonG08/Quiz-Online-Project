"use client";

import React from "react";
import { Badge } from "@/common/components/ui/badge";
import { Progress } from "@/common/components/ui/progress";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/lib/utils";

interface GameHeaderProps {
  roomCode?: string;
  currentQuestion: number;
  totalQuestions: number;
  score: number;
  totalScore: number;
  onExit?: () => void;
  onSubmitAnswer?: () => void;
  onNextQuestion?: () => void;
  isAnswered?: boolean;
  hasSelectedAnswer?: boolean;
  isLastQuestion?: boolean;
  isLoading?: boolean;
}

export const GameHeader: React.FC<GameHeaderProps> = ({
  roomCode,
  currentQuestion,
  totalQuestions,
  score,
  totalScore,
  onExit,
  onSubmitAnswer,
  onNextQuestion,
  isAnswered = false,
  hasSelectedAnswer = false,
  isLastQuestion = false,
  isLoading = false,
}) => {
  const progressPercentage = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="w-full bg-card border-b border-border px-6 sm:px-8 py-4 sm:py-6 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Left: Exit Button + Room Code */}
        <div className="flex items-center gap-3">
          {onExit && (
            <Button
              variant="destructive"
              size="lg"
              onClick={onExit}
              className="text-base sm:text-lg px-4 sm:px-6 py-2"
            >
              Thoát
            </Button>
          )}
          {roomCode && (
            <Badge variant="secondary" className="text-lg sm:text-xl px-4 py-2">
              Room:{" "}
              <span className="text-primary font-bold ml-1">{roomCode}</span>
            </Badge>
          )}
        </div>

        {/* Center: Progress */}
        <div className="flex-1 w-full sm:w-auto mx-0 sm:mx-8">
          <div className="flex items-center justify-between mb-2 gap-4">
            <Badge
              variant="outline"
              className="text-base sm:text-xl px-3 py-1.5"
            >
              Câu {currentQuestion} / {totalQuestions}
            </Badge>
            <Badge
              variant="outline"
              className="text-base sm:text-xl px-3 py-1.5"
            >
              {score} / {totalScore} điểm
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-3 sm:h-4" />
        </div>

        {/* Right: Submit/Next Button */}
        <div className="flex items-center">
          {!isAnswered ? (
            onSubmitAnswer && (
              <Button
                size="lg"
                onClick={onSubmitAnswer}
                disabled={!hasSelectedAnswer || isLoading}
                className="text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3"
              >
                {isLoading ? "Đang gửi..." : "Gửi câu trả lời"}
              </Button>
            )
          ) : (
            <>
              {onNextQuestion && !isLastQuestion && (
                <Button
                  size="lg"
                  variant="default"
                  onClick={onNextQuestion}
                  disabled={isLoading}
                  className="text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3"
                >
                  {isLoading ? "Đang tải..." : "Câu tiếp theo →"}
                </Button>
              )}
              {isLastQuestion && (
                <Button
                  size="lg"
                  variant="default"
                  onClick={onNextQuestion}
                  disabled={isLoading}
                  className="text-base sm:text-lg px-6 sm:px-8 py-2 sm:py-3 bg-emerald-600 hover:bg-emerald-700 text-white animate-pulse"
                >
                  {isLoading ? "Đang xử lý..." : "Hoàn thành & Xem kết quả! 🎉"}
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
