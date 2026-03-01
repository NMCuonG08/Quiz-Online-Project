"use client";

import React, { useState, useEffect } from "react";
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
    Heart,
} from "lucide-react";
import { CommunityService, Post } from "./services/community.service";
import { showSuccess, showError } from "@/lib/Notification";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";

const CommunityPage = () => {
    const t = useTranslations("communityPage");
    const [postContent, setPostContent] = useState("");
    const [posts, setPosts] = useState<Post[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchPosts = async () => {
        setLoading(true);
        try {
            const { data } = await CommunityService.getPosts(1, 20);
            setPosts(data || []);
        } catch (e) {
            console.error("Lỗi khi tải bài viết", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handleCreatePost = async () => {
        if (!postContent.trim()) return;
        try {
            const { data } = await CommunityService.createPost(postContent);
            if (data) {
                setPosts([data, ...posts]);
                setPostContent("");
                showSuccess("Đăng bài thành công!");
            }
        } catch (e) {
            showError("Có lỗi khi đăng bài viết.");
        }
    };

    const handleToggleLike = async (postId: string) => {
        try {
            const { data } = await CommunityService.toggleLike(postId);
            setPosts((prev) =>
                prev.map((p) => {
                    if (p.id === postId) {
                        return {
                            ...p,
                            _count: {
                                ...p._count,
                                likes: data.liked ? p._count.likes + 1 : Math.max(0, p._count.likes - 1)
                            }
                        };
                    }
                    return p;
                })
            );
        } catch (e) {
            console.log("Error toggling like", e);
        }
    };

    const stats = [
        { label: t("totalMembers"), value: "12,500+", icon: Users },
        { label: t("activeToday"), value: "1,240", icon: ThumbsUp },
        { label: t("totalPosts"), value: (posts?.length || 0).toString(), icon: MessageSquare },
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

                <TabsContent value="discussions">
                    <Card className="mb-6 p-4">
                        <div className="flex gap-3">
                            <Input
                                className="flex-1"
                                placeholder={"Bạn đang nghĩ gì?"}
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreatePost()}
                            />
                            <Button size="sm" onClick={handleCreatePost}>
                                <Send className="w-4 h-4 mr-2" />
                                Đăng bài
                            </Button>
                        </div>
                    </Card>

                    <h2 className="text-xl font-semibold mb-4">Các bài đăng mới nhất</h2>
                    <div className="space-y-4">
                        {loading && <p className="text-center text-muted-foreground">Đang tải...</p>}
                        {!loading && posts.length === 0 && <p className="text-center">Chưa có bài viết nào.</p>}
                        {posts.map((post) => (
                            <Card key={post.id} className="p-4 hover:shadow-md transition-shadow">
                                <div className="flex items-start gap-4">
                                    <Avatar className="size-10">
                                        <AvatarImage src={post.user?.avatar || ""} />
                                        <AvatarFallback>{post.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-semibold text-sm">{post.user?.full_name || post.user?.username}</h3>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <p className="text-sm mt-3 mb-4 whitespace-pre-wrap">{post.content}</p>

                                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-3 border-t">
                                            <button
                                                onClick={() => handleToggleLike(post.id)}
                                                className="flex items-center gap-1.5 hover:text-primary transition-colors"
                                            >
                                                <Heart className="w-4 h-4" />
                                                {post._count?.likes || 0} Thích
                                            </button>
                                            <button className="flex items-center gap-1.5 hover:text-primary transition-colors">
                                                <MessageSquare className="w-4 h-4" />
                                                {post._count?.comments || 0} Bình luận
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Leaderboard Tab */}
                <TabsContent value="leaderboard">
                    <div className="py-12 text-center text-muted-foreground border rounded-lg bg-muted/20">
                        <Trophy className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h2 className="text-xl font-semibold mb-2">Bảng xếp hạng</h2>
                        <p>Tính năng đang trong quá trình phát triển.</p>
                    </div>
                </TabsContent>

                {/* Events Tab */}
                <TabsContent value="events">
                    <div className="py-12 text-center text-muted-foreground border rounded-lg bg-muted/20">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                        <h2 className="text-xl font-semibold mb-2">Sự kiện Sắp tới</h2>
                        <p>Tính năng đang trong quá trình phát triển.</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default CommunityPage;
