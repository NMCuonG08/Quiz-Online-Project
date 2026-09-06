"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Skeleton } from "@/common/components/ui/skeleton";
import { BookOpen, Flame, Users, Clock3, Trophy } from "lucide-react";

type DashboardData = {
  statistics?: { total_quizzes_taken?: number; average_score?: number; streak_days?: number; total_time_spent?: number };
  social?: { friendsCount?: number; pendingRequests?: number; inProgress?: number };
};

export default function DashboardOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let active = true;
    apiClient.get(apiRoutes.USERS.DASHBOARD).then((response) => {
      if (active) setData(response.data?.data ?? response.data ?? null);
    }).catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, []);
  if (error) return <p className="text-sm text-muted-foreground">Không thể tải thống kê. Vui lòng thử lại sau.</p>;
  if (!data) return <div className="grid gap-3 sm:grid-cols-4">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-24 rounded-xl" />)}</div>;
  const stats = data.statistics ?? {};
  const social = data.social ?? {};
  const cards = [
    { label: "Quiz đã hoàn thành", value: stats.total_quizzes_taken ?? 0, icon: BookOpen },
    { label: "Điểm trung bình", value: `${Math.round(stats.average_score ?? 0)}%`, icon: Trophy },
    { label: "Chuỗi ngày học", value: `${stats.streak_days ?? 0} ngày`, icon: Flame },
    { label: "Bạn bè", value: social.friendsCount ?? 0, icon: Users },
  ];
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{cards.map(({ label, value, icon: Icon }) => <Card key={label} disableHover><CardHeader className="flex-row items-center justify-between gap-2 pb-2"><CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle><Icon className="h-4 w-4 text-primary" /></CardHeader><CardContent><p className="text-2xl font-bold">{value}</p></CardContent></Card>)}</div>
    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground"><span className="inline-flex items-center gap-1"><Clock3 className="h-4 w-4" />{social.inProgress ?? 0} quiz đang làm</span><span className="inline-flex items-center gap-1"><Users className="h-4 w-4" />{social.pendingRequests ?? 0} lời mời mới</span></div>
  </div>;
}
