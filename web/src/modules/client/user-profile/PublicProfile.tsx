"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api";
import { apiRoutes } from "@/lib/apiRoutes";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { Button } from "@/common/components/ui/button";
import { FriendshipService } from "./services/friendship.service";
import { MessageCircle, UserPlus, UserCheck, Clock3 } from "lucide-react";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";

export default function PublicProfile({ userId }: { userId: string }) {
  const router = useLocalizedRouter();
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { let active = true; apiClient.get(apiRoutes.USERS.PUBLIC_PROFILE(userId)).then((response) => { if (active) setData(response.data?.data ?? response.data); }).catch(() => { if (active) setData({ error: true }); }); return () => { active = false; }; }, [userId]);
  if (!data) return <div className="mx-auto max-w-2xl py-12 text-center text-muted-foreground">Đang tải hồ sơ...</div>;
  if (data.error || !data.profile) return <div className="mx-auto max-w-2xl py-12 text-center text-muted-foreground">Không tìm thấy hồ sơ.</div>;
  const profile = data.profile; const relation = data.relationship?.status;
  const name = profile.full_name || profile.username || "Người dùng";
  const sendRequest = async () => { setBusy(true); try { await FriendshipService.sendRequest(userId); setData((current: any) => ({ ...current, relationship: { status: "OUTGOING_PENDING" } })); } finally { setBusy(false); } };
  const openChat = async () => { setBusy(true); try { const response = await apiClient.post(apiRoutes.MESSAGING.CONVERSATIONS, { otherUserId: userId }); const conversation = response.data?.data ?? response.data; if (conversation?.id) router.push(`/user/messages?conversation=${conversation.id}`); } finally { setBusy(false); } };
  return <div className="mx-auto max-w-3xl space-y-6"><Card disableHover><CardContent className="flex flex-wrap items-center gap-4 pt-6"><Avatar className="h-20 w-20"><AvatarImage src={profile.avatar ?? undefined} /><AvatarFallback className="text-2xl">{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><h1 className="text-2xl font-bold">{name}</h1><p className="text-sm text-muted-foreground">@{profile.username || "user"}</p>{profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}</div>{relation === "NONE" && <Button onClick={sendRequest} disabled={busy}><UserPlus className="mr-2 h-4 w-4" />Kết bạn</Button>}{relation === "OUTGOING_PENDING" && <Button variant="outline" disabled><Clock3 className="mr-2 h-4 w-4" />Đã gửi</Button>}{relation === "FRIENDS" && <Button onClick={openChat} disabled={busy}><MessageCircle className="mr-2 h-4 w-4" />Nhắn tin</Button>}{relation === "SELF" && <Button variant="outline" onClick={() => router.push("/user/profile")}>Chỉnh sửa hồ sơ</Button>}</CardContent></Card>{data.statistics && <Card disableHover><CardHeader><CardTitle>Thành tích được chia sẻ</CardTitle></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div><p className="text-2xl font-bold">{data.statistics.total_quizzes_taken ?? 0}</p><p className="text-xs text-muted-foreground">Quiz hoàn thành</p></div><div><p className="text-2xl font-bold">{Math.round(data.statistics.average_score ?? 0)}%</p><p className="text-xs text-muted-foreground">Điểm trung bình</p></div><div><p className="text-2xl font-bold">{data.statistics.streak_days ?? 0}</p><p className="text-xs text-muted-foreground">Ngày liên tiếp</p></div></CardContent></Card>}</div>;
}
