"use client";

import React from "react";
import { QuizResult, Question, UserAnswer } from "../types/quiz.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { CheckCircle2, XCircle, Trophy, Clock, Target, RotateCcw, Star, Share2, Home, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
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
  onViewAnswers,
}) => {
  const router = useRouter();
  const [showDetails, setShowDetails] = React.useState(true);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m ${secs}s`;
    if (minutes > 0) return `${minutes}m ${secs}s`;
    return `${secs}s`;
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-500 shadow-green-500/20";
    if (percentage >= 60) return "text-yellow-500 shadow-yellow-500/20";
    return "text-destructive shadow-destructive/20";
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Legendary! You're a quiz master! 🎉";
    if (percentage >= 80) return "Brilliant! Almost perfect! 👏";
    if (percentage >= 70) return "Solid effort! Good job! 👍";
    if (percentage >= 60) return "Decent, but you can do better! 💪";
    return "Time to hit the books again! 📚";
  };

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
    <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in zoom-in-95 duration-700">
      {/* Summary Card */}
      <Card className="overflow-hidden border-none shadow-2xl bg-card/50 backdrop-blur-md">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-violet-500 to-primary" />

        <CardHeader className="text-center pt-12 pb-8">
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center animate-bounce shadow-xl">
              <Trophy className="w-12 h-12 text-primary" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center animate-pulse">
              <Star className="w-5 h-5 text-white fill-white" />
            </div>
          </div>
          <CardTitle className="text-4xl font-black tracking-tighter sm:text-5xl">Quiz Completed!</CardTitle>
          <CardDescription className="text-xl font-medium mt-4 text-muted-foreground">{getScoreMessage(result.percentage)}</CardDescription>
        </CardHeader>

        <CardContent className="px-6 md:px-12 pb-12 space-y-10">
          {/* Main Score Display */}
          <div className="relative group p-10 rounded-3xl bg-muted/30 border border-border/50 text-center overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 opacity-50" />

            <div className={cn(
              "text-7xl md:text-8xl font-black tracking-tighter mb-4 drop-shadow-2xl transition-transform duration-500 group-hover:scale-110",
              getScoreColor(result.percentage)
            )}>
              {result.percentage}%
            </div>

            <div className="flex flex-col gap-2 relative z-10">
              <p className="text-xl font-bold text-foreground">
                Score: <span className="text-primary">{result.correct_answers}</span> / {result.total_questions}
              </p>
              <Badge variant="outline" className="mx-auto px-4 py-1.5 rounded-full bg-background/50 border-primary/20 backdrop-blur-md">
                Total points: {result.total_score}
              </Badge>
            </div>
          </div>

          {/* Detailed Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: CheckCircle2, label: "Correct", value: result.correct_answers, color: "text-green-500", bg: "bg-green-500/10" },
              { icon: XCircle, label: "Wrong", value: result.total_questions - result.correct_answers, color: "text-red-500", bg: "bg-red-500/10" },
              { icon: Clock, label: "Time Taken", value: formatTime(result.time_spent), color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Target, label: "Status", value: result.passed ? "PASSED" : "FAILED", color: result.passed ? "text-green-500" : "text-destructive", bg: result.passed ? "bg-green-500/10" : "bg-destructive/10" }
            ].map((stat, i) => (
              <div key={i} className="p-4 rounded-2xl bg-card border border-border shadow-sm flex flex-col items-center justify-center gap-2 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className={cn("p-2 rounded-xl mb-1", stat.bg)}>
                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</span>
                <span className="text-lg font-bold text-foreground">{stat.value}</span>
              </div>
            ))}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <Button onClick={onRetakeQuiz} variant="outline" size="lg" className="h-14 rounded-2xl font-bold border-2 hover:bg-muted group">
              <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </Button>
            <Button variant="outline" size="lg" className="h-14 rounded-2xl font-bold border-2 hover:bg-muted" onClick={() => router.push(APP_ROUTES.HOME)}>
              <Home className="w-5 h-5 mr-3" />
              Home
            </Button>
            <Button size="lg" className="h-14 rounded-2xl font-black bg-primary text-primary-foreground shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Share2 className="w-5 h-5 mr-3" />
              Share result
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Questions Review Section */}
      {questions.length > 0 && (
        <Card className="overflow-hidden border-none shadow-xl bg-card/50 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <div>
              <CardTitle className="text-2xl font-bold">Answer Review</CardTitle>
              <CardDescription>See how you answered each question</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
              className="rounded-xl"
            >
              {showDetails ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </Button>
          </CardHeader>

          {showDetails && (
            <CardContent className="space-y-4 pb-8">
              {questions.map((question, index) => {
                const userAnswer = getUserAnswerForQuestion(question.id);
                const correctOption = getCorrectOption(question);
                const selectedOption = getSelectedOption(question, userAnswer);
                const isCorrect = userAnswer?.is_correct || false;
                const wasAnswered = !!selectedOption;

                return (
                  <div
                    key={question.id}
                    className={cn(
                      "p-5 rounded-2xl border-2 transition-all",
                      isCorrect
                        ? "border-green-500/30 bg-green-500/5"
                        : wasAnswered
                          ? "border-red-500/30 bg-red-500/5"
                          : "border-yellow-500/30 bg-yellow-500/5"
                    )}
                  >
                    {/* Question Header */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center",
                        isCorrect
                          ? "bg-green-500 text-white"
                          : wasAnswered
                            ? "bg-red-500 text-white"
                            : "bg-yellow-500 text-white"
                      )}>
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : wasAnswered ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          <span className="text-sm font-bold">?</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Question {index + 1}
                        </p>
                        <p className="font-semibold text-foreground">{question.content}</p>
                      </div>
                      <Badge variant="outline" className={cn(
                        "text-xs",
                        isCorrect ? "text-green-600 border-green-500" : wasAnswered ? "text-red-600 border-red-500" : "text-yellow-600 border-yellow-500"
                      )}>
                        {isCorrect ? "Correct" : wasAnswered ? "Wrong" : "Skipped"}
                      </Badge>
                    </div>

                    {/* Answers */}
                    <div className="ml-11 space-y-2">
                      {wasAnswered && !isCorrect && selectedOption && (
                        <div className="flex items-center gap-2 text-sm">
                          <XCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-red-600 dark:text-red-400">Your answer: {selectedOption.content}</span>
                        </div>
                      )}
                      {correctOption && (
                        <div className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                          <span className="text-green-600 dark:text-green-400">Correct answer: {correctOption.content}</span>
                        </div>
                      )}
                      {!wasAnswered && (
                        <div className="text-sm text-yellow-600 dark:text-yellow-400 italic">
                          You didn't answer this question
                        </div>
                      )}
                    </div>

                    {/* Explanation */}
                    {question.explanation && (
                      <div className="mt-3 ml-11 p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
                        <strong>Explanation:</strong> {question.explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
};

export default QuizResults;

