"use client";

import React from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { IQuestionRendererStrategy } from "./IQuestionRendererStrategy";
import { QuestionRendererProps } from "../types/game-quiz.types";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/lib/utils";

export class MultipleChoiceStrategy implements IQuestionRendererStrategy {
  render(props: QuestionRendererProps): React.ReactNode {
    const {
      question,
      questionNumber,
      totalQuestions,
      selectedAnswer,
      onAnswerSelect,
      isAnswered,
      timeRemaining,
    } = props;
    const selectedId =
      typeof selectedAnswer === "string" ? selectedAnswer : undefined;

    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-3 sm:p-5 md:p-6">
        {/* Question Header */}
        <div className="w-full max-w-5xl mb-4 sm:mb-6">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-3 sm:gap-4">
            {timeRemaining !== undefined && (
              <Badge
                variant="secondary"
                className="text-xl sm:text-2xl md:text-3xl px-3 py-1.5 text-yellow-600 dark:text-yellow-400"
              >
                ⏱ {timeRemaining}s
              </Badge>
            )}
          </div>
        </div>

        {/* Media Display */}
        {question.media_url && (
          <div className="w-full max-w-5xl mb-8 sm:mb-12">
            {question.media_type === "image" && (
              <Card className="p-2 overflow-hidden">
                <img
                  src={question.media_url}
                  alt="Question media"
                  className="w-full h-auto max-h-96 object-contain rounded-lg"
                />
              </Card>
            )}
            {question.media_type === "video" && (
              <Card className="p-2 overflow-hidden">
                <video
                  src={question.media_url}
                  controls
                  className="w-full h-auto max-h-96 rounded-lg"
                >
                  Your browser does not support the video tag.
                </video>
              </Card>
            )}
            {question.media_type === "audio" && (
              <Card className="p-6">
                <audio src={question.media_url} controls className="w-full">
                  Your browser does not support the audio element.
                </audio>
              </Card>
            )}
          </div>
        )}

        {/* Question Content */}
        <div className="w-full max-w-5xl mb-6 sm:mb-8">
          <Card className="p-5 sm:p-6 md:p-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground text-center leading-tight mb-3">
              {question.content}
            </h2>
            <div className="text-center">
              <Badge
                variant="secondary"
                className="text-base sm:text-lg md:text-xl px-3 py-1.5"
              >
                {question.points} điểm
              </Badge>
            </div>
          </Card>
        </div>

        {/* Answer Options */}
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {question.options
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((option) => {
              const isSelected = selectedId === option.id;
              const isCorrect = option.is_correct;
              const showResult = isAnswered && isCorrect;

              return (
                <Button
                  key={option.id}
                  onClick={() => !isAnswered && onAnswerSelect(option.id)}
                  disabled={isAnswered}
                  variant={isSelected ? "default" : "outline"}
                  size="xl"
                  className={cn(
                    "h-auto w-full p-4 sm:p-5 md:p-6 text-left justify-start text-lg sm:text-xl md:text-2xl font-semibold min-h-[88px] sm:min-h-[104px]",
                    isSelected &&
                      isAnswered &&
                      isCorrect &&
                      "bg-green-500 hover:bg-green-600 text-white border-green-500",
                    isSelected &&
                      isAnswered &&
                      !isCorrect &&
                      "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive",
                    isSelected && !isAnswered && "",
                    showResult &&
                      !isSelected &&
                      "bg-green-50 dark:bg-green-950/50 border-green-500 text-green-700 dark:text-green-300"
                  )}
                >
                  <div className="flex items-center w-full gap-4">
                    <Badge
                      variant={isSelected ? "default" : "outline"}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center text-xl sm:text-2xl font-bold shrink-0"
                    >
                      {String.fromCharCode(65 + option.sort_order)}
                    </Badge>
                    <div className="flex-1">{option.content}</div>
                    {(isSelected || (showResult && !isSelected)) && (
                      <span className="text-3xl sm:text-4xl ml-2">✓</span>
                    )}
                  </div>
                </Button>
              );
            })}
        </div>
      </div>
    );
  }

  validateAnswer(question: Question, answer: string | string[]): boolean {
    if (typeof answer !== "string") return false;
    const selectedOption = question.options.find((opt) => opt.id === answer);
    return selectedOption?.is_correct ?? false;
  }

  getDefaultAnswer(): string {
    return "";
  }
}
