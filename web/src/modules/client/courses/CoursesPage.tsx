"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Search, Star, Clock, Users, BookOpen, Loader2 } from "lucide-react";
import Image from "next/image";
import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";

interface Category {
    id: string | number;
    name: string;
    slug: string;
}

interface Course {
    id: string | number;
    title: string;
    slug: string;
    description: string | null;
    thumbnail_url: string | null;
    difficulty_level: "EASY" | "MEDIUM" | "HARD";
    price: number;
    is_published: boolean;
    category_id: string;
    creator?: {
        full_name: string;
        username: string;
    };
    category?: {
        name: string;
    };
}

const CoursesPage = () => {
    const t = useTranslations("coursesPage");
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>("allCategories");

    const [courses, setCourses] = useState<Course[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [coursesRes, categoriesRes] = await Promise.all([
                    apiClient.get(`${apiRoutes.COURSES.GET_ALL}?page=1&limit=100`),
                    apiClient.get(apiRoutes.CATEGORIES.GET_ALL)
                ]);

                // Courses response parsing (it might be { data: { data: [], meta: {} } } or { data: [] })
                const coursesData = coursesRes.data?.data?.data || coursesRes.data?.data || coursesRes.data || [];
                const allCourses = Array.isArray(coursesData) ? coursesData : [];
                setCourses(allCourses.filter((c: Course) => c.is_published));

                // Categories response parsing
                const categoryData = categoriesRes.data?.data?.data || categoriesRes.data?.data || categoriesRes.data || [];
                const allCategories = Array.isArray(categoryData) ? categoryData : [];
                setCategories(allCategories);
            } catch (error) {
                console.error("Failed to fetch courses data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const filteredCourses = courses.filter((course) => {
        const matchesSearch =
            course.title.toLowerCase().includes(search.toLowerCase()) ||
            (course.description || "").toLowerCase().includes(search.toLowerCase());

        const matchesCategory = activeCategory === "allCategories" || course.category?.name === activeCategory;

        return matchesSearch && matchesCategory;
    });

    const getLevelKey = (level: string) => {
        switch (level) {
            case "EASY": return "beginner";
            case "MEDIUM": return "intermediate";
            case "HARD": return "advanced";
            default: return "beginner";
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case "EASY": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "MEDIUM": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "HARD": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        placeholder={t("searchPlaceholder")}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-10"
                    />
                </div>
                <div className="flex gap-2 flex-wrap">
                    <Button
                        variant={activeCategory === "allCategories" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setActiveCategory("allCategories")}
                        className="text-xs"
                    >
                        {t("allCategories")}
                    </Button>
                    {categories.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={activeCategory === cat.name ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(cat.name)}
                            className="text-xs"
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Loading state */}
            {loading ? (
                <div className="flex justify-center items-center py-20">
                    <Loader2 className="animate-spin text-primary" size={32} />
                </div>
            ) : (
                /* Course Grid */
                filteredCourses.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground text-lg">{t("noResults")}</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {filteredCourses.map((course) => (
                            <Card key={course.id} className="overflow-hidden p-0 h-full flex flex-col gap-0 hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                                <CardHeader className="p-0 flex-shrink-0 gap-0">
                                    <div className="relative w-full h-44 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <Image
                                            src={course.thumbnail_url || "/logo.jpg"}
                                            alt={course.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                        />
                                        <Badge className={`absolute top-2 right-2 text-xs ${getLevelColor(course.difficulty_level)}`}>
                                            {t(getLevelKey(course.difficulty_level))}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-4 flex-1 flex flex-col">
                                    <h3 className="font-semibold text-sm mb-1 line-clamp-2">{course.title}</h3>
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description || "No description provided."}</p>

                                    <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                        <span className="flex items-center gap-1">
                                            <BookOpen className="w-3 h-3" />
                                            {course.category?.name || "General"}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex items-center gap-1">
                                            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                            <span className="text-xs font-medium">5.0</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                        <span className="text-xs text-muted-foreground">{course.creator?.full_name || course.creator?.username || "Admin"}</span>
                                        <Badge variant="secondary" className="text-xs">{course.price === 0 ? t("free") : `$${course.price}`}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )
            )}

            {/* Coming Soon */}
            <div className="text-center mt-12 py-8 border-t">
                <p className="text-muted-foreground">{t("comingSoon")}</p>
            </div>
        </div>
    );
};

export default CoursesPage;
