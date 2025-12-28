"use client";

import React from "react";
import { QuizProgress } from "../types/quiz.types";
import { Timer } from "lucide-react";
import QuestionNavigator from "./QuestionNavigator";

interface QuizHeaderProps {
  title: string;
  progress: QuizProgress;
  timeRemaining: number;
  timerActive: boolean;
  answeredQuestions: Set<number>;
  onQuestionSelect: (index: number) => void;
}

const QuizHeader: React.FC<QuizHeaderProps> = ({
  title,
  progress,
  timeRemaining,
  timerActive,
  answeredQuestions,
  onQuestionSelect,
}) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="bg-background/80 backdrop-blur-md sticky top-0 z-50 border-b border-border shadow-sm transition-all duration-300">
      <div className="max-w-4xl mx-auto px-4 py-4 lg:py-6">
        <div className="flex items-center justify-between gap-4">
          {/* Quiz Title */}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-foreground truncate animate-in fade-in slide-in-from-left duration-500">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1 flex items-center gap-2">
              <span className="flex items-center justify-center bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                Question {progress.current_question}/{progress.total_questions}
              </span>
            </p>
          </div>

          {/* Question Navigator */}
          <QuestionNavigator
            totalQuestions={progress.total_questions}
            currentQuestion={progress.current_question - 1}
            answeredQuestions={answeredQuestions}
            onQuestionSelect={onQuestionSelect}
          />

          {/* Timer */}
          <div className="flex items-center">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${timeRemaining <= 60
              ? "bg-destructive/10 text-destructive animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.2)]"
              : "bg-muted text-foreground"
              }`}>
              <Timer className={`w-5 h-5 ${timeRemaining <= 60 ? "animate-spin-slow" : ""}`} />
              <div className="text-xl md:text-2xl font-mono font-bold tracking-tighter">
                {formatTime(timeRemaining)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizHeader;

