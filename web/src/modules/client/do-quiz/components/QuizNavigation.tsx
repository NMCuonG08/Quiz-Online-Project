"use client";

import React from "react";
import { Button } from "@/common/components/ui/button";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2 } from "lucide-react";

interface QuizNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isSubmitting: boolean;
}

const QuizNavigation: React.FC<QuizNavigationProps> = ({
  currentQuestion,
  totalQuestions,
  onPrevious,
  onNext,
  onSubmit,
  isFirstQuestion,
  isLastQuestion,
  isSubmitting,
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t border-border px-6 py-6 z-40 animate-in slide-in-from-bottom duration-500">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="lg"
          onClick={onPrevious}
          disabled={isFirstQuestion || isSubmitting}
          className="h-14 px-8 rounded-2xl border-2 hover:bg-muted font-bold transition-all"
        >
          <ArrowLeft className="w-5 h-5 mr-3" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        {/* Question Progress (Mobile friendly) */}
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">
            Step
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-2xl font-black text-primary leading-none">{currentQuestion}</span>
            <span className="text-lg font-bold text-muted-foreground/30">/</span>
            <span className="text-lg font-bold text-muted-foreground leading-none">{totalQuestions}</span>
          </div>
        </div>

        {/* Next/Submit Button */}
        {isLastQuestion ? (
          <Button
            size="lg"
            onClick={onSubmit}
            disabled={isSubmitting}
            className="h-14 px-10 rounded-2xl font-black transition-all shadow-xl shadow-primary/20 bg-green-600 hover:bg-green-700 hover:scale-105"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Finish Quiz
                <CheckCircle2 className="w-6 h-6 ml-3" />
              </>
            )}
          </Button>
        ) : (
          <Button
            size="lg"
            onClick={onNext}
            disabled={isSubmitting}
            className="h-14 px-10 rounded-2xl font-black transition-all bg-primary hover:scale-105"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-6 h-6 ml-3" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuizNavigation;

