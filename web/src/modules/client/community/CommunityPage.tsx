"use client";

import React, { useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Badge } from "@/common/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/common/components/ui/tabs";
import {
    MessageSquare,
    Trophy,
    Calendar,
    Users,
    Eye,
    ThumbsUp,
    Clock,
    Send,
} from "lucide-react";

interface Discussion {
    id: number;
    title: string;
    author: string;
    avatar: string;
    replies: number;
    views: number;
    timeAgo: number;
    timeUnit: "hours" | "days";
    tags: string[];
}

interface Contributor {
    id: number;
    name: string;
    avatar: string;
    points: number;
    quizzes: number;
    rank: number;
}

interface Event {
    id: number;
    title: string;
    date: string;
    participants: number;
    type: string;
}

const mockDiscussions: Discussion[] = [
    {
        id: 1, title: "Best resources for learning React Hooks?",
        author: "Nguyen A", avatar: "🧑‍💻", replies: 24, views: 380,
        timeAgo: 2, timeUnit: "hours", tags: ["React", "Hooks"],
    },
    {
        id: 2, title: "How to prepare for the IELTS exam?",
        author: "Tran B", avatar: "👩‍🎓", replies: 18, views: 520,
        timeAgo: 5, timeUnit: "hours", tags: ["IELTS", "English"],
    },
    {
        id: 3, title: "Tips for solving calculus problems faster",
        author: "Le C", avatar: "📐", replies: 12, views: 290,
        timeAgo: 1, timeUnit: "days", tags: ["Math", "Calculus"],
    },
    {
        id: 4, title: "Share your favorite quiz strategies!",
        author: "Pham D", avatar: "🎯", replies: 35, views: 780,
        timeAgo: 2, timeUnit: "days", tags: ["Tips", "Strategy"],
    },
    {
        id: 5, title: "How physics quizzes helped me understand concepts",
        author: "Hoang E", avatar: "⚛️", replies: 9, views: 210,
        timeAgo: 3, timeUnit: "days", tags: ["Physics", "Learning"],
    },
];

const mockContributors: Contributor[] = [
    { id: 1, name: "Nguyen Van A", avatar: "🏆", points: 12580, quizzes: 156, rank: 1 },
    { id: 2, name: "Tran Thi B", avatar: "🥈", points: 10340, quizzes: 132, rank: 2 },
    { id: 3, name: "Le Van C", avatar: "🥉", points: 8920, quizzes: 108, rank: 3 },
    { id: 4, name: "Pham D", avatar: "⭐", points: 7650, quizzes: 94, rank: 4 },
    { id: 5, name: "Hoang E", avatar: "⭐", points: 6100, quizzes: 78, rank: 5 },
];

const mockEvents: Event[] = [
    { id: 1, title: "React Quiz Challenge 2026", date: "Mar 5, 2026", participants: 245, type: "online" },
    { id: 2, title: "English Vocabulary Sprint", date: "Mar 10, 2026", participants: 180, type: "online" },
    { id: 3, title: "Math Olympiad Practice", date: "Mar 15, 2026", participants: 92, type: "online" },
];

const CommunityPage = () => {
    const t = useTranslations("communityPage");
    const [postContent, setPostContent] = useState("");

    const stats = [
        { label: t("totalMembers"), value: "12,500+", icon: Users },
        { label: t("activeToday"), value: "1,240", icon: ThumbsUp },
        { label: t("totalPosts"), value: "8,650", icon: MessageSquare },
        { label: t("quizzesCompleted"), value: "45,000+", icon: Trophy },
    ];

    return (
        <div className="w-full max-w-7xl mx-auto px-4 py-8">
            {/* Page Header */}
            <div className="text-center mb-10">
                <h1 className="text-3xl sm:text-4xl font-bold mb-3">{t("title")}</h1>
                <p className="text-muted-foreground max-w-2xl mx-auto">{t("subtitle")}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
                {stats.map((stat) => (
                    <Card key={stat.label} className="text-center p-4">
                        <stat.icon className="w-6 h-6 mx-auto mb-2 text-primary" />
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-muted-foreground">{stat.label}</div>
                    </Card>
                ))}
            </div>

            {/* Tabs */}
            <Tabs defaultValue="discussions">
                <TabsList className="w-full justify-start mb-6">
                    <TabsTrigger value="discussions" className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        {t("discussions")}
                    </TabsTrigger>
                    <TabsTrigger value="leaderboard" className="flex items-center gap-2">
                        <Trophy className="w-4 h-4" />
                        {t("leaderboard")}
                    </TabsTrigger>
                    <TabsTrigger value="events" className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        {t("events")}
                    </TabsTrigger>
                </TabsList>

                {/* Discussions Tab */}
                <TabsContent value="discussions">
                    {/* Post Input */}
                    <Card className="mb-6 p-4">
                        <div className="flex gap-3">
                            <Input
                                className="flex-1"
                                placeholder={t("writePost")}
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                            />
                            <Button size="sm">
                                <Send className="w-4 h-4 mr-2" />
                                {t("post")}
                            </Button>
                        </div>
                    </Card>

                    <h2 className="text-xl font-semibold mb-4">{t("recentDiscussions")}</h2>
                    <div className="space-y-3">
                        {mockDiscussions.map((disc) => (
                            <Card key={disc.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer">
                                <div className="flex items-start gap-3">
                                    <div className="text-2xl flex-shrink-0">{disc.avatar}</div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-medium text-sm mb-1">{disc.title}</h3>
                                        <div className="flex items-center gap-2 flex-wrap mb-2">
                                            {disc.tags.map((tag) => (
                                                <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                            <span>{disc.author}</span>
                                            <span className="flex items-center gap-1">
                                                <MessageSquare className="w-3 h-3" />
                                                {t("replies", { count: disc.replies })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Eye className="w-3 h-3" />
                                                {t("views", { count: disc.views })}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {disc.timeUnit === "hours"
                                                    ? t("hoursAgo", { count: disc.timeAgo })
                                                    : t("daysAgo", { count: disc.timeAgo })}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard">
                    <h2 className="text-xl font-semibold mb-4">{t("topContributors")}</h2>
                    <div className="space-y-3">
                        {mockContributors.map((user) => (
                            <Card key={user.id} className="p-4">
                                <div className="flex items-center gap-4">
                                    <div className="text-3xl w-12 text-center">{user.avatar}</div>
                                    <div className="flex-1">
                                        <div className="font-medium">{user.name}</div>
                                        <div className="text-xs text-muted-foreground">
                                            {t("points", { count: user.points.toLocaleString() })} · {t("quizzes", { count: user.quizzes })}
                                        </div>
                                    </div>
                                    <Badge variant={user.rank <= 3 ? "default" : "outline"} className="text-sm">
                                        #{user.rank}
                                    </Badge>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events">
                    <h2 className="text-xl font-semibold mb-4">{t("upcomingEvents")}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {mockEvents.map((event) => (
                            <Card key={event.id} className="p-0 overflow-hidden">
                                <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6">
                                    <CardHeader className="p-0 mb-3">
                                        <CardTitle className="text-base">{event.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-0 space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            {event.date}
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Users className="w-4 h-4" />
                                            {t("participants", { count: event.participants })}
                                        </div>
                                        <Badge variant="secondary" className="text-xs">{t("online")}</Badge>
                                        <div className="pt-2">
                                            <Button size="sm" className="w-full">{t("joinEvent")}</Button>
                                        </div>
                                    </CardContent>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CommunityPage;
