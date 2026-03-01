"use client";
import React, { useEffect, useState } from "react";
import { FriendshipService, FriendUser, FriendshipRequest } from "../services/friendship.service";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { showSuccess, showError } from "@/lib/Notification";
import { UserMinus, Check, X, Users, Search, UserPlus } from "lucide-react";

export const FriendsList = () => {
    const [friends, setFriends] = useState<FriendUser[]>([]);
    const [requests, setRequests] = useState<FriendshipRequest[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<FriendUser[]>([]);
    const [searching, setSearching] = useState(false);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const [friendsRes, requestsRes] = await Promise.all([
                FriendshipService.getFriends(),
                FriendshipService.getPendingRequests()
            ]);
            if (friendsRes.data) setFriends(friendsRes.data);
            if (requestsRes.data) setRequests(requestsRes.data);
        } catch (error) {
            console.error("Lỗi khi tải danh sách bạn bè", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleAccept = async (id: string) => {
        try {
            await FriendshipService.acceptRequest(id);
            showSuccess("Đã kết bạn!");
            loadData();
        } catch {
            showError("Có lỗi xảy ra.");
        }
    };

    const handleRejectOrRemove = async (id: string, isFriend: boolean = false) => {
        if (isFriend && !confirm("Bạn có chắc muốn hủy kết bạn?")) return;
        try {
            await FriendshipService.removeFriendOrReject(id);
            showSuccess(isFriend ? "Đã hủy kết bạn" : "Đã từ chối lời mời");
            loadData();
        } catch {
            showError("Có lỗi xảy ra.");
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const { data } = await FriendshipService.searchUsers(searchQuery);
            if (data) setSearchResults(data);
        } catch {
            showError("Không thể tìm kiếm user.");
        } finally {
            setSearching(false);
        }
    };

    const handleSendRequest = async (userId: string) => {
        try {
            await FriendshipService.sendRequest(userId);
            showSuccess("Đã gửi lời mời kết bạn.");
            // Optionally remove from search results
            setSearchResults(prev => prev.filter(u => u.id !== userId));
        } catch (e: any) {
            showError(e.response?.data?.message || "Không thể gửi kết bạn (Có thể đã gửi rồi).");
        }
    };

    if (loading) return <div className="text-center py-8 text-muted-foreground">Đang tải...</div>;

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Tìm bạn bè
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-2 mb-4">
                        <Input
                            placeholder="Nhập tên hoặc username..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                        />
                        <Button onClick={handleSearch} disabled={searching}>
                            {searching ? "Đang tìm..." : "Tìm kiếm"}
                        </Button>
                    </div>

                    {searchResults.length > 0 && (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {searchResults.map((user) => (
                                <div key={user.id} className="flex flex-col items-center gap-3 p-4 border rounded-xl text-center bg-card shadow-sm">
                                    <Avatar className="w-16 h-16">
                                        <AvatarImage src={user.avatar} />
                                        <AvatarFallback className="text-xl">{user.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{user.full_name || user.username}</p>
                                        <p className="text-xs text-muted-foreground">@{user.username}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-primary border-primary hover:bg-primary/10"
                                        onClick={() => handleSendRequest(user.id)}
                                    >
                                        <UserPlus className="w-4 h-4 mr-2" /> Kết bạn
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Lời mời kết bạn ({requests.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {requests.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Bạn không có lời mời kết bạn nào.</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {requests.map((req) => (
                                <div key={req.id} className="flex items-center gap-3 p-3 border rounded-lg">
                                    <Avatar>
                                        <AvatarImage src={req.user?.avatar} />
                                        <AvatarFallback>{req.user?.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{req.user?.full_name || req.user?.username}</p>
                                        <p className="text-xs text-muted-foreground truncate">{req.user?.username}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button size="icon" variant="default" className="h-8 w-8" onClick={() => handleAccept(req.id)}>
                                            <Check className="w-4 h-4" />
                                        </Button>
                                        <Button size="icon" variant="outline" className="h-8 w-8 border-destructive text-destructive hover:bg-destructive" onClick={() => handleRejectOrRemove(req.id)}>
                                            <X className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary" />
                        Bạn bè của tôi ({friends.length})
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {friends.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Bạn chưa có người bạn nào.</p>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {friends.map((friend) => (
                                <div key={friend.id} className="flex flex-col items-center gap-3 p-4 border rounded-xl text-center bg-card shadow-sm hover:shadow-md transition-shadow">
                                    <Avatar className="w-16 h-16">
                                        <AvatarImage src={friend.avatar} />
                                        <AvatarFallback className="text-xl">{friend.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-semibold text-sm">{friend.full_name || friend.username}</p>
                                        <p className="text-xs text-muted-foreground">@{friend.username}</p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive"
                                        // Notice: We don't have the friendship ID here simply fetched in getFriends. A real implementation would return { friend, friendshipId }
                                        // So we might need a workaround or adapt the backend to return friendshipId too.
                                        onClick={() => showError("Tính năng demo: Trong thực tế cần gọi removeFriend với friendshipId hiện tại.")}
                                    >
                                        <UserMinus className="w-4 h-4 mr-2" /> Hủy kết bạn
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
export default FriendsList;
