"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/common/components/ui/avatar";
import { Send, Users } from "lucide-react";
import { useAppSelector } from "@/hooks/useRedux";
import { showError } from "@/lib/Notification";
import { FriendshipService, FriendUser } from "../user-profile/services/friendship.service";
import { MessagingService, Conversation, Message } from "./messaging.service";
import { wsManager } from "@/lib/websocket";

const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-4-.98L3 20l1.98-4A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
);

function friendName(friend?: FriendUser) {
  return friend?.full_name || friend?.username || "Bạn";
}

function FriendAvatar({ friend }: { friend?: FriendUser }) {
  const name = friendName(friend);
  return <Avatar className="h-8 w-8"><AvatarImage src={friend?.avatar || undefined} alt={name} /><AvatarFallback>{name.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>;
}

export default function MessagesPage() {
  const currentUserId = useAppSelector((state) => state.auth.user?.id);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<FriendUser[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [startingFriendId, setStartingFriendId] = useState<string | null>(null);
  const selected = useMemo(
    () => conversations.find((item) => item.id === selectedId),
    [conversations, selectedId],
  );
  const otherMember = (conversation?: Conversation) =>
    conversation?.members.find((member) => member.user_id !== currentUserId)
    || conversation?.members[0];
  const selectedName = otherMember(selected)?.user?.full_name
    || otherMember(selected)?.user?.username
    || "Cuộc trò chuyện";

  const load = async () => {
    const [conversationData, friendResponse] = await Promise.all([
      MessagingService.list(),
      FriendshipService.getFriends(),
    ]);
    const requestedConversationId = new URLSearchParams(window.location.search).get("conversation");
    setConversations(conversationData);
    setFriends(friendResponse.data.map((item) => item.friend));
    setSelectedId((current) => {
      if (requestedConversationId && conversationData.some((item) => item.id === requestedConversationId)) {
        return requestedConversationId;
      }
      if (current && conversationData.some((item) => item.id === current)) return current;
      return conversationData[0]?.id || null;
    });
  };

  useEffect(() => {
    void load().catch(() => showError("Không thể tải danh sách tin nhắn."));
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    void MessagingService.messages(selectedId)
      .then((data) => setMessages(data.reverse()))
      .catch(() => showError("Không thể tải tin nhắn."));
    void MessagingService.read(selectedId);
  }, [selectedId]);

  useEffect(() => {
    const handler = (payload: any) => {
      if (payload?.conversationId === selectedId && payload.message) {
        setMessages((current) => current.some((item) => item.id === payload.message.id)
          ? current
          : [...current, payload.message]);
      }
    };
    wsManager.on("direct_message", handler);
    return () => wsManager.off("direct_message", handler);
  }, [selectedId]);

  const startConversation = async (friend: FriendUser) => {
    const existing = conversations.find((conversation) =>
      conversation.members.some((member) => member.user_id === friend.id),
    );
    if (existing) {
      setSelectedId(existing.id);
      return;
    }
    setStartingFriendId(friend.id);
    try {
      const created = await MessagingService.create(friend.id);
      const conversation: Conversation = {
        ...created,
        members: created.members.map((member) => member.user_id === friend.id
          ? { ...member, user: friend }
          : member),
        messages: created.messages || [],
      };
      setConversations((current) => [conversation, ...current.filter((item) => item.id !== conversation.id)]);
      setSelectedId(conversation.id);
    } catch (error: any) {
      showError(error?.response?.data?.message || "Không thể bắt đầu cuộc trò chuyện.");
    } finally {
      setStartingFriendId(null);
    }
  };

  const send = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !text.trim()) return;
    const body = text.trim();
    setText("");
    try {
      const message = await MessagingService.send(selectedId, body);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setConversations((current) => {
        const active = current.find((item) => item.id === selectedId);
        return active ? [{ ...active, messages: [message] }, ...current.filter((item) => item.id !== selectedId)] : current;
      });
    } catch {
      setText(body);
      showError("Không thể gửi tin nhắn. Vui lòng thử lại.");
    }
  };

  return <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
    <Card disableHover>
      <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircleIcon className="h-5 w-5 text-primary" />Tin nhắn</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          {conversations.length === 0
            ? <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào.</p>
            : conversations.map((conversation) => { const member = otherMember(conversation); const friend = member?.user; return <Button key={conversation.id} variant={conversation.id === selectedId ? "secondary" : "ghost"} className="w-full justify-start gap-2" onClick={() => setSelectedId(conversation.id)}><FriendAvatar friend={friend} /><span className="truncate">{friendName(friend)}</span></Button>; })}
        </div>
        <div className="border-t pt-4">
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold"><Users className="h-4 w-4 text-primary" />Bạn bè</p>
          <div className="space-y-1">
            {friends.length === 0
              ? <p className="text-sm text-muted-foreground">Hãy kết bạn để bắt đầu trò chuyện.</p>
              : friends.map((friend) => <Button key={friend.id} variant="ghost" className="w-full justify-start gap-2" disabled={startingFriendId === friend.id} onClick={() => void startConversation(friend)}><FriendAvatar friend={friend} /><span className="truncate">{friendName(friend)}</span></Button>)}
          </div>
        </div>
      </CardContent>
    </Card>
    <Card disableHover className="min-h-[520px]">
      <CardHeader><CardTitle>{selected ? selectedName : "Chọn một người bạn để nhắn tin"}</CardTitle></CardHeader>
      <CardContent className="flex h-[430px] flex-col">
        <div className="flex-1 space-y-2 overflow-y-auto">
          {selected && messages.length === 0 && <p className="text-sm text-muted-foreground">Chưa có tin nhắn. Hãy bắt đầu cuộc trò chuyện.</p>}
          {messages.map((message) => <div key={message.id} className="rounded-lg bg-muted px-3 py-2 text-sm">{message.body}<span className="ml-2 text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>)}
        </div>
        <form onSubmit={send} className="mt-4 flex gap-2"><Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Nhắn tin..." disabled={!selectedId} /><Button type="submit" size="icon" disabled={!selectedId || !text.trim()}><Send className="h-4 w-4" /></Button></form>
      </CardContent>
    </Card>
  </div>;
}
