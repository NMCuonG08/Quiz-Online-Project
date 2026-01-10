"use client";

import React, { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardTitle,
} from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Badge } from "@/common/components/ui/badge";
import Image from "next/image";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { APP_ROUTES } from "@/lib/appRoutes";
import {
    QuizService,
    QuizHistoryItem,
} from "@/modules/client/do-quiz/services/quiz.service";
import { Skeleton } from "@/common/components/ui/skeleton";
import {
    CheckCircle2,
    XCircle,
    Clock,
    Trophy,
    RotateCcw,
    ChevronRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const CompletedQuizzes = () => {
    const router = useLocalizedRouter();
    const [quizHistory, setQuizHistory] = useState<QuizHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);

    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const response = await QuizService.getUserQuizHistory(page, 5);
                if (response.success && Array.isArray(response.data)) {
                    setQuizHistory(response.data);
                    setHasMore((response.meta?.page || 1) < (response.meta?.totalPages || 1));
                } else {
                    setQuizHistory([]);
                }
            } catch (error) {
                console.error("Failed to fetch quiz history:", error);
                setQuizHistory([]);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [page]);

    const handleRetakeQuiz = (quizSlug: string) => {
        router.push(`${APP_ROUTES.QUIZ.LIST}/${quizSlug}/do-quiz`);
    };

    const handleViewQuiz = (quizSlug: string) => {
        router.push(`${APP_ROUTES.QUIZ.LIST}/${quizSlug}`);
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
                    <h2 className="text-lg font-semibold">Completed Quizzes</h2>
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

    if (quizHistory.length === 0) {
        return (
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold">Completed Quizzes</h2>
                </div>
                <Card className="p-6 text-center border-dashed">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                            <Trophy className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-lg">No completed quizzes yet</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Complete a quiz to see your history here!
                            </p>
                        </div>
                    </div>
                </Card>
            </section>
        );
    }

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Completed Quizzes</h2>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                    View All <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
            </div>

            <div className="space-y-3">
                {quizHistory.map((quiz) => (
                    <Card
                        key={quiz.id}
                        className="p-4 hover:shadow-md transition-shadow cursor-pointer group"
                        onClick={() => handleViewQuiz(quiz.quiz_slug)}
                    >
                        <div className="flex gap-4">
                            {/* Thumbnail */}
                            <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                                <Image
                                    src={quiz.quiz_thumbnail || "/home/quiz.jpg"}
                                    alt={quiz.quiz_title}
                                    fill
                                    className="object-cover"
                                    sizes="80px"
                                />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0">
                                        <CardTitle className="text-base font-semibold truncate">
                                            {quiz.quiz_title}
                                        </CardTitle>
                                        {quiz.category_name && (
                                            <CardDescription className="text-xs mt-0.5">
                                                {quiz.category_name}
                                            </CardDescription>
                                        )}
                                    </div>
                                    <Badge
                                        variant={quiz.passed ? "default" : "destructive"}
                                        className="shrink-0"
                                    >
                                        {quiz.passed ? (
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

                                {/* Stats */}
                                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <Trophy className="w-3.5 h-3.5" />
                                        <span className="font-medium text-foreground">
                                            {Math.round(quiz.percentage)}%
                                        </span>
                                        <span>
                                            ({quiz.correct_answers}/{quiz.total_questions})
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5" />
                                        <span>{formatTime(quiz.time_taken)}</span>
                                    </div>
                                    {quiz.completed_at && (
                                        <span className="hidden sm:inline">
                                            {formatDistanceToNow(new Date(quiz.completed_at), {
                                                addSuffix: true,
                                            })}
                                        </span>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-2 mt-3">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-xs gap-1.5"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRetakeQuiz(quiz.quiz_slug);
                                        }}
                                    >
                                        <RotateCcw className="w-3 h-3" />
                                        Retake
                                    </Button>
                                    {quiz.attempt_number > 1 && (
                                        <span className="text-xs text-muted-foreground">
                                            Attempt #{quiz.attempt_number}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
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

export default CompletedQuizzes;
