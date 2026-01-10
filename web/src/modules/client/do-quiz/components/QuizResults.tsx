"use client";

import React from "react";
import { QuizResult, Question, UserAnswer } from "../types/quiz.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { CheckCircle2, XCircle, Trophy, Clock, RotateCcw, Home, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { APP_ROUTES } from "@/lib/appRoutes";

interface QuizResultsProps {
  result: QuizResult;
  questions?: Question[];
  userAnswers?: UserAnswer[];
  onRetakeQuiz: () => void;
  onViewAnswers: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  questions = [],
  userAnswers = [],
  onRetakeQuiz,
}) => {
  const router = useLocalizedRouter();

  // Calculate stats locally
  const stats = React.useMemo(() => {
    let correctCount = 0;
    let totalScore = 0;
    let maxScore = 0;

    questions.forEach(question => {
      maxScore += question.points || 1;

      const userAnswer = userAnswers.find(a => a.question_id === question.id);
      if (userAnswer?.selected_option_id) {
        const selectedOption = question.options.find(o => o.id === userAnswer.selected_option_id);
        if (selectedOption?.is_correct) {
          correctCount++;
          totalScore += question.points || 1;
        }
      }
    });

    const totalQuestions = questions.length || result.total_questions;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const passed = percentage >= 60;

    return {
      correct: correctCount,
      wrong: totalQuestions - correctCount,
      total: totalQuestions,
      score: totalScore,
      maxScore,
      percentage,
      passed,
      time: result.time_spent || 0,
    };
  }, [questions, userAnswers, result]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const getGrade = (percentage: number) => {
    if (percentage >= 90) return { grade: "A+", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900" };
    if (percentage >= 80) return { grade: "A", color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900" };
    if (percentage >= 70) return { grade: "B", color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900" };
    if (percentage >= 60) return { grade: "C", color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900" };
    if (percentage >= 50) return { grade: "D", color: "text-orange-600", bg: "bg-orange-100 dark:bg-orange-900" };
    return { grade: "F", color: "text-rose-600", bg: "bg-rose-100 dark:bg-rose-900" };
  };

  const gradeInfo = getGrade(stats.percentage);

  const getUserAnswerForQuestion = (questionId: string) => {
    return userAnswers.find(a => a.question_id === questionId);
  };

  const getCorrectOption = (question: Question) => {
    return question.options.find(o => o.is_correct);
  };

  const getSelectedOption = (question: Question, userAnswer?: UserAnswer) => {
    if (!userAnswer?.selected_option_id) return null;
    return question.options.find(o => o.id === userAnswer.selected_option_id);
  };

  return (
    <div className="max-w-3xl mx-auto p-4 space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className={cn(
          "inline-flex items-center justify-center w-20 h-20 rounded-full",
          stats.passed ? "bg-emerald-100 dark:bg-emerald-900" : "bg-rose-100 dark:bg-rose-900"
        )}>
          <Trophy className={cn(
            "w-10 h-10",
            stats.passed ? "text-emerald-600" : "text-rose-600"
          )} />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Quiz Completed!</h1>
        <Badge
          className={cn(
            "text-base px-5 py-1.5 font-semibold",
            stats.passed
              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
              : "bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300 border-rose-200 dark:border-rose-800"
          )}
          variant="outline"
        >
          {stats.passed ? "🎉 PASSED" : "😢 FAILED"}
        </Badge>
      </div>

      {/* Score Card */}
      <Card className="border shadow-lg bg-card text-card-foreground">
        <CardContent className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Grade */}
            <div className={cn("text-center p-4 rounded-xl", gradeInfo.bg)}>
              <div className={cn("text-4xl font-black mb-1", gradeInfo.color)}>
                {gradeInfo.grade}
              </div>
              <div className="text-xs text-muted-foreground font-semibold uppercase">Grade</div>
            </div>

            {/* Percentage */}
            <div className="text-center p-4 rounded-xl bg-indigo-100 dark:bg-indigo-900">
              <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400 mb-1">
                {stats.percentage}%
              </div>
              <div className="text-xs text-muted-foreground font-semibold uppercase">Score</div>
            </div>

            {/* Correct/Wrong */}
            <div className="text-center p-4 rounded-xl bg-violet-100 dark:bg-violet-900">
              <div className="text-3xl font-black mb-1">
                <span className="text-emerald-600 dark:text-emerald-400">{stats.correct}</span>
                <span className="text-gray-400 mx-1">/</span>
                <span className="text-rose-600 dark:text-rose-400">{stats.wrong}</span>
              </div>
              <div className="text-xs text-muted-foreground font-semibold uppercase">Right / Wrong</div>
            </div>

            {/* Time */}
            <div className="text-center p-4 rounded-xl bg-cyan-100 dark:bg-cyan-900">
              <div className="text-3xl font-black text-cyan-600 dark:text-cyan-400 mb-1">
                {formatTime(stats.time)}
              </div>
              <div className="text-xs text-muted-foreground font-semibold uppercase">Time</div>
            </div>
          </div>

          {/* Points */}
          <div className="mt-4 text-center">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 font-semibold text-sm">
              ⭐ Points: {stats.score} / {stats.maxScore}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          onClick={onRetakeQuiz}
          variant="outline"
          size="lg"
          className="h-12 font-semibold border-2 hover:bg-violet-50 dark:hover:bg-violet-950 hover:border-violet-300 dark:hover:border-violet-700"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
        <Button
          onClick={() => router.push(APP_ROUTES.HOME)}
          size="lg"
          className="h-12 font-semibold bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <Home className="w-4 h-4 mr-2" />
          Go Home
        </Button>
      </div>

      {/* Answer Review */}
      {questions.length > 0 && (
        <Card className="border shadow-lg bg-card text-card-foreground">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-bold">📝 Answer Review</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            {questions.map((question, index) => {
              const userAnswer = getUserAnswerForQuestion(question.id);
              const correctOption = getCorrectOption(question);
              const selectedOption = getSelectedOption(question, userAnswer);
              const isCorrect = selectedOption?.is_correct || false;
              const wasAnswered = !!selectedOption;

              return (
                <div
                  key={question.id}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all",
                    isCorrect
                      ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/50"
                      : wasAnswered
                        ? "border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950/50"
                        : "border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50"
                  )}
                >
                  {/* Question Header */}
                  <div className="flex items-start gap-3">
                    <div className={cn(
                      "flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-white text-sm font-bold",
                      isCorrect ? "bg-emerald-500" : wasAnswered ? "bg-rose-500" : "bg-amber-500"
                    )}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm">{question.content}</p>

                      {/* Answers */}
                      <div className="mt-2 space-y-1 text-xs">
                        {wasAnswered && !isCorrect && selectedOption && (
                          <div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Your answer: <strong>{selectedOption.content}</strong></span>
                          </div>
                        )}
                        {correctOption && (
                          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Correct: <strong>{correctOption.content}</strong></span>
                          </div>
                        )}
                        {!wasAnswered && (
                          <div className="text-amber-600 dark:text-amber-400 italic">
                            ⚠️ Question was skipped
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Status Icon */}
                    {isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    ) : wasAnswered ? (
                      <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
                    ) : null}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QuizResults;
