"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUp,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  Info,
  List,
  MessageCircle,
  Minimize2,
  RotateCcw,
  History,
  Sparkles,
  Square,
  Table2,
  X,
} from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppSelector } from "@/hooks/useRedux";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { cn } from "@/lib/utils";
import { streamAgentChat } from "../services/agent-stream.service";
import type { AgentStreamEvent, ChatAction, ChatMessage, ChatRole, ChatScope, UIBlock, UISurface } from "../types";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Chào bạn, mình là Quiz AI. Hãy mô tả điều bạn muốn làm; mình sẽ hỏi thêm khi thiếu thông tin và thao tác trực tiếp trên hệ thống khi đã đủ dữ liệu.",
  createdAt: 0,
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function QuizAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [unread, setUnread] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ session_id: string; title: string; updated_at: string }>>([]);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useLocalizedRouter();
  const user = useAppSelector((state) => state.auth.user);
  const principalKey = user?.id ? `user:${user.id}` : "guest";
  const sessionStorageKey = `quiz_ai_session_id:${principalKey}`;
  const scope: ChatScope = user?.isAdmin && pathname.includes("/admin")
    ? "admin"
    : pathname.includes("/user/quizzes")
      ? "creator"
      : "learner";

  useEffect(() => {
    abortRef.current?.abort();
    const storedSessionId = localStorage.getItem(sessionStorageKey) || undefined;
    setSessionId(storedSessionId);
    setMessages([WELCOME_MESSAGE]);
    setHistoryOpen(false);
    if (!user?.id || !storedSessionId) return;
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333").replace(/\/$/, "");
    const controller = new AbortController();
    void fetch(`${baseUrl}/api/ai-chat/conversations/${storedSessionId}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: controller.signal,
    }).then(async (response) => {
      setHistoryUnavailable(false);
      if (!response.ok) {
        if (response.status === 404) {
          localStorage.removeItem(sessionStorageKey);
          setSessionId(undefined);
        }
        return;
      }
      const payload = await response.json();
      setMessages((payload.data?.messages || []).map((item: { id: string; role: ChatRole; content: string; created_at: string }) => ({
        id: item.id, role: item.role, content: item.content, createdAt: Date.parse(item.created_at),
      })));
    }).catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setHistoryUnavailable(true);
      }
    });
    return () => controller.abort();
  }, [sessionStorageKey, user?.id]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) {
      setUnread(false);
      window.setTimeout(() => inputRef.current?.focus(), 180);
    }
  }, [open]);

  const loadHistory = useCallback(async () => {
    const token = localStorage.getItem("auth_token");
    if (!token) return setHistory([]);
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333").replace(/\/$/, "");
    try {
      const response = await fetch(`${baseUrl}/api/ai-chat/conversations`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const payload = await response.json();
      setHistory(payload.data || []);
      setHistoryUnavailable(false);
    } catch {
      setHistoryUnavailable(true);
    }
  }, []);

  const openHistoryConversation = async (targetSessionId: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333").replace(/\/$/, "");
    try {
      const response = await fetch(`${baseUrl}/api/ai-chat/conversations/${targetSessionId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) return;
      const payload = await response.json();
      setSessionId(targetSessionId);
      localStorage.setItem(sessionStorageKey, targetSessionId);
      setMessages((payload.data?.messages || []).map((item: { id: string; role: ChatRole; content: string; created_at: string }) => ({ id: item.id, role: item.role, content: item.content, createdAt: Date.parse(item.created_at) })));
      setHistoryOpen(false);
      setHistoryUnavailable(false);
    } catch {
      setHistoryUnavailable(true);
    }
  };

  const deleteHistoryConversation = async (targetSessionId: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3333").replace(/\/$/, "");
    try {
      const response = await fetch(
        `${baseUrl}/api/ai-chat/conversations/${targetSessionId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } },
      );
      if (!response.ok) return;
      setHistory((current) => current.filter((item) => item.session_id !== targetSessionId));
      if (targetSessionId === sessionId) {
        abortRef.current?.abort();
        localStorage.removeItem(sessionStorageKey);
        setSessionId(undefined);
        setMessages([WELCOME_MESSAGE]);
        setInput("");
      }
      setHistoryUnavailable(false);
    } catch {
      setHistoryUnavailable(true);
    }
  };

  useEffect(() => () => abortRef.current?.abort(), []);

  const subtitle = useMemo(
    () => (isStreaming ? "Agent đang làm việc" : "Sẵn sàng • Tool calling + SSE"),
    [isStreaming],
  );

  const patchAssistant = (
    messageId: string,
    patch: Partial<ChatMessage> | ((current: ChatMessage) => Partial<ChatMessage>),
  ) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, ...(typeof patch === "function" ? patch(message) : patch) }
          : message,
      ),
    );
  };

  const onAgentEvent = (messageId: string, event: AgentStreamEvent) => {
    if (event.type === "connected") {
      setSessionId(event.session_id);
      localStorage.setItem(sessionStorageKey, event.session_id);
    } else if (event.type === "status") {
      patchAssistant(messageId, { status: event.label, tool: event.tool });
    } else if (event.type === "token") {
      patchAssistant(messageId, (message) => ({ content: message.content + event.delta, status: undefined }));
    } else if (event.type === "ui") {
      patchAssistant(messageId, { surface: event.surface });
    } else if (event.type === "citations") {
      patchAssistant(messageId, { citations: event.items });
    } else if (event.type === "trace") {
      patchAssistant(messageId, (message) => ({
        traceId: event.trace_id,
        traceSteps: [...(message.traceSteps || []), event],
      }));
    } else if (event.type === "done") {
      patchAssistant(messageId, {
        isStreaming: false,
        agent: event.agent,
        tool: event.tool,
        traceId: event.trace_id,
        status: undefined,
      });
    } else if (event.type === "error") {
      patchAssistant(messageId, {
        content: event.message,
        isStreaming: false,
        status: undefined,
        error: true,
      });
    }
  };

  const sendMessage = async (rawMessage?: string) => {
    const value = (rawMessage ?? input).trim();
    if (!value || isStreaming) return;

    setInput("");
    setIsStreaming(true);
    const assistantId = uid("assistant");
    setMessages((current) => [
      ...current,
      { id: uid("user"), role: "user", content: value, createdAt: Date.now() },
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: Date.now(),
        isStreaming: true,
        status: "Agent đang hiểu yêu cầu",
      },
    ]);

    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamAgentChat({
        message: value,
        userId: user?.id || "guest",
        sessionId,
        locale,
        scope,
        context: { route: pathname || "/" },
        signal: controller.signal,
        onEvent: (event) => onAgentEvent(assistantId, event),
      });
      patchAssistant(assistantId, { isStreaming: false, status: undefined });
      if (!open) setUnread(true);
    } catch {
      patchAssistant(assistantId, {
        content: controller.signal.aborted
          ? "Đã dừng phản hồi."
          : "Không kết nối được AI Agent Server tại cổng 8000.",
        isStreaming: false,
        status: undefined,
        error: !controller.signal.aborted,
      });
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    void sendMessage();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage();
    }
  };

  const handleAction = (action: ChatAction) => {
    if (action.kind === "approve") {
      void sendMessage("__approve__:" + action.value);
    } else if (action.kind === "navigate") {
      if (!action.value.startsWith("/")) return;
      setOpen(false);
      router.push(action.value);
    } else {
      void sendMessage(action.value);
    }
  };

  const resetChat = () => {
    abortRef.current?.abort();
    localStorage.removeItem(sessionStorageKey);
    setSessionId(undefined);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  return (
    <div className="fixed bottom-4 right-4 z-[99990] sm:bottom-6 sm:right-6">
      {open && (
        <section
          className="mb-3 flex h-[calc(100dvh-6.5rem)] w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-[24px] border border-border/80 bg-background shadow-2xl shadow-black/15 sm:h-[min(680px,calc(100dvh-6.5rem))] sm:w-[430px]"
          role="dialog"
          aria-label="Quiz AI Assistant"
        >
          <header className="flex items-center gap-3 border-b border-border/70 bg-background px-4 py-3.5">
            <div className="relative flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#FDD239] text-slate-950 shadow-sm">
              <Sparkles className="size-5" />
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-background bg-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-sm font-bold">Quiz AI</h2>
                <span className="rounded-md bg-[#FDD239]/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">Agent</span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>
            </div>
            <button onClick={resetChat} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Cuộc trò chuyện mới">
              <RotateCcw className="size-4" />
            </button>
            <button onClick={() => { setHistoryOpen((value) => !value); void loadHistory(); }} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Lịch sử chat">
              <History className="size-4" />
            </button>
            <button onClick={() => setOpen(false)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Thu nhỏ chat">
              <Minimize2 className="size-4" />
            </button>
          </header>
          {historyOpen && (
            <div className="max-h-44 overflow-y-auto border-b border-border bg-background p-2">
              {historyUnavailable ? <p className="px-2 py-3 text-xs text-amber-600">Backend đang offline; lịch sử chat sẽ tải lại khi kết nối.</p> : history.length ? history.map((item) => (
                <div key={item.session_id} className="group flex items-center gap-1 rounded-lg hover:bg-muted">
                  <button onClick={() => void openHistoryConversation(item.session_id)} className="min-w-0 flex-1 px-2.5 py-2 text-left text-xs">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(item.updated_at).toLocaleString()}</span>
                  </button>
                  <button
                    onClick={() => void deleteHistoryConversation(item.session_id)}
                    className="mr-1 grid size-7 shrink-0 place-items-center rounded-md text-muted-foreground hover:bg-red-500/10 hover:text-red-600"
                    aria-label={`Xóa lịch sử ${item.title}`}
                    title="Xóa ngay"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              )) : <p className="px-2 py-3 text-xs text-muted-foreground">{user ? "Chưa có lịch sử chat." : "Đăng nhập để lưu và mở lại lịch sử chat."}</p>}
            </div>
          )}

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto bg-muted/20 px-4 py-5" aria-live="polite">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} onAction={handleAction} onPrompt={sendMessage} />
            ))}
          </div>

          <div className="border-t border-border/70 bg-background px-3 pb-3 pt-2.5">
            <form onSubmit={handleSubmit} className="flex items-end gap-2 rounded-2xl border border-border bg-muted/35 p-2 pl-3 focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-400/15">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Bạn muốn agent làm gì?"
                className="max-h-24 min-h-9 flex-1 resize-none bg-transparent py-2 text-sm leading-5 outline-none placeholder:text-muted-foreground"
                disabled={isStreaming}
              />
              {isStreaming ? (
                <button type="button" onClick={() => abortRef.current?.abort()} className="grid size-9 shrink-0 place-items-center rounded-xl bg-foreground text-background" aria-label="Dừng phản hồi">
                  <Square className="size-3.5 fill-current" />
                </button>
              ) : (
                <button type="submit" disabled={!input.trim()} className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FDD239] text-slate-950 shadow-sm hover:bg-[#f5c923] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Gửi tin nhắn">
                  <ArrowUp className="size-4" />
                </button>
              )}
            </form>
            <p className="mt-2 text-center text-[9px] text-muted-foreground">Agent dùng tool thật • Thao tác xóa luôn cần xác nhận</p>
          </div>
        </section>
      )}

      <button
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "relative ml-auto grid size-14 place-items-center rounded-2xl bg-[#FDD239] text-slate-950 shadow-xl shadow-amber-500/20 transition-transform hover:-translate-y-0.5 hover:bg-[#f5c923] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/30",
          open && "bg-foreground text-background hover:bg-foreground",
        )}
        aria-label={open ? "Đóng Quiz AI" : "Mở Quiz AI"}
      >
        {open ? <X className="size-5" /> : <MessageCircle className="size-6" />}
        {!open && unread && <span className="absolute -right-1 -top-1 size-3.5 rounded-full border-2 border-background bg-red-500" />}
      </button>
    </div>
  );
}

function MessageBubble({
  message,
  onAction,
  onPrompt,
}: {
  message: ChatMessage;
  onAction: (action: ChatAction) => void;
  onPrompt: (prompt: string) => Promise<void>;
}) {
  const assistant = message.role === "assistant";
  return (
    <div className={cn("flex gap-2.5", !assistant && "justify-end")}>
      {assistant && (
        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-[#FDD239] text-slate-950">
          <Bot className="size-4" />
        </div>
      )}
      <div className={cn("max-w-[88%]", !assistant && "flex flex-col items-end")}>
        {assistant && message.tool && (
          <span className="mb-1.5 rounded-md bg-violet-500/10 px-1.5 py-1 text-[9px] font-semibold text-violet-600 dark:text-violet-300">Tool · {message.tool}</span>
        )}
        <div className={cn(
          "text-[13px] leading-5",
          assistant ? "text-foreground" : "rounded-2xl rounded-br-md bg-foreground px-3.5 py-2.5 text-background",
          message.error && "text-red-600 dark:text-red-400",
        )}>
          {message.content ? (assistant ? <ChatMarkdown content={message.content} /> : message.content) : (
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className="flex gap-1"><i className="size-1.5 animate-pulse rounded-full bg-amber-500" /><i className="size-1.5 animate-pulse rounded-full bg-amber-500 [animation-delay:120ms]" /><i className="size-1.5 animate-pulse rounded-full bg-amber-500 [animation-delay:240ms]" /></span>
              {message.status || "Đang suy nghĩ"}
            </span>
          )}
          {message.content && message.isStreaming && <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-amber-500 align-middle" />}
        </div>
        {message.surface && <DynamicSurface surface={message.surface} onAction={onAction} onPrompt={onPrompt} />}
        {!!message.citations?.length && (
          <div className="mt-3 border-t border-border pt-2">
            <p className="mb-1.5 text-[9px] font-bold uppercase text-muted-foreground">Nguồn</p>
            <div className="space-y-1.5">
              {message.citations.map((citation, index) => (
                citation.url ? (
                  <a key={citation.url} href={citation.url} target="_blank" rel="noreferrer" className="block rounded-lg border border-border bg-background px-2.5 py-2 text-[10px] hover:bg-muted">
                    <p className="truncate font-bold text-foreground">{citation.title}</p>
                    {citation.snippet && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{citation.snippet}</p>}
                  </a>
                ) : (
                  <div key={`${citation.title}-${index}`} className="block rounded-lg border border-border bg-background px-2.5 py-2 text-[10px]">
                    <p className="truncate font-bold text-foreground">{citation.title}</p>
                    {citation.snippet && <p className="mt-0.5 line-clamp-2 text-muted-foreground">{citation.snippet}</p>}
                  </div>
                )
              ))}
            </div>
          </div>
        )}
        {assistant && message.traceId && (
          <details className="mt-2 text-[8px] text-muted-foreground">
            <summary className="cursor-pointer font-mono">Trace · {message.traceId}</summary>
            <ol className="mt-1 space-y-0.5 font-mono">
              {message.traceSteps?.map((step, index) => (
                <li key={`${step.node}-${step.event}-${step.tool || ""}-${index}`}>
                  {step.node} → {step.event}{step.tool ? ` · ${step.tool}` : ""}
                </li>
              ))}
            </ol>
          </details>
        )}
      </div>
    </div>
  );
}

function ChatMarkdown({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      urlTransform={(url) => (/^(https?:\/\/|\/)/i.test(url) ? url : "")}
      components={{
        h1: ({ children }) => <h3 className="mb-2 mt-3 text-base font-bold first:mt-0">{children}</h3>,
        h2: ({ children }) => <h4 className="mb-2 mt-3 text-sm font-bold first:mt-0">{children}</h4>,
        h3: ({ children }) => <h5 className="mb-1.5 mt-3 text-[13px] font-bold first:mt-0">{children}</h5>,
        p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
        strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5 marker:text-amber-500 last:mb-0">{children}</ul>,
        ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5 marker:font-bold marker:text-amber-600 last:mb-0">{children}</ol>,
        li: ({ children }) => <li className="pl-0.5">{children}</li>,
        blockquote: ({ children }) => <blockquote className="my-2 border-l-2 border-amber-400 bg-amber-50/60 py-1.5 pl-3 text-muted-foreground dark:bg-amber-400/10">{children}</blockquote>,
        code: ({ children, className }) => className
          ? <code className="my-2 block overflow-x-auto rounded-lg bg-muted px-3 py-2 font-mono text-[11px] leading-4">{children}</code>
          : <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">{children}</code>,
        hr: () => <hr className="my-3 border-border" />,
        a: ({ children, href }) => (
          <a href={href} target={href?.startsWith("http") ? "_blank" : undefined} rel="noreferrer" className="font-semibold text-amber-700 underline decoration-amber-400/70 underline-offset-2 hover:text-amber-600 dark:text-amber-300">
            {children}
          </a>
        ),
        table: ({ children }) => <div className="my-2 overflow-x-auto rounded-lg border border-border"><table className="w-full text-left text-[11px]">{children}</table></div>,
        th: ({ children }) => <th className="whitespace-nowrap bg-muted px-2.5 py-2 font-bold">{children}</th>,
        td: ({ children }) => <td className="border-t border-border px-2.5 py-2 align-top">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

function DynamicSurface({
  surface,
  onAction,
  onPrompt,
}: {
  surface: UISurface;
  onAction: (action: ChatAction) => void;
  onPrompt: (prompt: string) => Promise<void>;
}) {
  return (
    <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-background shadow-sm">
      {(surface.title || surface.description) && (
        <div className="border-b border-border px-3.5 py-3">
          {surface.title && <p className="text-xs font-bold">{surface.title}</p>}
          {surface.description && <p className="mt-1 text-[10px] leading-4 text-muted-foreground">{surface.description}</p>}
        </div>
      )}
      <div className="divide-y divide-border">
        {surface.blocks.map((block) => (
          <DynamicBlock key={block.id} block={block} onPrompt={onPrompt} />
        ))}
      </div>
      {!!surface.actions.length && (
        <div className="flex flex-wrap gap-2 border-t border-border p-3">
          {surface.actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action)}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold",
                action.variant === "primary" && "border-[#FDD239] bg-[#FDD239] text-slate-950 hover:bg-[#f5c923]",
                action.variant === "danger" && "border-red-500 bg-red-500 text-white hover:bg-red-600",
                (!action.variant || action.variant === "secondary") && "border-border bg-background hover:bg-muted",
              )}
            >
              {action.label}<ChevronRight className="size-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicBlock({ block, onPrompt }: { block: UIBlock; onPrompt: (prompt: string) => Promise<void> }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const toneIcon = block.tone === "success"
    ? <CheckCircle2 className="size-4 text-emerald-500" />
    : block.tone === "warning" || block.tone === "danger"
      ? <AlertTriangle className="size-4 text-amber-500" />
      : <Info className="size-4 text-blue-500" />;

  const submitForm = (event: FormEvent) => {
    event.preventDefault();
    const details = block.fields.map((field) => `${field.label}: ${values[field.name] || ""}`).join("\n");
    void onPrompt(`${block.submit_prompt}\n${details}`.trim());
  };

  if (block.type === "notice") {
    return <div className="flex gap-2.5 p-3.5">{toneIcon}<div><p className="text-[11px] font-bold">{block.title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{block.description}</p></div></div>;
  }

  if (block.type === "list") {
    return <div><BlockHeading icon={<List className="size-4" />} block={block} /><div className="divide-y divide-border">{block.items.map((item, index) => <div key={`${item.label}-${index}`} className="flex items-start justify-between gap-3 px-3.5 py-2.5"><div className="min-w-0"><p className="text-[10px] font-bold">{item.label}</p>{item.description && <p className="mt-0.5 text-[9px] text-muted-foreground">{item.description}</p>}</div><div className="shrink-0 text-right">{item.value && <p className="text-[10px] font-semibold">{item.value}</p>}{item.badge && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[8px] font-bold">{item.badge}</span>}</div></div>)}</div></div>;
  }

  if (block.type === "table") {
    return <div><BlockHeading icon={<Table2 className="size-4" />} block={block} /><div className="overflow-x-auto"><table className="w-full text-left text-[9px]"><thead className="bg-muted/70 text-muted-foreground"><tr>{block.columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 font-bold">{column}</th>)}</tr></thead><tbody className="divide-y divide-border">{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-40 truncate px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div></div>;
  }

  if (block.type === "stats") {
    return <div><BlockHeading icon={<BarChart3 className="size-4" />} block={block} /><div className="grid grid-cols-2 gap-px bg-border">{block.stats.map((stat) => <div key={stat.label} className="bg-background p-3"><p className="text-lg font-black">{stat.value}</p><p className="text-[9px] text-muted-foreground">{stat.label}</p>{stat.trend && <p className="mt-1 text-[8px] font-semibold text-emerald-600">{stat.trend}</p>}</div>)}</div></div>;
  }

  return (
    <form onSubmit={submitForm} className="p-3.5">
      <BlockHeading block={block} />
      <div className="mt-3 space-y-2.5">
        {block.fields.map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-[9px] font-bold">{field.label}{field.required ? " *" : ""}</span>
            {field.input_type === "select" ? (
              <select required={field.required} value={values[field.name] || ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[11px] outline-none focus:border-amber-400">
                <option value="">{field.placeholder || "Chọn một giá trị"}</option>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : field.input_type === "textarea" ? (
              <textarea required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="min-h-20 w-full resize-y rounded-lg border border-border bg-background px-2.5 py-2 text-[11px] outline-none focus:border-amber-400" />
            ) : (
              <input type={field.input_type} required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => setValues((current) => ({ ...current, [field.name]: event.target.value }))} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[11px] outline-none focus:border-amber-400" />
            )}
          </label>
        ))}
        <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#FDD239] px-3 text-[11px] font-bold text-slate-950 hover:bg-[#f5c923]">{block.submit_label}<ArrowUp className="size-3.5" /></button>
      </div>
    </form>
  );
}

function BlockHeading({ icon, block }: { icon?: React.ReactNode; block: UIBlock }) {
  if (!block.title && !block.description) return null;
  return <div className="flex gap-2.5 px-3.5 py-3">{icon && <div className="mt-0.5 text-amber-600">{icon}</div>}<div><p className="text-[11px] font-bold">{block.title}</p>{block.description && <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{block.description}</p>}</div></div>;
}
