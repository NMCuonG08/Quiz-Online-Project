"use client";

import React, { useState, useEffect } from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { IQuestionRendererStrategy } from "./IQuestionRendererStrategy";
import { QuestionRendererProps } from "../types/game-quiz.types";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Input } from "@/common/components/ui/input";
import { cn } from "@/lib/utils";

const FillBlankRenderer: React.FC<QuestionRendererProps> = (props) => {
  const {
    question,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    onAnswerSelect,
    isAnswered,
    timeRemaining,
  } = props;
  const [inputValue, setInputValue] = useState(
    typeof selectedAnswer === "string" ? selectedAnswer : ""
  );

  // Sync with selectedAnswer prop
  useEffect(() => {
    if (typeof selectedAnswer === "string") {
      setInputValue(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    onAnswerSelect(value);
  };

  const isCorrect =
    isAnswered && question.correct_answer
      ? inputValue.toLowerCase().trim() ===
        question.correct_answer.toLowerCase().trim()
      : false;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Question Header */}
      <div className="w-full max-w-6xl mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
          {timeRemaining !== undefined && (
            <Badge
              variant="secondary"
              className="text-2xl sm:text-3xl md:text-4xl px-4 py-2 text-yellow-600 dark:text-yellow-400"
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
        </div>
      )}

      {/* Question Content */}
      <div className="w-full max-w-6xl mb-8 sm:mb-12">
        <Card className="p-6 sm:p-8 md:p-10">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground text-center leading-tight mb-4">
            {question.content}
          </h2>
          <div className="text-center">
            <Badge
              variant="secondary"
              className="text-lg sm:text-xl md:text-2xl px-4 py-2"
            >
              {question.points} điểm
            </Badge>
          </div>
        </Card>
      </div>

      {/* Answer Input */}
      <div className="w-full max-w-4xl">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          disabled={isAnswered}
          placeholder="Nhập câu trả lời của bạn..."
          className={cn(
            "w-full p-6 sm:p-8 text-2xl sm:text-3xl md:text-4xl font-semibold h-auto",
            isAnswered &&
              isCorrect &&
              "border-green-500 bg-green-50 dark:bg-green-950/50",
            isAnswered &&
              !isCorrect &&
              "border-destructive bg-destructive/10 dark:bg-destructive/20"
          )}
        />
        {isAnswered && question.correct_answer && (
          <Card className="mt-6 p-4 sm:p-6">
            <div className="text-center">
              <Badge
                variant={isCorrect ? "default" : "destructive"}
                className="text-xl sm:text-2xl md:text-3xl px-4 py-2 mb-4"
              >
                {isCorrect ? "✓ Đúng!" : "✗ Sai"}
              </Badge>
              <div className="text-lg sm:text-xl md:text-2xl text-muted-foreground mt-4">
                Đáp án đúng:{" "}
                <span className="font-bold text-foreground">
                  {question.correct_answer}
                </span>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export class FillBlankStrategy implements IQuestionRendererStrategy {
  render(props: QuestionRendererProps): React.ReactNode {
    return <FillBlankRenderer {...props} />;
  }

  validateAnswer(question: Question, answer: string | string[]): boolean {
    if (typeof answer !== "string") return false;
    if (!question.correct_answer) return false;
    return (
      answer.toLowerCase().trim() ===
      question.correct_answer.toLowerCase().trim()
    );
  }

  getDefaultAnswer(): string {
    return "";
  }
}
