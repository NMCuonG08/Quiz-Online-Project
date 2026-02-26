"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Search, Star, Clock, Users, BookOpen } from "lucide-react";
import Image from "next/image";

interface Course {
    id: number;
    title: string;
    description: string;
    thumbnail: string;
    instructor: string;
    rating: number;
    enrolled: number;
    lessons: number;
    hours: number;
    level: "beginner" | "intermediate" | "advanced";
    category: string;
    price: string;
    featured: boolean;
}

const mockCourses: Course[] = [
    {
        id: 1,
        title: "Introduction to JavaScript",
        description: "Learn the fundamentals of JavaScript programming from scratch.",
        thumbnail: "/categories/cate1.png",
        instructor: "Nguyen Van A",
        rating: 4.8,
        enrolled: 1250,
        lessons: 42,
        hours: 28,
        level: "beginner",
        category: "programming",
        price: "free",
        featured: true,
    },
    {
        id: 2,
        title: "Advanced React Patterns",
        description: "Master advanced React patterns and hooks for production apps.",
        thumbnail: "/categories/cate2.png",
        instructor: "Tran Thi B",
        rating: 4.9,
        enrolled: 890,
        lessons: 35,
        hours: 22,
        level: "advanced",
        category: "programming",
        price: "free",
        featured: true,
    },
    {
        id: 3,
        title: "UI/UX Design Fundamentals",
        description: "Create beautiful and user-friendly interfaces that users love.",
        thumbnail: "/categories/cate3.png",
        instructor: "Le Van C",
        rating: 4.7,
        enrolled: 2100,
        lessons: 28,
        hours: 18,
        level: "beginner",
        category: "design",
        price: "free",
        featured: false,
    },
    {
        id: 4,
        title: "English for Business",
        description: "Improve your business English communication skills.",
        thumbnail: "/categories/cate4.png",
        instructor: "Pham D",
        rating: 4.6,
        enrolled: 3400,
        lessons: 50,
        hours: 35,
        level: "intermediate",
        category: "language",
        price: "free",
        featured: true,
    },
    {
        id: 5,
        title: "Physics: Mechanics",
        description: "Understand the principles of classical mechanics and motion.",
        thumbnail: "/categories/cate5.png",
        instructor: "Hoang E",
        rating: 4.5,
        enrolled: 780,
        lessons: 38,
        hours: 25,
        level: "intermediate",
        category: "science",
        price: "free",
        featured: false,
    },
    {
        id: 6,
        title: "Calculus I",
        description: "Master limits, derivatives, and integrations with practice problems.",
        thumbnail: "/categories/cate6.png",
        instructor: "Vo F",
        rating: 4.4,
        enrolled: 1650,
        lessons: 45,
        hours: 30,
        level: "beginner",
        category: "math",
        price: "free",
        featured: false,
    },
    {
        id: 7,
        title: "Python Data Science",
        description: "Learn data analysis, visualization, and machine learning with Python.",
        thumbnail: "/categories/cate7.png",
        instructor: "Nguyen G",
        rating: 4.8,
        enrolled: 2800,
        lessons: 60,
        hours: 40,
        level: "intermediate",
        category: "programming",
        price: "free",
        featured: true,
    },
    {
        id: 8,
        title: "Figma Masterclass",
        description: "From beginner to pro: learn Figma for modern design workflows.",
        thumbnail: "/categories/cate8.png",
        instructor: "Tran H",
        rating: 4.7,
        enrolled: 1900,
        lessons: 32,
        hours: 20,
        level: "beginner",
        category: "design",
        price: "free",
        featured: false,
    },
];

const CATEGORIES = ["allCategories", "programming", "design", "language", "science", "math"] as const;

const CoursesPage = () => {
    const t = useTranslations("coursesPage");
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("allCategories");

    const filteredCourses = mockCourses.filter((course) => {
        const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
            course.description.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = activeCategory === "allCategories" || course.category === activeCategory;
        return matchesSearch && matchesCategory;
    });

    const getLevelKey = (level: string) => {
        switch (level) {
            case "beginner": return "beginner";
            case "intermediate": return "intermediate";
            case "advanced": return "advanced";
            default: return "beginner";
        }
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case "beginner": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
            case "intermediate": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
            case "advanced": return "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200";
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
                    {CATEGORIES.map((cat) => (
                        <Button
                            key={cat}
                            variant={activeCategory === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setActiveCategory(cat)}
                            className="text-xs"
                        >
                            {t(cat)}
                        </Button>
                    ))}
                </div>
            </div>

            {/* Course Grid */}
            {filteredCourses.length === 0 ? (
                <div className="text-center py-16">
                    <p className="text-muted-foreground text-lg">{t("noResults")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredCourses.map((course) => (
                        <Card key={course.id} className="overflow-hidden p-0 h-full flex flex-col gap-0 hover:shadow-lg transition-shadow duration-200 cursor-pointer group">
                            <CardHeader className="p-0 flex-shrink-0 gap-0">
                                <div className="relative w-full h-44 overflow-hidden">
                                    <Image
                                        src={course.thumbnail}
                                        alt={course.title}
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                                    />
                                    {course.featured && (
                                        <Badge className="absolute top-2 left-2 bg-yellow-500 text-black text-xs">
                                            ★ {t("featuredCourses")}
                                        </Badge>
                                    )}
                                    <Badge className={`absolute top-2 right-2 text-xs ${getLevelColor(course.level)}`}>
                                        {t(getLevelKey(course.level))}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 flex-1 flex flex-col">
                                <h3 className="font-semibold text-sm mb-1 line-clamp-2">{course.title}</h3>
                                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{course.description}</p>

                                <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
                                    <span className="flex items-center gap-1">
                                        <BookOpen className="w-3 h-3" />
                                        {t("lessons", { count: course.lessons })}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {t("hours", { count: course.hours })}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-auto">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                        <span className="text-xs font-medium">{course.rating}</span>
                                        <span className="text-xs text-muted-foreground">
                                            · <Users className="w-3 h-3 inline" /> {t("enrolled", { count: course.enrolled })}
                                        </span>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                    <span className="text-xs text-muted-foreground">{course.instructor}</span>
                                    <Badge variant="secondary" className="text-xs">{t("free")}</Badge>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Coming Soon */}
            <div className="text-center mt-12 py-8 border-t">
                <p className="text-muted-foreground">{t("comingSoon")}</p>
            </div>
        </div>
    );
};

export default CoursesPage;
