"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { Button } from "@/common/components/ui/button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/common/components/ui/popover";
import { ScrollArea } from "@/common/components/ui/scroll-area";
import { Separator } from "@/common/components/ui/separator";
import {
    Bell,
    Check,
    CheckCheck,
    Info,
    AlertTriangle,
    XCircle,
    CheckCircle2,
    Trash2,
    Loader2,
    Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAppSelector } from "@/hooks/useRedux";
import {
    NotificationApiService,
    ServerNotification,
} from "@/common/services/notification.service";
import { formatDistanceToNow } from "date-fns";

const PAGE_SIZE = 8;

const typeConfig = {
    INFO: {
        icon: Info,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
    },
    WARNING: {
        icon: AlertTriangle,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
    },
    ERROR: {
        icon: XCircle,
        color: "text-red-500",
        bg: "bg-red-500/10",
    },
    SUCCESS: {
        icon: CheckCircle2,
        color: "text-emerald-500",
        bg: "bg-emerald-500/10",
    },
};

export function NotificationDropdown() {
    const { user } = useAppSelector((state) => state.auth);
    const userId = user?.id;

    const [notifications, setNotifications] = useState<ServerNotification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [open, setOpen] = useState(false);

    // Server-side pagination
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const hasFetched = useRef(false);

    // Fetch first page
    const fetchNotifications = useCallback(
        async (pageNum = 1, append = false) => {
            if (!userId) return;
            if (!append) setLoading(true);
            else setLoadingMore(true);

            try {
                const [notifRes, count] = await Promise.all([
                    NotificationApiService.getByUserId(userId, pageNum, PAGE_SIZE),
                    pageNum === 1
                        ? NotificationApiService.getUnreadCount(userId)
                        : Promise.resolve(unreadCount),
                ]);

                if (notifRes.success) {
                    const items = notifRes.items || [];
                    setNotifications((prev) =>
                        append ? [...prev, ...items] : items
                    );
                    setPage(pageNum);

                    if (notifRes.pagination) {
                        setHasMore(notifRes.pagination.hasNext);
                        setTotalCount(notifRes.pagination.total);
                    } else {
                        // No pagination in response: assume no more
                        setHasMore(items.length === PAGE_SIZE);
                    }
                }

                if (pageNum === 1) {
                    setUnreadCount(count as number);
                }
            } catch (e) {
                console.error("Failed to fetch notifications:", e);
            } finally {
                setLoading(false);
                setLoadingMore(false);
            }
        },
        [userId, unreadCount]
    );

    // Fetch unread count silently on mount
    useEffect(() => {
        if (!userId || hasFetched.current) return;
        NotificationApiService.getUnreadCount(userId).then(setUnreadCount);
        hasFetched.current = true;
    }, [userId]);

    // Fetch page 1 when popover opens
    useEffect(() => {
        if (open && userId) {
            fetchNotifications(1);
        }
    }, [open, userId, fetchNotifications]);

    // Load more
    const handleLoadMore = () => {
        fetchNotifications(page + 1, true);
    };

    // Mark single as read
    const handleMarkRead = async (id: string) => {
        const success = await NotificationApiService.markAsRead(id);
        if (success) {
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        }
    };

    // Mark all as read
    const handleMarkAllRead = async () => {
        if (!userId) return;
        const success = await NotificationApiService.markAllAsRead(userId);
        if (success) {
            setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
            setUnreadCount(0);
        }
    };

    // Delete notification
    const handleDelete = async (id: string, isRead: boolean) => {
        const success = await NotificationApiService.deleteNotification(id);
        if (success) {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            if (!isRead) {
                setUnreadCount((prev) => Math.max(0, prev - 1));
            }
            setTotalCount((prev) => Math.max(0, prev - 1));
        }
    };

    const formatTime = (dateStr: string) => {
        try {
            return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
        } catch {
            return "";
        }
    };

    const remainingCount = Math.max(0, totalCount - notifications.length);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        title="Thông báo"
                        disableShadow
                    >
                        <Bell size={18} />
                    </Button>
                    {unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold pointer-events-none shadow-sm">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
            </PopoverTrigger>

            <PopoverContent
                align="end"
                className="w-[380px] p-0 shadow-2xl border-border/60"
                sideOffset={8}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">Thông báo</h3>
                        {unreadCount > 0 && (
                            <span className="text-[10px] font-bold bg-primary/15 text-primary px-1.5 py-0.5 rounded-md">
                                {unreadCount} mới
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 gap-1 text-muted-foreground hover:text-primary"
                            onClick={handleMarkAllRead}
                            disableShadow
                        >
                            <CheckCheck size={14} />
                            Đọc tất cả
                        </Button>
                    )}
                </div>

                <Separator />

                {/* Content */}
                <ScrollArea className="max-h-[420px]">
                    {loading && notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Loader2 size={24} className="animate-spin mb-2" />
                            <p className="text-xs">Đang tải...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                            <Inbox size={36} className="mb-3 opacity-40" />
                            <p className="text-sm font-medium">Không có thông báo</p>
                            <p className="text-xs mt-1">Bạn sẽ nhận thông báo ở đây</p>
                        </div>
                    ) : (
                        <div>
                            {notifications.map((notification) => {
                                const config =
                                    typeConfig[notification.type] || typeConfig.INFO;
                                const Icon = config.icon;

                                return (
                                    <div
                                        key={notification.id}
                                        className={cn(
                                            "group relative flex gap-3 px-4 py-3 transition-colors hover:bg-muted/50 cursor-default",
                                            !notification.is_read && "bg-primary/[0.03]"
                                        )}
                                    >
                                        {/* Type Icon */}
                                        <div
                                            className={cn(
                                                "shrink-0 w-9 h-9 rounded-xl flex items-center justify-center mt-0.5",
                                                config.bg
                                            )}
                                        >
                                            <Icon size={16} className={config.color} />
                                        </div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p
                                                    className={cn(
                                                        "text-sm leading-snug line-clamp-1",
                                                        !notification.is_read
                                                            ? "font-semibold text-foreground"
                                                            : "font-medium text-foreground/80"
                                                    )}
                                                >
                                                    {notification.title}
                                                </p>
                                                {!notification.is_read && (
                                                    <span className="shrink-0 size-2 rounded-full bg-primary mt-1.5" />
                                                )}
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">
                                                {notification.message}
                                            </p>
                                            <p className="text-[10px] text-muted-foreground/70 mt-1.5">
                                                {formatTime(notification.created_at)}
                                            </p>
                                        </div>

                                        {/* Actions (hover) */}
                                        <div className="shrink-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {!notification.is_read && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleMarkRead(notification.id);
                                                    }}
                                                    className="p-1 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                                    title="Đánh dấu đã đọc"
                                                >
                                                    <Check size={14} />
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDelete(
                                                        notification.id,
                                                        notification.is_read
                                                    );
                                                }}
                                                className="p-1 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                title="Xoá"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Load More */}
                            {hasMore && (
                                <div className="px-4 py-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="w-full text-xs h-8 font-medium"
                                        onClick={handleLoadMore}
                                        disabled={loadingMore}
                                        disableShadow
                                    >
                                        {loadingMore ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin mr-1" />
                                                Đang tải...
                                            </>
                                        ) : (
                                            `Xem thêm${remainingCount > 0 ? ` (${remainingCount} còn lại)` : ""}`
                                        )}
                                    </Button>
                                </div>
                            )}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

export default NotificationDropdown;
