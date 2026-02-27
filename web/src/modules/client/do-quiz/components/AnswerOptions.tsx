"use client";

import React from "react";
import { Question, QuestionOption, UserAnswer } from "../types/quiz.types";
import { Textarea } from "@/common/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Check, Edit3 } from "lucide-react";
import MatchingGame from "./MatchingGame";

interface AnswerOptionsProps {
  question: Question;
  userAnswer?: UserAnswer;
  onAnswerSelect?: (
    answer: Omit<UserAnswer, "question_id" | "answered_at">
  ) => void;
  isSubmitting?: boolean;
  readOnly?: boolean;
  showCorrectAnswers?: boolean;
}

const AnswerOptions: React.FC<AnswerOptionsProps> = ({
  question,
  userAnswer,
  onAnswerSelect,
  isSubmitting = false,
  readOnly = false,
  showCorrectAnswers = false,
}) => {
  const handleOptionSelect = (option: QuestionOption) => {
    if (isSubmitting || readOnly || !onAnswerSelect) return;

    const questionType = question.question_type?.toLowerCase();
    const isMultipleSelect = questionType === "multiple_choice";

    if (isMultipleSelect) {
      const currentSelectedIds = userAnswer?.selected_option_ids || [];
      const isAlreadySelected = currentSelectedIds.includes(option.id);

      let newSelectedIds: string[];
      if (isAlreadySelected) {
        newSelectedIds = currentSelectedIds.filter(id => id !== option.id);
      } else {
        newSelectedIds = [...currentSelectedIds, option.id];
      }

      // Check if the set of selected options matches the set of correct options
      const correctOptionIds = question.options
        .filter(opt => opt.is_correct)
        .map(opt => opt.id);

      const isCorrect =
        newSelectedIds.length === correctOptionIds.length &&
        newSelectedIds.every(id => correctOptionIds.includes(id));

      const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
        selected_option_ids: newSelectedIds,
        selected_option_id: newSelectedIds.length === 1 ? newSelectedIds[0] : undefined,
        text_answer: undefined,
        is_correct: isCorrect,
        points_earned: isCorrect ? question.points : 0,
        time_spent: 0,
      };
      onAnswerSelect(answer);
    } else {
      // Single selection logic (Standard for SINGLE_CHOICE and TRUE_FALSE)
      const isAlreadySelected = userAnswer?.selected_option_id === option.id;

      if (isAlreadySelected) {
        const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
          selected_option_ids: [],
          selected_option_id: undefined,
          text_answer: undefined,
          is_correct: false,
          points_earned: 0,
          time_spent: 0,
        };
        onAnswerSelect(answer);
      } else {
        const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
          selected_option_ids: [option.id],
          selected_option_id: option.id,
          text_answer: undefined,
          is_correct: option.is_correct,
          points_earned: option.is_correct ? question.points : 0,
          time_spent: 0,
        };
        onAnswerSelect(answer);
      }
    }
  };

  const handleTextAnswer = (text: string) => {
    if (isSubmitting || readOnly || !onAnswerSelect) return;

    const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
      selected_option_id: undefined,
      selected_option_ids: [],
      text_answer: text,
      is_correct: false,
      points_earned: 0,
      time_spent: 0,
    };

    onAnswerSelect(answer);
  };

  const isOptionSelected = (optionId: string) => {
    if (userAnswer?.selected_option_ids) {
      return userAnswer.selected_option_ids.includes(optionId);
    }
    return userAnswer?.selected_option_id === optionId;
  };

  const renderChoiceOptions = () => {
    const isMultipleSelect = question.question_type?.toLowerCase() === "multiple_choice";

    return (
      <div className="space-y-4">
        {[...question.options]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((option, index) => {
            const isSelected = isOptionSelected(option.id);
            const isCorrectOption = option.is_correct;

            let optionColorClass = isSelected
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
              : "border-border bg-card hover:border-primary/50 hover:bg-muted/50";

            let iconClass = isSelected ? "bg-primary border-primary" : "border-border group-hover:border-primary/50";
            let iconTextClass = "text-muted-foreground group-hover:text-primary transition-colors";

            if (showCorrectAnswers) {
              if (isCorrectOption) {
                optionColorClass = "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950 shadow-emerald-500/10";
                iconClass = "bg-emerald-500 border-emerald-500";
              } else if (isSelected && !isCorrectOption) {
                optionColorClass = "border-rose-500 bg-rose-50/50 dark:bg-rose-950 shadow-rose-500/10";
                iconClass = "bg-rose-500 border-rose-500";
              } else {
                optionColorClass = "border-border bg-card opacity-50";
              }
            }

            return (
              <div
                key={option.id}
                onClick={() => handleOptionSelect(option)}
                className={cn(
                  "group relative flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-300 animate-in fade-in slide-in-from-bottom duration-500",
                  !readOnly && "cursor-pointer",
                  optionColorClass,
                  isSubmitting && "opacity-50 pointer-events-none"
                )}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-xl border-2 transition-all duration-300 flex-shrink-0 mt-1",
                  iconClass,
                  !isMultipleSelect && "rounded-full" // Round for single choice
                )}>
                  {isSelected || (showCorrectAnswers && isCorrectOption) ? (
                    <Check className="w-6 h-6 text-white" />
                  ) : (
                    <span className={cn("text-sm font-bold", iconTextClass)}>
                      {String.fromCharCode(65 + index)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  {option.media_url && (
                    <div className="mb-3">
                      <img
                        src={option.media_url}
                        alt={`Option ${String.fromCharCode(65 + index)}`}
                        className="max-w-full max-h-40 rounded-lg object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                  <p className={cn(
                    "text-lg font-medium transition-colors",
                    (isSelected || (showCorrectAnswers && isCorrectOption)) ? "text-foreground font-bold" : "text-foreground"
                  )}>
                    {option.content}
                  </p>
                </div>
                {isMultipleSelect && (
                  <div className={cn(
                    "flex-shrink-0 w-6 h-6 border-2 rounded-md flex items-center justify-center transition-all mt-2",
                    isSelected || (showCorrectAnswers && isCorrectOption) ? "bg-primary border-primary" : "border-muted-foreground/30"
                  )}>
                    {(isSelected || (showCorrectAnswers && isCorrectOption)) && <Check className="w-4 h-4 text-primary-foreground" />}
                  </div>
                )}
              </div>
            );
          })}
        {isMultipleSelect && (
          <p className="text-sm text-primary/70 font-medium italic mt-4 pl-2">
            * Đây là câu hỏi có thể chọn nhiều đáp án
          </p>
        )}
      </div>
    );
  };

  const renderTrueFalse = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[...question.options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((option) => {
          const isSelected = isOptionSelected(option.id);
          const isCorrectOption = option.is_correct;

          let optionColorClass = isSelected
            ? option.content.toLowerCase() === 'true'
              ? "border-green-500 bg-green-500/10 text-green-500 shadow-xl shadow-green-500/10"
              : "border-destructive bg-destructive/10 text-destructive shadow-xl shadow-destructive/10"
            : "border-border bg-card text-muted-foreground hover:border-primary hover:text-primary hover:bg-muted";

          if (showCorrectAnswers) {
            if (isCorrectOption) {
              optionColorClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 shadow-emerald-500/10";
            } else if (isSelected && !isCorrectOption) {
              optionColorClass = "border-rose-500 bg-rose-50 dark:bg-rose-950 text-rose-600 shadow-rose-500/10";
            } else {
              optionColorClass = "border-border bg-card text-muted-foreground opacity-50";
            }
          }

          return (
            <button
              key={option.id}
              onClick={() => handleOptionSelect(option)}
              disabled={isSubmitting || readOnly}
              className={cn(
                "p-8 rounded-3xl border-2 transition-all duration-300 font-bold text-2xl uppercase tracking-wider relative overflow-hidden flex flex-col items-center gap-4",
                optionColorClass,
                isSubmitting && "opacity-50"
              )}
            >
              {option.media_url && (
                <img
                  src={option.media_url}
                  alt={option.content}
                  className="max-w-full max-h-32 rounded-lg object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              )}
              {option.content}
              {(isSelected || (showCorrectAnswers && isCorrectOption)) && (
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
          disabled={isSubmitting || readOnly}
          placeholder="Type your answer here..."
          className="min-h-[120px] pl-12 pt-4 rounded-2xl border-2 focus-visible:ring-primary/20 transition-all text-lg"
        />
      </div>
      {!readOnly && (
        <p className="text-sm text-muted-foreground italic pl-2">
          Tip: Your answer will be automatically saved as you type.
        </p>
      )}
      {showCorrectAnswers && (
        <div className="mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50">
          <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400 mb-1">Correct Answer(s):</p>
          <ul className="list-disc list-inside text-sm text-emerald-600 dark:text-emerald-300">
            {question.options.filter(o => o.is_correct).map((o, i) => (
              <li key={i}>{o.content}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  const renderEssay = () => (
    <div className="space-y-4 animate-in fade-in zoom-in-95 duration-500">
      <div className="relative">
        <Edit3 className="absolute top-4 left-4 w-5 h-5 text-muted-foreground" />
        <Textarea
          value={userAnswer?.text_answer || ""}
          onChange={(e) => handleTextAnswer(e.target.value)}
          disabled={isSubmitting || readOnly}
          placeholder="Compose your essay response here..."
          className="min-h-[300px] pl-12 pt-4 rounded-2xl border-2 focus-visible:ring-primary/20 transition-all text-lg leading-relaxed"
        />
      </div>
      {!readOnly && (
        <div className="flex justify-between items-center text-xs text-muted-foreground uppercase tracking-widest font-bold px-2">
          <span>Format: Rich text supported</span>
          <span>Words: {(userAnswer?.text_answer || "").split(/\s+/).filter(Boolean).length}</span>
        </div>
      )}
      {showCorrectAnswers && (
        <div className="mt-4 p-4 rounded-xl border border-sky-200 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 text-sm">
          <i>An essay must be graded by an instructor. Your answer is kept for review.</i>
        </div>
      )}
    </div>
  );

  // Parse matching pair from option content (JSON format: { left, right })
  const parseMatchingPair = (content: string): { left: string; right: string } => {
    try {
      const parsed = JSON.parse(content);
      return { left: parsed.left || content, right: parsed.right || "" };
    } catch {
      return { left: content, right: "" };
    }
  };

  const renderMatching = () => {
    // Parse pairs from question options
    const pairs = question.options.map(opt => ({
      id: opt.id,
      ...parseMatchingPair(opt.content),
    }));

    // Parse user's matching answers (stored as JSON in text_answer)
    const getUserMatches = (): Record<string, string> => {
      if (!userAnswer?.text_answer) return {};
      try {
        return JSON.parse(userAnswer.text_answer);
      } catch {
        return {};
      }
    };

    const userMatches = getUserMatches();

    const handleMatchChange = (leftId: string, rightId: string) => {
      if (isSubmitting || readOnly || !onAnswerSelect) return;

      const newMatches = { ...userMatches };

      // Toggle: if same selection, remove it
      if (newMatches[leftId] === rightId) {
        delete newMatches[leftId];
      } else {
        // Remove any existing match for this left item
        delete newMatches[leftId];
        // Remove any existing match that uses this right item
        Object.keys(newMatches).forEach(key => {
          if (newMatches[key] === rightId) {
            delete newMatches[key];
          }
        });
        // Add new match
        newMatches[leftId] = rightId;
      }

      // Calculate if all matches are correct
      const allCorrect = pairs.every(p => newMatches[p.id] === p.id);

      const answer: Omit<UserAnswer, "question_id" | "answered_at"> = {
        selected_option_id: undefined,
        text_answer: JSON.stringify(newMatches),
        is_correct: allCorrect,
        points_earned: allCorrect ? question.points : 0,
        time_spent: 0,
      };

      onAnswerSelect(answer);
    };

    return (
      <div className="space-y-4">
        <MatchingGame
          pairs={pairs}
          userMatches={showCorrectAnswers ? Object.fromEntries(pairs.map(p => [p.id, p.id])) : userMatches}
          onMatchChange={handleMatchChange}
          isSubmitting={isSubmitting || readOnly}
        />
        {readOnly && showCorrectAnswers && (
          <div className="text-sm font-medium text-emerald-600 text-center">
            Currently displaying correct matching pairs pattern.
          </div>
        )}
      </div>
    );
  };

  const renderAnswerOptions = () => {
    const questionType = question.question_type?.toLowerCase();

    switch (questionType) {
      case "single_choice":
      case "multiple_choice":
        return renderChoiceOptions();
      case "true_false":
        return renderTrueFalse();
      case "fill_in_blank":
      case "fill_blank":
        return renderFillBlank();
      case "short_answer":
        return renderFillBlank();
      case "essay":
        return renderEssay();
      case "matching":
        return renderMatching();
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
        <h4 className="text-xl font-bold text-foreground">Chọn câu trả lời:</h4>
      </div>
      {renderAnswerOptions()}
    </div>
  );
};

export default AnswerOptions;
