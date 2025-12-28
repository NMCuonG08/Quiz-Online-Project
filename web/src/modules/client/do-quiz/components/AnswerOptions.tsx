"use client";

import React from "react";
import { Question, QuestionOption, UserAnswer } from "../types/quiz.types";
import { RadioGroup, RadioGroupItem } from "@/common/components/ui/radio-group";
import { Label } from "@/common/components/ui/label";
import { Textarea } from "@/common/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Edit3 } from "lucide-react";

interface AnswerOptionsProps {
  question: Question;
  userAnswer?: UserAnswer;
  onAnswerSelect: (
    answer: Omit<UserAnswer, "question_id" | "answered_at">
  ) => void;
  isSubmitting: boolean;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  question,
  userAnswer,
  onAnswerSelect,
  isSubmitting,
}) => {
  const handleOptionSelect = (option: QuestionOption) => {
    if (isSubmitting) return;

    const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
      selected_option_id: option.id,
      text_answer: undefined,
      is_correct: option.is_correct,
      points_earned: option.is_correct ? question.points : 0,
      time_spent: 0,
    };

    onAnswerSelect(answer);
  };

  const handleTextAnswer = (text: string) => {
    if (isSubmitting) return;

    const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
      selected_option_id: undefined,
      text_answer: text,
      is_correct: false,
      points_earned: 0,
      time_spent: 0,
    };

    onAnswerSelect(answer);
  };

  const isOptionSelected = (optionId: string) => {
    return userAnswer?.selected_option_id === optionId;
  };

  const renderMultipleChoice = () => (
    <div className="space-y-4">
      {[...question.options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option, index) => {
          const isSelected = isOptionSelected(option.id);
          return (
            <div
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              className={cn(
                "group relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom duration-500",
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                  : "border-border bg-card hover:border-primary/50 hover:bg-muted/50",
                isSubmitting && "opacity-50 pointer-events-none"
              )}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={cn(
                "flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-300",
                isSelected ? "bg-primary border-primary" : "border-border group-hover:border-primary/50"
              )}>
                {isSelected ? (
                  <Check className="w-6 h-6 text-primary-foreground" />
                ) : (
                  <span className="text-sm font-bold text-muted-foreground group-hover:text-primary transition-colors">
                    {String.fromCharCode(65 + index)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-lg font-medium transition-colors",
                  isSelected ? "text-primary" : "text-foreground"
                )}>
                  {option.content}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );

  const renderTrueFalse = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...question.options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => {
          const isSelected = isOptionSelected(option.id);
          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              disabled={isSubmitting}
              className={cn(
                "p-8 rounded-3xl border-2 transition-all duration-300 font-bold text-2xl uppercase tracking-wider relative overflow-hidden",
                isSelected
                  ? option.content.toLowerCase() === 'true'
                    ? "border-green-500 bg-green-500/10 text-green-500 shadow-xl shadow-green-500/10"
                    : "border-destructive bg-destructive/10 text-destructive shadow-xl shadow-destructive/10"
                  : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-muted",
                isSubmitting && "opacity-50"
              )}
            >
              {option.content}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <Check className="w-6 h-6" />
                </div>
              )}
            </button>
          );
        })}
    </div>
  );

  const renderFillBlank = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <Edit3 className="absolute top-4 left-4 w-5 h-5 text-muted-foreground" />
        <Textarea
          value={userAnswer?.text_answer || ""}
          onChange={(e) => handleTextAnswer(e.target.value)}
          disabled={isSubmitting}
          placeholder="Type your answer here..."
          className="min-h-[120px] pl-12 pt-4 rounded-2xl border-2 focus-visible:ring-primary/20 transition-all text-lg"
        />
      </div>
      <p className="text-sm text-muted-foreground italic pl-2">
        Tip: Your answer will be automatically saved as you type.
      </p>
    </div>
  );

  const renderEssay = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <Edit3 className="absolute top-4 left-4 w-5 h-5 text-muted-foreground" />
        <Textarea
          value={userAnswer?.text_answer || ""}
          onChange={(e) => handleTextAnswer(e.target.value)}
          disabled={isSubmitting}
          placeholder="Compose your essay response here..."
          className="min-h-[300px] pl-12 pt-4 rounded-2xl border-2 focus-visible:ring-primary/20 transition-all text-lg leading-relaxed"
        />
      </div>
      <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest font-bold px-2">
        <span>Format: Rich text supported</span>
        <span>Words: {(userAnswer?.text_answer || "").split(/\s+/).filter(Boolean).length}</span>
      </div>
    </div>
  );

  const renderAnswerOptions = () => {
    // Normalize question type to lowercase for comparison
    const questionType = question.question_type?.toLowerCase();

    switch (questionType) {
      case "multiple_choice":
        return renderMultipleChoice();
      case "true_false":
        return renderTrueFalse();
      case "fill_in_blank":
      case "fill_blank":
        return renderFillBlank();
      case "short_answer":
        return renderFillBlank(); // Same UI as fill blank
      case "essay":
        return renderEssay();
      default:
        return (
          <div className="p-8 text-center bg-destructive/5 rounded-2xl border-2 border-dashed border-destructive/20 text-destructive font-medium">
            Unsupported question type: {question.question_type}
          </div>
        );
    }
  };

  return (
    <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 md:p-8 shadow-2xl border border-border/50 animate-in fade-in slide-in-from-bottom duration-700">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Edit3 className="w-5 h-5 text-primary" />
        </div>
        <h4 className="text-xl font-bold text-foreground">Write your selection:</h4>
      </div>
      {renderAnswerOptions()}
    </div>
  );
};

export default AnswerOptions;
