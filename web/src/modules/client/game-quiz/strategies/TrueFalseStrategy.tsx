"use client";

import React from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { IQuestionRendererStrategy } from "./IQuestionRendererStrategy";
import { QuestionRendererProps } from "../types/game-quiz.types";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Button } from "@/common/components/ui/button";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

const TrueFalseRenderer: React.FC<QuestionRendererProps> = (props) => {
  const {
    question,
    selectedAnswer,
    onAnswerSelect,
    isAnswered,
    timeRemaining,
  } = props;
  const t = useTranslations("gameQuiz");
  const selectedId =
    typeof selectedAnswer === "string" ? selectedAnswer : undefined;

  // Find True and False options
  const trueOption = question.options.find(
    (opt) =>
      opt.content.toLowerCase().includes("true") ||
      opt.content.toLowerCase().includes("đúng")
  );
  const falseOption = question.options.find(
    (opt) =>
      opt.content.toLowerCase().includes("false") ||
      opt.content.toLowerCase().includes("sai")
  );

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
                alt={t("questionMedia")}
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
                {t("videoNotSupported")}
              </video>
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
              {t("points", { count: question.points })}
            </Badge>
          </div>
        </Card>
      </div>

      {/* True/False Buttons */}
      <div className="w-full max-w-4xl grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-6">
        {trueOption && (
          <Button
            onClick={() => !isAnswered && onAnswerSelect(trueOption.id)}
            disabled={isAnswered}
            variant={selectedId === trueOption.id ? "default" : "outline"}
            size="xl"
            className={cn(
              "h-auto w-full p-5 sm:p-6 md:p-7 text-center flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] text-2xl sm:text-3xl md:text-4xl font-bold",
              selectedId === trueOption.id &&
              isAnswered &&
              trueOption.is_correct &&
              "bg-green-500 hover:bg-green-600 text-white",
              selectedId === trueOption.id &&
              isAnswered &&
              !trueOption.is_correct &&
              "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
              isAnswered &&
              trueOption.is_correct &&
              !selectedId &&
              "bg-green-50 dark:bg-green-950/50 border-green-500 text-green-700 dark:text-green-300"
            )}
          >
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3">✓</div>
            <div>{t("true")}</div>
            {selectedId === trueOption.id && (
              <Badge
                variant="default"
                className="absolute top-4 right-4 text-xl"
              >
                ✓
              </Badge>
            )}
          </Button>
        )}

        {falseOption && (
          <Button
            onClick={() => !isAnswered && onAnswerSelect(falseOption.id)}
            disabled={isAnswered}
            variant={selectedId === falseOption.id ? "default" : "outline"}
            size="xl"
            className={cn(
              "h-auto w-full p-5 sm:p-6 md:p-7 text-center flex flex-col items-center justify-center min-h-[140px] sm:min-h-[160px] text-2xl sm:text-3xl md:text-4xl font-bold",
              selectedId === falseOption.id &&
              isAnswered &&
              falseOption.is_correct &&
              "bg-green-500 hover:bg-green-600 text-white",
              selectedId === falseOption.id &&
              isAnswered &&
              !falseOption.is_correct &&
              "bg-destructive hover:bg-destructive/90 text-destructive-foreground",
              isAnswered &&
              falseOption.is_correct &&
              !selectedId &&
              "bg-green-50 dark:bg-green-950/50 border-green-500 text-green-700 dark:text-green-300"
            )}
          >
            <div className="text-4xl sm:text-5xl md:text-6xl mb-3">✗</div>
            <div>{t("false")}</div>
            {selectedId === falseOption.id && (
              <Badge
                variant="default"
                className="absolute top-4 right-4 text-xl"
              >
                ✓
              </Badge>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export class TrueFalseStrategy implements IQuestionRendererStrategy {
  render(props: QuestionRendererProps): React.ReactNode {
    return <TrueFalseRenderer {...props} />;
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
