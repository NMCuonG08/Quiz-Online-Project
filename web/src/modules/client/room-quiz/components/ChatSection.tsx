"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, MessageCircle } from "lucide-react";
import { Input } from "@/common/components/ui/input";
import { type ChatMessage } from "../services/room-quiz.service";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/common/components/ui/avatar";
import { wsManager } from "@/lib/websocket";

interface ChatSectionProps {
  messages: ChatMessage[];
  loading: boolean;
  error: string | null;
  sendMessageLoading: boolean;
  onSendMessage: (message: string) => void;
  className?: string;
}

export function ChatSection({
  messages,
  loading,
  error,
  sendMessageLoading,
  onSendMessage,
  className = "",
}: ChatSectionProps) {
  const [message, setMessage] = useState("");
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    const el = messagesContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendMessageLoading) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getCurrentUserId = () => {
    try {
      const token = wsManager.getCurrentToken();
      if (!token) return undefined;
      const payload = JSON.parse(atob(token.split(".")[1] || ""));
      return payload?.sub || payload?.userId || payload?.id;
    } catch {
      return undefined;
    }
  };
  const myUserId = getCurrentUserId();

  return (
    <div
      className={`bg-card border border-border rounded-lg h-full flex flex-col ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">Chat</h3>
        </div>
      </div>

      {/* Messages */}
      <div
        className="flex-1 overflow-y-auto p-4 space-y-3"
        ref={messagesContainerRef}
      >
        {loading ? (
          <div className="text-center text-muted-foreground">
            Loading messages...
          </div>
        ) : error ? (
          <div className="text-center text-destructive">{error}</div>
        ) : !Array.isArray(messages) || messages.length === 0 ? (
          <div className="text-center text-muted-foreground">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isSystem = msg.message_type === "system";
            const isMe = !!myUserId && msg.user_id === myUserId;
            const displayName = isMe
              ? "You"
              : msg.username || (msg.user_id || "").slice(0, 8) || "User";
            return (
              <div
                key={msg.id}
                className={`flex ${
                  isSystem
                    ? "justify-center"
                    : isMe
                    ? "justify-end"
                    : "justify-start"
                }`}
              >
                {isSystem ? (
                  <div className="bg-muted/50 text-muted-foreground text-sm px-3 py-1 rounded-full">
                    {msg.message}
                  </div>
                ) : (
                  <div
                    className={`flex items-start gap-2 max-w-[80%] ${
                      isMe ? "flex-row-reverse" : ""
                    }`}
                  >
                    <Avatar className="w-8 h-8 mt-0.5">
                      <AvatarImage src={msg.avatar_url || undefined} />
                      <AvatarFallback className="text-xs">
                        {(displayName || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`flex-1 ${isMe ? "text-right" : "text-left"}`}
                    >
                      <div
                        className={`flex items-center gap-2 mb-1 ${
                          isMe ? "justify-end" : "justify-start"
                        }`}
                      >
                        <span className="text-sm font-medium text-foreground">
                          {displayName}
                        </span>
                        {isMe && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            You
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <div
                        className={`${
                          isMe
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted/50 text-foreground"
                        } p-2 rounded-lg text-sm inline-block`}
                      >
                        {msg.message}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a message..."
            disabled={sendMessageLoading}
            className="flex-1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={!message.trim() || sendMessageLoading}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
