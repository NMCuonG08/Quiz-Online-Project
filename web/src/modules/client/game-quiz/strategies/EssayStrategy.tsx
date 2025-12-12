"use client";

import React, { useState, useEffect } from "react";
import { Question } from "../../do-quiz/types/quiz.types";
import { IQuestionRendererStrategy } from "./IQuestionRendererStrategy";
import { QuestionRendererProps } from "../types/game-quiz.types";
import { Card } from "@/common/components/ui/card";
import { Badge } from "@/common/components/ui/badge";
import { Textarea } from "@/common/components/ui/textarea";

const EssayRenderer: React.FC<QuestionRendererProps> = (props) => {
  const { question, questionNumber, totalQuestions, selectedAnswer, onAnswerSelect, isAnswered, timeRemaining } = props;
  const [textValue, setTextValue] = useState(
    typeof selectedAnswer === "string" ? selectedAnswer : ""
  );

  // Sync with selectedAnswer prop
  useEffect(() => {
    if (typeof selectedAnswer === "string") {
      setTextValue(selectedAnswer);
    }
  }, [selectedAnswer]);

  const handleTextChange = (value: string) => {
    setTextValue(value);
    onAnswerSelect(value);
  };

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
      {/* Question Header */}
      <div className="w-full max-w-6xl mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6 gap-4">
          <Badge variant="outline" className="text-xl sm:text-2xl md:text-3xl px-4 py-2">
            Câu hỏi {questionNumber} / {totalQuestions}
          </Badge>
          {timeRemaining !== undefined && (
            <Badge variant="secondary" className="text-2xl sm:text-3xl md:text-4xl px-4 py-2 text-yellow-600 dark:text-yellow-400">
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
            <Badge variant="secondary" className="text-lg sm:text-xl md:text-2xl px-4 py-2">
              {question.points} điểm
            </Badge>
          </div>
        </Card>
      </div>

      {/* Essay Textarea */}
      <div className="w-full max-w-5xl">
        <Textarea
          value={textValue}
          onChange={(e) => handleTextChange(e.target.value)}
          disabled={isAnswered}
          placeholder="Nhập câu trả lời của bạn..."
          rows={12}
          className="w-full p-6 sm:p-8 text-xl sm:text-2xl font-medium min-h-[300px] sm:min-h-[400px] resize-none"
        />
        <div className="mt-4 text-right">
          <Badge variant="outline" className="text-base sm:text-lg md:text-xl px-3 py-1">
            {textValue.length} ký tự
          </Badge>
        </div>
      </div>
    </div>
  );
};

export class EssayStrategy implements IQuestionRendererStrategy {
  render(props: QuestionRendererProps): React.ReactNode {
    return <EssayRenderer {...props} />;
  }

  validateAnswer(question: Question, answer: string | string[]): boolean {
    // Essay questions are typically manually graded, so we return true if there's content
    if (typeof answer !== "string") return false;
    return answer.trim().length > 0;
  }

  getDefaultAnswer(): string {
    return "";
  }
}

