"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/common/components/ui/card";
import { Button } from "@/common/components/ui/button";
import { Input } from "@/common/components/ui/input";
import { Send } from "lucide-react";
import { MessagingService, Conversation, Message } from "./messaging.service";
import { wsManager } from "@/lib/websocket";

const MessageCircleIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.5 8.5 0 0 1-4-.98L3 20l1.98-4A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
);

export default function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const selected = useMemo(() => conversations.find((item) => item.id === selectedId), [conversations, selectedId]);
  const load = async () => { const data = await MessagingService.list(); setConversations(data); if (!selectedId && data[0]) setSelectedId(data[0].id); };
  useEffect(() => { void load().catch(() => setConversations([])); }, []);
  useEffect(() => { if (!selectedId) return; void MessagingService.messages(selectedId).then((data) => setMessages(data.reverse())); void MessagingService.read(selectedId); }, [selectedId]);
  useEffect(() => { const handler = (payload: any) => { if (payload?.conversationId === selectedId && payload.message) setMessages((current) => current.some((item) => item.id === payload.message.id) ? current : [...current, payload.message]); }; wsManager.on("direct_message", handler); return () => wsManager.off("direct_message", handler); }, [selectedId]);
  const send = async (event: React.FormEvent) => { event.preventDefault(); if (!selectedId || !text.trim()) return; const body = text.trim(); setText(""); const message = await MessagingService.send(selectedId, body); setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]); };
  const title = selected?.members.find((member) => member.user?.id !== selected?.members[0]?.user?.id)?.user?.full_name || selected?.members.find((member) => member.user?.id !== selected?.members[0]?.user?.id)?.user?.username || "Cuộc trò chuyện";
  return <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
    <Card disableHover><CardHeader><CardTitle className="flex items-center gap-2"><MessageCircleIcon className="h-5 w-5 text-primary" />Tin nhắn</CardTitle></CardHeader><CardContent className="space-y-2">{conversations.length === 0 ? <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện. Hãy kết bạn để bắt đầu.</p> : conversations.map((conversation) => <Button key={conversation.id} variant={conversation.id === selectedId ? "secondary" : "ghost"} className="w-full justify-start" onClick={() => setSelectedId(conversation.id)}>{conversation.members.find((member) => member.user_id !== conversation.members[0]?.user_id)?.user?.full_name || "Bạn"}</Button>)}</CardContent></Card>
    <Card disableHover className="min-h-[520px]"><CardHeader><CardTitle>{selected ? title : "Chọn một cuộc trò chuyện"}</CardTitle></CardHeader><CardContent className="flex h-[430px] flex-col"><div className="flex-1 space-y-2 overflow-y-auto">{messages.map((message) => <div key={message.id} className="rounded-lg bg-muted px-3 py-2 text-sm">{message.body}<span className="ml-2 text-xs text-muted-foreground">{new Date(message.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span></div>)}</div><form onSubmit={send} className="mt-4 flex gap-2"><Input value={text} onChange={(event) => setText(event.target.value)} placeholder="Nhắn tin..." disabled={!selectedId} /><Button type="submit" size="icon" disabled={!selectedId || !text.trim()}><Send className="h-4 w-4" /></Button></form></CardContent></Card>
  </div>;
}
