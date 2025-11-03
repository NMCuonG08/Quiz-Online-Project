"use client";

import React from "react";
import { QuizResult } from "../types/quiz.types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/common/components/ui/alert";
import { CheckCircle2, Trophy, Clock, Target, RotateCcw, Eye } from "lucide-react";

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
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return "Excellent work! 🎉";
    if (percentage >= 80) return "Great job! 👏";
    if (percentage >= 70) return "Good work! 👍";
    if (percentage >= 60) return "Not bad! Keep practicing! 💪";
    return "Keep studying! You can do better! 📚";
  };

  return (
    <div className="w-full mx-auto p-4">
      <Card className="w-full">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Quiz Completed!</CardTitle>
          <CardDescription className="text-lg">{getScoreMessage(result.percentage)}</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Score Card */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg p-6 text-center">
            <div
              className={`text-4xl font-bold ${getScoreColor(
                result.percentage
              )} mb-2`}
            >
              {result.percentage}%
            </div>
            <div className="text-lg text-foreground mb-4">
              {result.correct_answers} out of {result.total_questions} correct
            </div>
            <div className="text-sm text-muted-foreground">
              Total Score: {result.total_score} points
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {result.correct_answers}
                </div>
                <div className="text-sm text-muted-foreground">Correct Answers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {result.total_questions - result.correct_answers}
                </div>
                <div className="text-sm text-muted-foreground">Incorrect Answers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {formatTime(result.time_spent)}
                </div>
                <div className="text-sm text-muted-foreground">Time Spent</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-foreground mb-1">
                  {result.passed ? "✅" : "❌"}
                </div>
                <div className="text-sm text-muted-foreground">Status</div>
              </CardContent>
            </Card>
          </div>

          {/* Rank */}
          {result.rank && (
            <Alert>
              <Trophy className="h-4 w-4" />
              <AlertTitle>Congratulations!</AlertTitle>
              <AlertDescription>
                You ranked #{result.rank} among all participants!
              </AlertDescription>
            </Alert>
          )}

          {/* Feedback */}
          {result.feedback && (
            <Alert>
              <Target className="h-4 w-4" />
              <AlertTitle>Feedback</AlertTitle>
              <AlertDescription>{result.feedback}</AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button onClick={onRetakeQuiz} className="flex-1" variant="default">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Quiz
            </Button>
            <Button onClick={onViewAnswers} className="flex-1" variant="outline">
              <Eye className="w-4 h-4 mr-2" />
              Review Answers
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default QuizResults;
