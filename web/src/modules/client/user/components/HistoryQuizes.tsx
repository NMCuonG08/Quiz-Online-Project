"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Progress } from "@/common/components/ui/progress";
import { Badge } from "@/common/components/ui/badge";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/lib/appRoutes";
import {
  QuizService,
  QuizAttemptItem,
} from "@/modules/client/do-quiz/services/quiz.service";
import { Skeleton } from "@/common/components/ui/skeleton";
import {
  PlayCircle,
  History,
  CheckCircle2,
  XCircle,
  Clock,
  Trophy,
  RotateCcw,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const HistoryQuizes = () => {
  const router = useRouter();
  const [attempts, setAttempts] = useState<QuizAttemptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchAttempts = async () => {
      try {
        const response = await QuizService.getAllUserAttempts(page, 10);
        if (response.success && Array.isArray(response.data)) {
          setAttempts(response.data);
          setHasMore(
            (response.meta?.page || 1) < (response.meta?.totalPages || 1)
          );
          setTotal(response.meta?.total || 0);
        } else {
          setAttempts([]);
        }
      } catch (error) {
        console.error("Failed to fetch quiz attempts:", error);
        setAttempts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAttempts();
  }, [page]);

  const handleQuizAction = (quizSlug: string, status: string) => {
    if (status === "IN_PROGRESS") {
      router.push(`${APP_ROUTES.QUIZ.LIST}/${quizSlug}/do-quiz`);
    } else {
      router.push(`${APP_ROUTES.QUIZ.LIST}/${quizSlug}`);
    }
  };

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (loading) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quiz History</h2>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-4">
              <div className="flex gap-4">
                <Skeleton className="w-20 h-20 rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>
    );
  }

  if (attempts.length === 0) {
    return (
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Quiz History</h2>
        </div>
        <Card className="p-6 text-center border-dashed">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <History className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">No quiz history yet</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Start a quiz to see your history here!
              </p>
            </div>
            <Button onClick={() => router.push(APP_ROUTES.QUIZ.LIST)}>
              Browse Quizzes
            </Button>
          </div>
        </Card>
      </section>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Quiz History{" "}
          <span className="text-sm font-normal text-muted-foreground">
            ({total} attempts)
          </span>
        </h2>
      </div>

      <div className="space-y-3">
        {attempts.map((attempt) => {
          const isInProgress = attempt.status === "IN_PROGRESS";
          const progress = isInProgress
            ? attempt.total_questions === 0
              ? 0
              : Math.round(
                (attempt.answered_questions / attempt.total_questions) * 100
              )
            : attempt.percentage;

          return (
            <Card
              key={attempt.id}
              className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => handleQuizAction(attempt.quiz_slug, attempt.status)}
            >
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                  <Image
                    src={attempt.quiz_thumbnail || "/home/quiz.jpg"}
                    alt={attempt.quiz_title}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                  {/* Status overlay for in-progress */}
                  {isInProgress && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <PlayCircle className="w-8 h-8 text-primary" />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <CardTitle className="text-base font-semibold truncate">
                        {attempt.quiz_title}
                      </CardTitle>
                      {attempt.category_name && (
                        <CardDescription className="text-xs mt-0.5">
                          {attempt.category_name}
                        </CardDescription>
                      )}
                    </div>
                    <Badge
                      variant={
                        isInProgress
                          ? "secondary"
                          : attempt.passed
                            ? "default"
                            : "destructive"
                      }
                      className="shrink-0"
                    >
                      {isInProgress ? (
                        <>
                          <PlayCircle className="w-3 h-3 mr-1" />
                          In Progress
                        </>
                      ) : attempt.passed ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          Passed
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 mr-1" />
                          Failed
                        </>
                      )}
                    </Badge>
                  </div>

                  {/* Progress/Stats */}
                  {isInProgress ? (
                    <div className="space-y-1 mt-2">
                      <Progress value={progress} className="h-1.5" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {attempt.answered_questions}/{attempt.total_questions}{" "}
                          answered
                        </span>
                        <span>{progress}%</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Trophy className="w-3.5 h-3.5" />
                        <span className="font-medium text-foreground">
                          {Math.round(attempt.percentage)}%
                        </span>
                        <span>
                          ({attempt.correct_answers}/{attempt.total_questions})
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{formatTime(attempt.time_taken)}</span>
                      </div>
                      {attempt.completed_at && (
                        <span className="hidden sm:inline">
                          {formatDistanceToNow(new Date(attempt.completed_at), {
                            addSuffix: true,
                          })}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button
                      size="sm"
                      variant={isInProgress ? "default" : "outline"}
                      className="h-7 text-xs gap-1.5"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuizAction(attempt.quiz_slug, attempt.status);
                      }}
                    >
                      {isInProgress ? (
                        <>
                          <PlayCircle className="w-3 h-3" />
                          Continue
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-3 h-3" />
                          Retake
                        </>
                      )}
                    </Button>
                    {attempt.attempt_number > 1 && (
                      <span className="text-xs text-muted-foreground">
                        Attempt #{attempt.attempt_number}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => p + 1)}
          >
            Load More
          </Button>
        </div>
      )}
    </section>
  );
};

export default HistoryQuizes;
