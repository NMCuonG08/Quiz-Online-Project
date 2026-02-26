"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { LocalizedLink } from "@/common/components/ui";
import { Button } from "@/common/components/ui/button";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { ArrowLeft, Star, Clock, Loader2 } from "lucide-react";
import { useCategory } from "../hooks/useCategory";
import { ClientQuizService } from "../services/client.quiz.service";
import type { QuizCardProps, PaginationInfo } from "../types/quiz.types";
import { useTranslations } from "next-intl";
import { formatTimeAgo } from "@/lib/time-utils";

const CategoryDetailPage = () => {
    const params = useParams();
    const slug = params?.slug as string;
    const t = useTranslations("categoryDetail");

    const { currentCategory, loading: categoryLoading, getCategoryBySlug } = useCategory();

    const [quizzes, setQuizzes] = useState<QuizCardProps[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo | null>(null);
    const [quizzesLoading, setQuizzesLoading] = useState(false);
    const [quizzesError, setQuizzesError] = useState<string | null>(null);
    const [page, setPage] = useState(1);

    // Fetch category info by slug
    useEffect(() => {
        if (slug) {
            getCategoryBySlug(slug);
        }
    }, [slug, getCategoryBySlug]);

    // Fetch quizzes when category is loaded
    const fetchQuizzes = useCallback(
        async (pageNum: number, append = false) => {
            if (!currentCategory?.id) return;
            setQuizzesLoading(true);
            setQuizzesError(null);
            try {
                const response = await ClientQuizService.getQuizzesByCategory(
                    String(currentCategory.id),
                    { page: pageNum, limit: 12 }
                );
                if (response.data) {
                    setQuizzes((prev) =>
                        append ? [...prev, ...response.data.items] : response.data.items
                    );
                    setPagination(response.data.pagination);
                }
            } catch {
                setQuizzesError("Failed to load quizzes");
            } finally {
                setQuizzesLoading(false);
            }
        },
        [currentCategory?.id]
    );

    useEffect(() => {
        if (currentCategory?.id) {
            setPage(1);
            fetchQuizzes(1);
        }
    }, [currentCategory?.id, fetchQuizzes]);

    const handleLoadMore = () => {
        const nextPage = page + 1;
        setPage(nextPage);
        fetchQuizzes(nextPage, true);
    };

    // Loading state
    if (categoryLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="text-muted-foreground">{t("loadingCategory")}</p>
            </div>
        );
    }

    // Category not found
    if (!categoryLoading && !currentCategory) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center gap-4">
                <h2 className="text-2xl font-bold">{t("categoryNotFound")}</h2>
                <p className="text-muted-foreground">{t("categoryNotFoundDesc")}</p>
                <LocalizedLink href="/category">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        {t("backToCategories")}
                    </Button>
                </LocalizedLink>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <LocalizedLink
                    href="/category"
                    className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
                >
                    <ArrowLeft className="w-4 h-4" />
                    {t("backToCategories")}
                </LocalizedLink>

                <div className="flex items-center gap-4">
                    {currentCategory?.icon_url && (
                        <div className="relative w-16 h-16 rounded-full overflow-hidden ring-2 ring-primary/20 bg-background flex-shrink-0">
                            <Image
                                src={currentCategory.icon_url}
                                alt={currentCategory.name}
                                fill
                                className="object-cover"
                                sizes="64px"
                            />
                        </div>
                    )}
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">
                            {t("quizzesInCategory", { name: currentCategory?.name || "" })}
                        </h1>
                        {currentCategory?.description && (
                            <p className="text-muted-foreground mt-1">
                                {currentCategory.description}
                            </p>
                        )}
                        {pagination && (
                            <p className="text-sm text-muted-foreground mt-1">
                                {t("totalQuizzes", { count: pagination.totalItems })}
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Quiz Grid */}
            {quizzesError && (
                <div className="text-center py-12">
                    <p className="text-red-500 mb-4">{t("error")}</p>
                    <Button
                        variant="outline"
                        onClick={() => fetchQuizzes(1)}
                    >
                        {t("retry")}
                    </Button>
                </div>
            )}

            {!quizzesError && quizzes.length === 0 && !quizzesLoading && (
                <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg">{t("noQuizzes")}</p>
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {quizzes.map((quiz) => (
                    <QuizGridCard key={quiz.id} quiz={quiz} />
                ))}
                {quizzesLoading &&
                    Array.from({ length: 4 }).map((_, i) => (
                        <QuizGridSkeleton key={`skeleton-${i}`} />
                    ))}
            </div>

            {/* Load More */}
            {pagination?.hasNext && !quizzesLoading && (
                <div className="text-center mt-8">
                    <Button variant="outline" onClick={handleLoadMore}>
                        {t("loadMore")}
                    </Button>
                </div>
            )}
        </div>
    );
};

// Quiz Card for grid layout
const QuizGridCard: React.FC<{ quiz: QuizCardProps }> = ({ quiz }) => {
    const [imageError, setImageError] = useState(false);
    const t = useTranslations("categoryDetail");

    const getDifficultyColor = (difficulty?: string) => {
        switch (difficulty) {
            case "EASY":
                return "bg-green-500";
            case "HARD":
                return "bg-red-500";
            case "AI GENERATED":
                return "bg-blue-500";
            default:
                return "bg-gray-500";
        }
    };

    const timeAgo = quiz.created_at ? formatTimeAgo(quiz.created_at) : null;

    const cardContent = (
        <Card className="overflow-hidden cursor-pointer p-0 h-full flex flex-col gap-0 hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0 flex-shrink-0 gap-0">
                <div className="relative w-full h-44">
                    {imageError || !quiz.thumbnail_url ? (
                        <Image
                            src="/404not-found.jpg"
                            alt="Not Found"
                            width={400}
                            height={250}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <Image
                            src={quiz.thumbnail_url}
                            alt={quiz.title}
                            width={400}
                            height={250}
                            className="w-full h-full object-cover"
                            onError={() => setImageError(true)}
                        />
                    )}

                    {quiz.category_name && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-semibold text-white bg-black/70 backdrop-blur-sm">
                            {quiz.category_name}
                        </div>
                    )}

                    {(quiz.difficulty || quiz.difficulty_level) && (
                        <div
                            className={`absolute bottom-2 left-2 px-1.5 py-0.5 rounded text-xs font-semibold text-white border border-black ${getDifficultyColor(
                                quiz.difficulty || quiz.difficulty_level
                            )}`}
                        >
                            {quiz.difficulty || quiz.difficulty_level}
                        </div>
                    )}

                    {quiz.quiz_type && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-semibold text-white bg-purple-500/80 backdrop-blur-sm">
                            {quiz.quiz_type}
                        </div>
                    )}
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-1 flex flex-col">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                    {quiz.title}
                </h3>

                {timeAgo && (
                    <div className="flex items-center mb-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{timeAgo}</span>
                    </div>
                )}

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">
                            {quiz.average_rating?.toFixed(1)} ({quiz.total_ratings})
                        </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate ml-2">
                        {t("by", { name: quiz.creator_name })}
                    </span>
                </div>
            </CardContent>
        </Card>
    );

    return quiz.slug ? (
        <LocalizedLink href={`/quiz/${quiz.slug}`}>{cardContent}</LocalizedLink>
    ) : (
        cardContent
    );
};

// Skeleton loading card
const QuizGridSkeleton = () => (
    <Card className="overflow-hidden p-0 h-full flex flex-col gap-0">
        <CardHeader className="p-0 flex-shrink-0 gap-0">
            <div className="w-full h-44 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 dark:from-gray-600 dark:via-gray-500 dark:to-gray-600 animate-pulse" />
        </CardHeader>
        <CardContent className="p-4 flex-1 flex flex-col">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mb-2" />
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse w-3/4 mb-3" />
            <div className="flex items-center mb-2">
                <div className="w-3 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse mr-1" />
                <div className="w-16 h-3 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
            <div className="flex items-center justify-between mt-auto">
                <div className="w-20 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
                <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded animate-pulse" />
            </div>
        </CardContent>
    </Card>
);

export default CategoryDetailPage;
