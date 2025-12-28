"use client";

import React from "react";
import { QuizResult } from "../types/quiz.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/common/components/ui/alert";
import { CheckCircle2, Trophy, Clock, Target, RotateCcw, Eye, Star, Share2, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/lib/appRoutes";

interface QuizResultsProps {
  result: QuizResult;
  onRetakeQuiz: () => void;
  onViewAnswers: () => void;
}

const QuizResults: React.FC<QuizResultsProps> = ({
  result,
  onRetakeQuiz,
  onViewAnswers,
}) => {
  const router = useRouter();

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

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8 animate-in fade-in zoom-in-95 duration-700">
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
              { icon: Target, label: "Efficiency", value: `${result.percentage}%`, color: "text-violet-500", bg: "bg-violet-500/10" },
              { icon: Clock, label: "Time Taken", value: formatTime(result.time_spent), color: "text-blue-500", bg: "bg-blue-500/10" },
              { icon: Star, label: "Status", value: result.passed ? "PASSED" : "FAILED", color: result.passed ? "text-primary" : "text-destructive", bg: result.passed ? "bg-primary/10" : "bg-destructive/10" }
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

          {/* Feedback & Ranking Section */}
          <div className="space-y-4">
            {result.rank && (
              <div className="p-5 rounded-2xl bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-yellow-500 flex items-center justify-center text-white shadow-lg">
                  <Trophy className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-black text-yellow-700 dark:text-yellow-400">Global Rank: #{result.rank}</h4>
                  <p className="text-sm text-yellow-800/70 dark:text-yellow-400/70">Outstanding performance in the community!</p>
                </div>
              </div>
            )}

            {result.feedback && (
              <div className="p-5 rounded-2xl bg-muted/50 border border-border flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-500">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold">Master's Feedback</h4>
                  <p className="text-sm text-muted-foreground">{result.feedback}</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4">
            <Button onClick={onRetakeQuiz} variant="outline" size="lg" className="h-14 rounded-2xl font-bold border-2 hover:bg-muted group">
              <RotateCcw className="w-5 h-5 mr-3 group-hover:rotate-180 transition-transform duration-500" />
              Try Again
            </Button>
            <Button onClick={onViewAnswers} variant="outline" size="lg" className="h-14 rounded-2xl font-bold border-2 hover:bg-muted">
              <Eye className="w-5 h-5 mr-3" />
              Review
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
    </div>
  );
};

export default QuizResults;
