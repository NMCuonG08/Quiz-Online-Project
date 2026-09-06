"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { Trophy, Users } from "lucide-react";

type Entry = { rank: number; user: { id: string; username?: string | null; full_name?: string | null; avatar?: string | null }; percentage: number; score: number; timeTaken?: number | null };

export default function FriendsLeaderboard({ quizId }: { quizId: string }) {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    apiClient.get(apiRoutes.QUIZZES.FRIENDS_LEADERBOARD(quizId)).then((response) => {
      const data = response.data?.data ?? response.data ?? [];
      if (active) setEntries(Array.isArray(data) ? data : []);
    }).catch(() => { if (active) setEntries([]); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [quizId]);
  return <Card disableHover>
    <CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Users className="h-5 w-5 text-primary" />Bạn bè đã chơi</CardTitle></CardHeader>
    <CardContent>{loading ? <p className="text-sm text-muted-foreground">Đang tải bảng điểm...</p> : entries.length === 0 ? <p className="text-sm text-muted-foreground">Bạn bè chưa có kết quả cho quiz này.</p> : <div className="space-y-3">{entries.map((entry) => { const name = entry.user.full_name || entry.user.username || "Bạn"; return <div key={entry.user.id} className="flex items-center gap-3"><span className="w-6 text-center font-semibold">{entry.rank <= 3 ? <Trophy className="mx-auto h-4 w-4 text-amber-500" /> : entry.rank}</span><Avatar className="h-8 w-8"><AvatarImage src={entry.user.avatar ?? undefined} /><AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><span className="min-w-0 flex-1 truncate text-sm">{name}</span><span className="text-sm font-semibold">{Math.round(entry.percentage)}%</span></div>; })}</div>}</CardContent>
  </Card>;
}
