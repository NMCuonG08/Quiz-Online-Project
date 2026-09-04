"use client";

import { FormEvent, KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowUp,
  BarChart3,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  Info,
  List,
  MessageCircle,
  Maximize2,
  Minimize2,
  RotateCcw,
  History,
  Clock3,
  RefreshCw,
  Sparkles,
  Square,
  Table2,
  X,
  SlidersHorizontal,
} from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppDispatch, useAppSelector } from "@/hooks/useRedux";
import { useLocalizedRouter } from "@/common/hooks/useLocalizedRouter";
import { useCopyToClipboard } from "@/modules/client/room-quiz/hooks/useCopyToClipboard";
import { forceLogout, tokenRefreshed } from "@/modules/auth/common/slices/authSlice";
import { cn } from "@/lib/utils";
import { apiClient } from "@/lib/api";
import { AgentStreamError, streamAgentChat } from "../services/agent-stream.service";
import {
  cancelAgentRun,
  enqueueAgentRun,
  getAgentRun,
  type AgentRun,
  type BackgroundRun,
} from "../services/agent-control.service";
import type { AgentStreamEvent, ChatAction, ChatFormSubmission, ChatMessage, ChatRole, ChatScope, GraphTraceStep, UIBlock, UISurface } from "../types";
import AgentControlCenter from "./AgentControlCenter";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "Chào bạn, mình là Quiz AI. Hãy mô tả điều bạn muốn làm; mình sẽ hỏi thêm khi thiếu thông tin và thao tác trực tiếp trên hệ thống khi đã đủ dữ liệu.",
  createdAt: 0,
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function selectedQuizIdFromPathname(pathname: string | null): string | undefined {
  if (!pathname) return undefined;
  const match = pathname.match(/\/questions\/([^/]+)/i);
  return match?.[1] ? decodeURIComponent(match[1]) : undefined;
}

function questionFormValidationError(block: UIBlock, values: Record<string, string>): string | null {
  const fieldNames = new Set(block.fields.map((field) => field.name));
  if (!fieldNames.has("question_text") || !fieldNames.has("question_type") || !fieldNames.has("options")) {
    return null;
  }
  const questionType = (values.question_type || "").trim().toUpperCase();
  if (!questionType || !values.question_text?.trim()) return null;
  const raw = values.options?.trim() || "";
  let optionCount = 0;
  let correctCount = 0;
  try {
    const decoded: unknown = JSON.parse(raw);
    if (Array.isArray(decoded)) {
      optionCount = decoded.filter((item) => typeof item === "object" && item !== null).length;
      correctCount = decoded.filter((item) => asRecord(item).is_correct === true).length;
    }
  } catch {
    const lines = raw.split("\n").map((line) => line.trim()).filter(Boolean);
    optionCount = lines.filter((line) => !/^(?:đáp án đúng|đap an dung|correct)\s*:/i.test(line)).length;
    correctCount = lines.filter((line) => /^(?:\*|\[x\]|đúng\s*[:.)-])/i.test(line)).length;
    const correctLine = lines.find((line) => /^(?:đáp án đúng|đap an dung|correct)\s*:/i.test(line));
    if (correctLine) correctCount = Math.max(correctCount, 1);
  }
  if (["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "MATCHING"].includes(questionType) && optionCount < 2) {
    return "Cần nhập ít nhất 2 đáp án, mỗi đáp án một dòng.";
  }
  if (["SINGLE_CHOICE", "TRUE_FALSE"].includes(questionType) && correctCount !== 1) {
    return "Hãy đánh dấu đúng 1 đáp án bằng dấu * ở đầu dòng.";
  }
  if (questionType === "MULTIPLE_CHOICE" && correctCount < 1) {
    return "Hãy đánh dấu ít nhất 1 đáp án đúng bằng dấu * ở đầu dòng.";
  }
  return null;
}

const TOOL_LABELS: Record<string, string> = {
  plan_interaction: "Hiểu yêu cầu",
  get_current_time: "Đọc thời gian hệ thống",
  get_current_user: "Kiểm tra tài khoản",
  get_my_permissions: "Kiểm tra quyền",
  search_quizzes: "Tìm quiz",
  recommend_quizzes: "Gợi ý quiz",
  get_quiz: "Đọc chi tiết quiz",
  list_categories: "Đọc danh mục",
  get_my_quizzes: "Đọc quiz của bạn",
  get_quiz_history: "Đọc lịch sử làm bài",
  get_in_progress_quizzes: "Đọc quiz đang làm",
  get_all_attempts: "Đọc tiến độ học",
  get_quiz_result: "Đọc kết quả quiz",
  search_knowledge: "Tìm nguồn kiến thức",
  web_search: "Tìm kiếm trên web",
  search_images: "Tìm ảnh minh họa",
  create_quiz: "Tạo quiz",
  create_quiz_with_questions: "Tạo quiz hoàn chỉnh",
  update_quiz: "Cập nhật quiz",
  delete_quiz: "Xóa quiz",
  publish_quiz: "Xuất bản quiz",
  unpublish_quiz: "Gỡ xuất bản quiz",
  create_question: "Tạo câu hỏi",
  update_question: "Cập nhật câu hỏi",
  delete_question: "Xóa câu hỏi",
  list_questions: "Đọc danh sách câu hỏi",
  get_quiz_build_status: "Kiểm tra quiz",
  duplicate_question: "Sao chép câu hỏi",
  reorder_questions: "Sắp xếp câu hỏi",
  start_quiz: "Bắt đầu quiz",
  list_knowledge_sources: "Đọc nguồn kiến thức",
  import_knowledge_url: "Nhập nguồn kiến thức",
  submit_knowledge_review: "Gửi duyệt nguồn",
  review_knowledge: "Duyệt nguồn kiến thức",
  create_category: "Tạo danh mục",
  update_category: "Cập nhật danh mục",
  delete_category: "Xóa danh mục",
  get_admin_dashboard_stats: "Đọc thống kê quản trị",
  list_audit_events: "Đọc nhật ký hệ thống",
  render_ui: "Chuẩn bị giao diện",
};

function toolLabel(tool: string) {
  return TOOL_LABELS[tool] || tool.replaceAll("_", " ");
}

type PersistedMessage = {
  id: string;
  role: ChatRole;
  content: string;
  created_at: string;
  metadata?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function normalizeTraceStep(value: unknown): GraphTraceStep | null {
  const raw = asRecord(value);
  const payload = asRecord(raw.payload);
  const read = (key: string) => raw[key] ?? payload[key];
  const node = read("node");
  const event = read("event");
  if (typeof node !== "string" && typeof event !== "string") return null;
  const traceId = read("trace_id") ?? read("run_id");
  const tool = read("tool");
  return {
    trace_id: typeof traceId === "string" ? traceId : "",
    node: typeof node === "string" && node ? node : "unknown",
    event: typeof event === "string" && event ? event : "event",
    ...(typeof tool === "string" && tool ? { tool } : {}),
  };
}

function isUISurface(value: unknown): value is UISurface {
  const surface = asRecord(value);
  if (!Array.isArray(surface.blocks) || !Array.isArray(surface.actions)) return false;
  const validBlockTypes = new Set(["notice", "list", "table", "stats", "form"]);
  const validTones = new Set(["neutral", "info", "success", "warning", "danger"]);
  const validActionKinds = new Set(["navigate", "prompt", "approve"]);
  return surface.blocks.every((item) => {
    const block = asRecord(item);
    return typeof block.id === "string"
      && typeof block.type === "string"
      && validBlockTypes.has(block.type)
      && typeof block.title === "string"
      && typeof block.description === "string"
      && typeof block.tone === "string"
      && validTones.has(block.tone)
      && Array.isArray(block.items)
      && block.items.every((entry) => {
        const item = asRecord(entry);
        const imageUrl = item.image_url;
        return typeof item.label === "string"
          && (imageUrl === undefined || imageUrl === null || (typeof imageUrl === "string" && /^(https?:\/\/|\/)/i.test(imageUrl)))
          && (item.image_alt === undefined || item.image_alt === null || typeof item.image_alt === "string");
      })
      && Array.isArray(block.columns)
      && block.columns.every((entry) => typeof entry === "string")
      && Array.isArray(block.rows)
      && block.rows.every((row) => Array.isArray(row) && row.every((cell) => typeof cell === "string"))
      && Array.isArray(block.stats)
      && block.stats.every((entry) => {
        const stat = asRecord(entry);
        return typeof stat.label === "string" && typeof stat.value === "string";
      })
      && Array.isArray(block.fields)
      && block.fields.every((entry) => {
        const field = asRecord(entry);
        return typeof field.name === "string"
          && typeof field.label === "string"
          && Array.isArray(field.options)
          && field.options.every((option) => typeof option === "string");
      });
  }) && surface.actions.every((item) => {
    const action = asRecord(item);
    return typeof action.id === "string"
      && typeof action.label === "string"
      && typeof action.kind === "string"
      && validActionKinds.has(action.kind)
      && typeof action.value === "string"
      && (action.kind !== "navigate" || action.value.startsWith("/"));
  });
}

function disableApproval(surface: UISurface, resolvedTokens: Map<string, boolean>, expiresAt?: string): UISurface {
  const expired = Boolean(expiresAt && Date.parse(expiresAt) <= Date.now());
  return {
    ...surface,
    actions: surface.actions.map((action) => {
      if (action.kind !== "approve") return action;
      const resolved = resolvedTokens.has(action.value);
      if (!resolved && !expired) return action;
      return {
        ...action,
        disabled: true,
        label: resolved
          ? resolvedTokens.get(action.value) ? "Đã thực hiện" : "Đã thất bại"
          : "Đã hết hạn",
      };
    }),
  };
}

function hydrateHistoryMessages(items: PersistedMessage[]): ChatMessage[] {
  const resolvedTokens = new Map<string, boolean>();
  items.forEach((item) => {
    const metadata = asRecord(item.metadata);
    if (typeof metadata.resolved_approval_token === "string") {
      resolvedTokens.set(
        metadata.resolved_approval_token,
        metadata.approval_succeeded === true
          || (metadata.approval_succeeded === undefined && metadata.error !== true),
      );
    }
  });
  const orderedItems = items
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const leftTime = Date.parse(left.item.created_at);
      const rightTime = Date.parse(right.item.created_at);
      if (leftTime !== rightTime) return leftTime - rightTime;
      if (left.item.role !== right.item.role) return left.item.role === "user" ? -1 : 1;
      return left.index - right.index;
    })
    .map(({ item }) => item);
  return orderedItems.map((item) => {
    const metadata = asRecord(item.metadata);
    const rawSurface = metadata.surface;
    const surface = isUISurface(rawSurface)
      ? disableApproval(
          rawSurface,
          resolvedTokens,
          typeof metadata.approval_expires_at === "string" ? metadata.approval_expires_at : undefined,
        )
      : undefined;
    return {
      id: item.id,
      role: item.role,
      content: item.content,
      createdAt: Date.parse(item.created_at),
      agent: typeof metadata.agent === "string" ? metadata.agent : undefined,
      tool: typeof metadata.tool === "string" ? metadata.tool : undefined,
      surface,
      citations: Array.isArray(metadata.citations) ? metadata.citations as ChatMessage["citations"] : undefined,
      traceId: typeof metadata.trace_id === "string" ? metadata.trace_id : undefined,
      traceSteps: Array.isArray(metadata.trace_steps)
        ? metadata.trace_steps.map(normalizeTraceStep).filter((step): step is GraphTraceStep => Boolean(step))
        : undefined,
      error: metadata.error === true,
    };
  });
}

export default function QuizAIChat() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [unread, setUnread] = useState(false);
  const [sessionId, setSessionId] = useState<string>();
  const [historyOpen, setHistoryOpen] = useState(false);
  const [history, setHistory] = useState<Array<{ session_id: string; title: string; updated_at: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyUnavailable, setHistoryUnavailable] = useState(false);
  const [backgroundRun, setBackgroundRun] = useState<BackgroundRun | null>(null);
  const [backgroundStatus, setBackgroundStatus] = useState<string | null>(null);
  const [backgroundError, setBackgroundError] = useState<string | null>(null);
  const [backgroundBusy, setBackgroundBusy] = useState(false);
  const [controlCenterOpen, setControlCenterOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const locale = useLocale();
  const pathname = usePathname();
  const router = useLocalizedRouter();
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const user = auth.user;
  const principalKey = user?.id ? `user:${user.id}` : "unauthenticated";
  const sessionStorageKey = `quiz_ai_session_id:${principalKey}`;

  useEffect(() => {
    if (!backgroundRun?.run_id) return;

    let active = true;
    const terminalStatuses = new Set(["completed", "failed", "cancelled", "expired"]);
    const poll = async () => {
      try {
        const response = await getAgentRun(backgroundRun.run_id);
        if (!active) return;
        const run = response.run as AgentRun;
        setBackgroundStatus(run.status);
        if (terminalStatuses.has(run.status)) {
          setBackgroundBusy(false);
        }
      } catch (error: unknown) {
        if (active) {
          setBackgroundError(error instanceof Error ? error.message : "Không đọc được trạng thái run nền.");
          setBackgroundBusy(false);
        }
      }
    };

    void poll();
    const timer = window.setInterval(() => {
      if (!terminalStatuses.has(backgroundStatus || "")) void poll();
    }, 2500);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [backgroundRun?.run_id, backgroundStatus]);
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
    const token = localStorage.getItem("auth_token");
    if (!user?.id || !token) return;
    const controller = new AbortController();
    setHistoryLoading(true);
    void (async () => {
      try {
        let targetSessionId = storedSessionId;
        let conversationResponse: { status: number; data: unknown } | null = null;
        if (targetSessionId) {
          conversationResponse = await apiClient.get(
            `/api/ai-chat/conversations/${targetSessionId}`,
            { signal: controller.signal, validateStatus: (status) => status < 500 },
          );
        }

        // A new login, cleared storage, or an expired session should recover
        // the latest conversation instead of leaving the chat at welcome.
        if (!conversationResponse || conversationResponse.status === 404) {
          const listResponse = await apiClient.get(
            "/api/ai-chat/conversations",
            { signal: controller.signal },
          );
          const listEnvelope = asRecord(listResponse.data);
          const conversations = Array.isArray(listEnvelope.data)
            ? listEnvelope.data as Array<{ session_id: string; title: string; updated_at: string }>
            : [];
          if (!conversations.length) return;
          setHistory(conversations);
          targetSessionId = conversations[0].session_id;
          conversationResponse = await apiClient.get(
            `/api/ai-chat/conversations/${targetSessionId}`,
            { signal: controller.signal },
          );
        }

        const envelope = asRecord(conversationResponse.data);
        const conversation = asRecord(envelope.data);
        const restoredMessages = hydrateHistoryMessages(
          Array.isArray(conversation.messages) ? conversation.messages as PersistedMessage[] : [],
        );
        if (!controller.signal.aborted && targetSessionId && restoredMessages.length) {
          localStorage.setItem(sessionStorageKey, targetSessionId);
          setSessionId(targetSessionId);
          setMessages(restoredMessages);
        }
        setHistoryUnavailable(false);
      } catch (error: unknown) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setHistoryUnavailable(true);
        }
      } finally {
        if (!controller.signal.aborted) setHistoryLoading(false);
      }
    })();
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
    try {
      const response = await apiClient.get("/api/ai-chat/conversations");
      const payload = asRecord(response.data);
      const conversations = Array.isArray(payload.data)
        ? payload.data as Array<{ session_id: string; title: string; updated_at: string }>
        : [];
      setHistory(conversations);
      setHistoryUnavailable(false);
    } catch {
      setHistoryUnavailable(true);
    }
  }, []);

  const openHistoryConversation = async (targetSessionId: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      const response = await apiClient.get(`/api/ai-chat/conversations/${targetSessionId}`);
      const payload = asRecord(response.data);
      const conversation = asRecord(payload.data);
      setSessionId(targetSessionId);
      localStorage.setItem(sessionStorageKey, targetSessionId);
      setMessages(hydrateHistoryMessages(
        Array.isArray(conversation.messages) ? conversation.messages as PersistedMessage[] : [],
      ));
      setHistoryOpen(false);
      setHistoryUnavailable(false);
    } catch {
      setHistoryUnavailable(true);
    }
  };

  const deleteHistoryConversation = async (targetSessionId: string) => {
    const token = localStorage.getItem("auth_token");
    if (!token) return;
    try {
      await apiClient.delete(`/api/ai-chat/conversations/${targetSessionId}`);
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
      const traceStep = normalizeTraceStep(event);
      if (traceStep) {
        patchAssistant(messageId, (message) => ({
          traceId: event.trace_id,
          traceSteps: [...(message.traceSteps || []), traceStep],
        }));
      }
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

  const sendMessage = async (
    rawMessage?: string,
    hideUserMessage = false,
    backendMessage?: string,
    formSubmission?: ChatFormSubmission,
  ) => {
    if (!auth.isAuthenticated || !auth.token || !user?.id) return;
    const value = (rawMessage ?? input).trim();
    const requestValue = (backendMessage ?? value).trim();
    if (!value || !requestValue || isStreaming) return;

    setInput("");
    setIsStreaming(true);
    const assistantId = uid("assistant");
    setMessages((current) => [
      ...current,
      ...(!hideUserMessage ? [{ id: uid("user"), role: "user" as const, content: value, createdAt: Date.now() }] : []),
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
    let approvalFinished = false;
    let approvalCompleted = false;
    try {
      await streamAgentChat({
        message: requestValue,
        userId: user.id,
        sessionId,
        locale,
        scope,
        context: {
          route: pathname || "/",
          selected_quiz_id: selectedQuizIdFromPathname(pathname),
        },
        formSubmission,
        signal: controller.signal,
        accessToken: auth.token,
        onTokenRefreshed: (token) => dispatch(tokenRefreshed(token)),
        onEvent: (event) => {
          if (event.type === "done" && event.intent === "approved_write") {
            approvalFinished = true;
            approvalCompleted = true;
          }
          if (event.type === "error") approvalFinished = true;
          onAgentEvent(assistantId, event);
        },
      });
      patchAssistant(assistantId, { isStreaming: false, status: undefined });
      if (approvalFinished && hideUserMessage) {
        const resolvedToken = requestValue.slice("__approve__:".length);
        setMessages((current) => current.map((message) => message.surface
          ? { ...message, surface: disableApproval(message.surface, new Map([[resolvedToken, approvalCompleted]])) }
          : message));
      }
      if (!open) setUnread(true);
    } catch (error: unknown) {
      const streamError = error instanceof AgentStreamError ? error : null;
      if (streamError?.status === 401) dispatch(forceLogout());
      patchAssistant(assistantId, {
        content: controller.signal.aborted
          ? "Đã dừng phản hồi."
          : streamError?.message || "Không kết nối được AI Agent Server.",
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
      if (action.disabled) return;
      void sendMessage("__approve__:" + action.value, true);
    } else if (action.kind === "navigate") {
      if (!action.value.startsWith("/")) return;
      setOpen(false);
      router.push(action.value);
    } else if (action.id === "auto_generate_quiz") {
      void sendMessage("Tự sinh quiz bằng AI theo yêu cầu trước đó");
    } else if (action.kind === "prompt" && action.id === "add_question") {
      // Legacy question cards exposed a prompt button next to the form. The
      // form itself is now the only submission surface; never re-enter chat.
      return;
    } else if (action.kind === "prompt" && action.value.startsWith("__confirm_action__:")) {
      void sendMessage("Xác nhận xóa", false, action.value);
    } else if (action.kind === "prompt" && /^Xác nhận xóa\s+(quiz|câu hỏi|category)\s+/i.test(action.value)) {
      // Legacy history cards stored a plain prompt before confirmation
      // tokens existed. Convert those cards to the same structured fast path
      // so clicking an old button also skips planner reclassification.
      const match = action.value.match(/^Xác nhận xóa\s+(quiz|câu hỏi|category)\s+(.+)$/i);
      const resource = match?.[1]?.toLowerCase();
      const label = match?.[2]?.trim();
      if (resource && label) {
        const intent = resource === "quiz" ? "quiz_delete" : resource === "câu hỏi" ? "question_delete" : "category_delete";
        const entities = resource === "quiz"
          ? { title: label }
          : resource === "câu hỏi"
            ? { question_id: label }
            : { category_id: label };
        const plan = {
          intent,
          confidence: 1,
          ambiguity: "none",
          needs_clarification: false,
          risk: "destructive",
          route: "tool",
          dialogue_act: "confirmation",
          reference_mode: "pending_workflow",
          refers_to_previous_turn: true,
          selection_strategy: "exact",
          resource,
          operation: "delete",
          entities,
          missing_fields: [],
        };
        void sendMessage(
          "Xác nhận xóa",
          false,
          "__fast_form__:" + JSON.stringify({ display_message: "Xác nhận xóa", plan }),
        );
      }
    } else {
      void sendMessage(action.value);
    }
  };

  const submitStructuredForm = (block: UIBlock, values: Record<string, string>) => {
    const details = block.fields
      .map((field) => `${field.label}: ${values[field.name] || ""}`)
      .join("\n");
    const displayMessage = `${block.submit_prompt}\n${details}`.trim();
    void sendMessage(
      displayMessage,
      false,
      undefined,
      { form_id: block.id, submission_id: uid("form"), values },
    );
  };

  const resetChat = () => {
    abortRef.current?.abort();
    localStorage.removeItem(sessionStorageKey);
    setSessionId(undefined);
    setMessages([WELCOME_MESSAGE]);
    setInput("");
  };

  const startBackgroundRun = async () => {
    if (!auth.token || !user?.id || !input.trim() || backgroundBusy || isStreaming) return;
    setBackgroundBusy(true);
    setBackgroundError(null);
    setBackgroundStatus("queued");
    try {
      const run = await enqueueAgentRun({
        message: input.trim(),
        session_id: sessionId,
        locale,
        scope,
        context: { route: pathname || "/", source: "quiz-ai-chat" },
      });
      setBackgroundRun(run);
      setInput("");
    } catch (error: unknown) {
      setBackgroundBusy(false);
      setBackgroundError(error instanceof Error ? error.message : "Không xếp được tác vụ nền.");
    }
  };

  const stopBackgroundRun = async () => {
    if (!backgroundRun?.run_id) return;
    try {
      await cancelAgentRun(backgroundRun.run_id);
      setBackgroundStatus("cancel_requested");
    } catch (error: unknown) {
      setBackgroundError(error instanceof Error ? error.message : "Không thể hủy tác vụ nền.");
    }
  };

  if (!auth.isAuthenticated || !auth.token || !user?.id) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[99990] sm:bottom-6 sm:right-6">
      {open && (
        <section
          className={cn(
            "flex flex-col overflow-hidden rounded-[24px] border border-border/80 bg-background shadow-2xl shadow-black/15",
            expanded
              ? "fixed inset-2 z-[99991] mb-0 h-[calc(100dvh-1rem)] w-[calc(100vw-1rem)] sm:inset-6 sm:h-[calc(100dvh-3rem)] sm:w-[calc(100vw-3rem)]"
              : "mb-3 h-[calc(100dvh-6.5rem)] w-[calc(100vw-2rem)] sm:h-[min(680px,calc(100dvh-6.5rem))] sm:w-[430px]",
          )}
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
            <button onClick={() => setControlCenterOpen((value) => !value)} className={cn("grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground", controlCenterOpen && "bg-amber-400/15 text-amber-700")} aria-label="Mở trung tâm điều khiển agent" aria-pressed={controlCenterOpen}>
              <SlidersHorizontal className="size-4" />
            </button>
            <button onClick={() => setExpanded((value) => !value)} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={expanded ? "Thu về khung nhỏ" : "Mở chat toàn màn hình"} aria-pressed={expanded}>
              {expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
            </button>
            <button onClick={() => { setExpanded(false); setOpen(false); }} className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Thu nhỏ chat">
              <X className="size-4" />
            </button>
          </header>
          {historyOpen && (
            <div className="max-h-44 overflow-y-auto border-b border-border bg-background p-2">
              {historyUnavailable ? (
                <div className="px-2 py-3 text-xs text-amber-600">
                  <p>Không tải được lịch sử chat. Có thể do kết nối, phiên đăng nhập hoặc địa chỉ API.</p>
                  <button type="button" onClick={() => void loadHistory()} className="mt-1 font-semibold underline underline-offset-2 hover:no-underline">
                    Thử tải lại
                  </button>
                </div>
              ) : history.length ? history.map((item) => (
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
              )) : <p className="px-2 py-3 text-xs text-muted-foreground">Chưa có lịch sử chat.</p>}
            </div>
          )}

          <AgentControlCenter
            open={controlCenterOpen}
            run={backgroundRun}
            runStatus={backgroundStatus}
            scope={scope}
          />

          <div ref={scrollRef} className="flex-1 space-y-5 overflow-y-auto bg-muted/20 px-4 py-5" aria-live="polite">
            {historyLoading && <p className="text-center text-[10px] text-muted-foreground">Đang tải lịch sử cuộc trò chuyện...</p>}
            {messages.map((message, index) => {
              const retryPrompt = message.error
                ? [...messages.slice(0, index)].reverse().find((item) => item.role === "user")?.content
                : undefined;
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  retryPrompt={retryPrompt}
                  onRetry={retryPrompt ? (prompt) => void sendMessage(prompt) : undefined}
                  onAction={handleAction}
                  onFormSubmit={submitStructuredForm}
                />
              );
            })}
          </div>

          <div className="border-t border-border/70 bg-background px-3 pb-3 pt-2.5">
            {(backgroundRun || backgroundError) && (
              <div className="mb-2 rounded-xl border border-border bg-muted/30 px-3 py-2 text-[10px]">
                <div className="flex items-center gap-2">
                  {backgroundBusy ? <RefreshCw className="size-3.5 animate-spin text-amber-600" /> : <Clock3 className="size-3.5 text-muted-foreground" />}
                  <span className="min-w-0 flex-1 truncate">
                    {backgroundError || `Tác vụ nền: ${backgroundStatus || backgroundRun?.status || "queued"}`}
                  </span>
                  {backgroundBusy && <button type="button" onClick={() => void stopBackgroundRun()} className="font-bold text-red-600 hover:underline">Hủy</button>}
                </div>
                {backgroundRun?.run_id && <p className="mt-1 truncate font-mono text-[9px] text-muted-foreground">run · {backgroundRun.run_id}</p>}
              </div>
            )}
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
                <>
                  <button type="button" onClick={() => void startBackgroundRun()} disabled={!input.trim() || backgroundBusy} className="grid size-9 shrink-0 place-items-center rounded-xl border border-border bg-background text-muted-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40" aria-label="Chạy tác vụ nền" title="Chạy tác vụ nền">
                    <Clock3 className="size-4" />
                  </button>
                  <button type="submit" disabled={!input.trim()} className="grid size-9 shrink-0 place-items-center rounded-xl bg-[#FDD239] text-slate-950 shadow-sm hover:bg-[#f5c923] disabled:cursor-not-allowed disabled:opacity-40" aria-label="Gửi tin nhắn">
                    <ArrowUp className="size-4" />
                  </button>
                </>
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
  retryPrompt,
  onRetry,
  onAction,
  onFormSubmit,
}: {
  message: ChatMessage;
  retryPrompt?: string;
  onRetry?: (prompt: string) => void;
  onAction: (action: ChatAction) => void;
  onFormSubmit: (block: UIBlock, values: Record<string, string>) => void;
}) {
  const assistant = message.role === "assistant";
  const { copied, copyToClipboard } = useCopyToClipboard();
  return (
    <div className={cn("flex gap-2.5", !assistant && "justify-end")}>
      {assistant && (
        <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-xl bg-[#FDD239] text-slate-950">
          <Bot className="size-4" />
        </div>
      )}
      <div className={cn("max-w-[88%]", !assistant && "flex flex-col items-end")}>
        {assistant && message.tool && (
          <span className="mb-1.5 inline-flex rounded-full bg-violet-500/10 px-2 py-1 text-[9px] font-semibold text-violet-600 dark:text-violet-300">Tác vụ · {toolLabel(message.tool)}</span>
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
        {assistant && message.error && retryPrompt && !message.isStreaming && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => void copyToClipboard(retryPrompt)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2 py-1 text-[10px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
              title="Sao chép prompt lỗi"
            >
              {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
              {copied ? "Đã copy prompt" : "Copy prompt"}
            </button>
            <button
              type="button"
              onClick={() => onRetry?.(retryPrompt)}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-400/20 px-2 py-1 text-[10px] font-semibold text-amber-800 hover:bg-amber-400/35 dark:text-amber-200"
              title="Chạy lại prompt lỗi"
            >
              <RefreshCw className="size-3" />
              Chạy lại
            </button>
          </div>
        )}
        {message.surface && <DynamicSurface surface={message.surface} onAction={onAction} onFormSubmit={onFormSubmit} />}
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
              {message.traceSteps?.length ? message.traceSteps.map((step, index) => (
                <li key={`${step.node}-${step.event}-${step.tool || ""}-${index}`}>
                  {step.node} → {step.event}{step.tool ? ` · ${step.tool}` : ""}
                </li>
              )) : <li>Chưa có chi tiết trace.</li>}
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
  onFormSubmit,
}: {
  surface: UISurface;
  onAction: (action: ChatAction) => void;
  onFormSubmit: (block: UIBlock, values: Record<string, string>) => void;
}) {
  const isQuestionForm = surface.blocks.some((block) =>
    block.fields.some((field) => field.name === "question_text"),
  );
  const actions = isQuestionForm
    ? surface.actions.filter((action) => action.id !== "add_question")
    : surface.actions;
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
          <DynamicBlock key={block.id} block={block} onFormSubmit={onFormSubmit} />
        ))}
      </div>
      {!!actions.length && (
        <div className="flex flex-wrap gap-2 border-t border-border p-3">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onAction(action)}
              disabled={action.disabled}
              className={cn(
                "inline-flex min-h-9 items-center gap-1.5 rounded-xl border px-3 py-2 text-[11px] font-bold disabled:cursor-not-allowed disabled:border-border disabled:bg-muted disabled:text-muted-foreground",
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

function DynamicBlock({
  block,
  onFormSubmit,
}: {
  block: UIBlock;
  onFormSubmit: (block: UIBlock, values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const toneIcon = block.tone === "success"
    ? <CheckCircle2 className="size-4 text-emerald-500" />
    : block.tone === "warning" || block.tone === "danger"
      ? <AlertTriangle className="size-4 text-amber-500" />
      : <Info className="size-4 text-blue-500" />;

  const submitForm = (event: FormEvent) => {
    event.preventDefault();
    const validationError = questionFormValidationError(block, values);
    if (validationError) {
      setFormError(validationError);
      return;
    }
    setFormError(null);
    onFormSubmit(block, values);
  };

  if (block.type === "notice") {
    return <div className="flex gap-2.5 p-3.5">{toneIcon}<div><p className="text-[11px] font-bold">{block.title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{block.description}</p></div></div>;
  }

  if (block.type === "list") {
    return <div><BlockHeading icon={<List className="size-4" />} block={block} /><div className="divide-y divide-border">{block.items.map((item, index) => <div key={`${item.label}-${index}`} className="flex items-start justify-between gap-3 px-3.5 py-2.5"><div className="flex min-w-0 items-start gap-2"><div className="min-w-0">{item.image_url && <img src={item.image_url} alt={item.image_alt || item.label} className="mb-1.5 h-20 w-20 rounded-lg object-cover" loading="lazy" referrerPolicy="no-referrer" />}<p className="text-[10px] font-bold">{item.label}</p>{item.description && <p className="mt-0.5 text-[9px] text-muted-foreground">{item.description}</p>}</div></div><div className="shrink-0 text-right">{item.value && <p className="text-[10px] font-semibold">{item.value}</p>}{item.badge && <span className="rounded-md bg-muted px-1.5 py-0.5 text-[8px] font-bold">{item.badge}</span>}</div></div>)}</div></div>;
  }

  if (block.type === "table") {
    return <div><BlockHeading icon={<Table2 className="size-4" />} block={block} /><div className="overflow-x-auto"><table className="w-full text-left text-[9px]"><thead className="bg-muted/70 text-muted-foreground"><tr>{block.columns.map((column) => <th key={column} className="whitespace-nowrap px-3 py-2 font-bold">{column}</th>)}</tr></thead><tbody className="divide-y divide-border">{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex} className="max-w-40 truncate px-3 py-2">{cell}</td>)}</tr>)}</tbody></table></div></div>;
  }

  if (block.type === "stats") {
    return <div><BlockHeading icon={<BarChart3 className="size-4" />} block={block} /><div className="grid grid-cols-2 gap-px bg-border">{block.stats.map((stat) => <div key={stat.label} className="bg-background p-3"><p className="text-lg font-black">{stat.value}</p><p className="text-[9px] text-muted-foreground">{stat.label}</p>{stat.trend && <p className="mt-1 text-[8px] font-semibold text-emerald-600">{stat.trend}</p>}</div>)}</div></div>;
  }

  if (block.fields.some((field) => field.name === "question_text")) {
    return <QuestionForm block={block} onFormSubmit={onFormSubmit} />;
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
        {formError && <p role="alert" className="text-[10px] font-semibold text-red-600">{formError}</p>}
        <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#FDD239] px-3 text-[11px] font-bold text-slate-950 hover:bg-[#f5c923]">{block.submit_label}<ArrowUp className="size-3.5" /></button>
      </div>
    </form>
  );
}

type QuestionOptionDraft = { text: string; correct: boolean };

function QuestionForm({
  block,
  onFormSubmit,
}: {
  block: UIBlock;
  onFormSubmit: (block: UIBlock, values: Record<string, string>) => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [options, setOptions] = useState<QuestionOptionDraft[]>([
    { text: "", correct: false },
    { text: "", correct: false },
  ]);
  const [formError, setFormError] = useState<string | null>(null);
  const questionType = (values.question_type || "").toUpperCase();
  const needsOptions = ["SINGLE_CHOICE", "MULTIPLE_CHOICE", "TRUE_FALSE", "MATCHING"].includes(questionType);
  const singleCorrect = questionType === "SINGLE_CHOICE" || questionType === "TRUE_FALSE";

  const updateValue = (name: string, value: string) => {
    setValues((current) => ({ ...current, [name]: value }));
    if (name === "question_type") {
      setFormError(null);
      if (value === "TRUE_FALSE") {
        setOptions([
          { text: "Đúng", correct: false },
          { text: "Sai", correct: false },
        ]);
      } else if (value === "ESSAY" || value === "FILL_BLANK") {
        setOptions([]);
      } else if (options.length < 2) {
        setOptions([
          ...options,
          ...Array.from({ length: 2 - options.length }, () => ({ text: "", correct: false })),
        ]);
      }
    }
  };

  const updateOption = (index: number, patch: Partial<QuestionOptionDraft>) => {
    setOptions((current) => current.map((option, optionIndex) =>
      optionIndex === index ? { ...option, ...patch } : option,
    ));
    setFormError(null);
  };

  const markCorrect = (index: number) => {
    setOptions((current) => current.map((option, optionIndex) => ({
      ...option,
      correct: singleCorrect ? optionIndex === index : optionIndex === index ? !option.correct : option.correct,
    })));
    setFormError(null);
  };

  const submitQuestionForm = (event: FormEvent) => {
    event.preventDefault();
    const questionText = (values.question_text || "").trim();
    const filledOptions = options
      .map((option, index) => ({
        option_text: option.text.trim(),
        is_correct: option.correct,
        sort_order: index,
      }))
      .filter((option) => option.option_text);

    if (!questionText) {
      setFormError("Hãy nhập nội dung câu hỏi.");
      return;
    }
    if (!questionType) {
      setFormError("Hãy chọn loại câu hỏi.");
      return;
    }
    if (needsOptions && filledOptions.length < 2) {
      setFormError("Hãy nhập ít nhất 2 đáp án ở các ô bên dưới.");
      return;
    }
    const correctCount = filledOptions.filter((option) => option.is_correct).length;
    if (singleCorrect && correctCount !== 1) {
      setFormError("Hãy chọn đúng 1 đáp án đúng.");
      return;
    }
    if (questionType === "MULTIPLE_CHOICE" && correctCount < 1) {
      setFormError("Hãy chọn ít nhất 1 đáp án đúng.");
      return;
    }
    setFormError(null);
    onFormSubmit(block, {
      ...values,
      options: JSON.stringify(filledOptions),
    });
  };

  return (
    <form onSubmit={submitQuestionForm} className="p-3.5">
      <BlockHeading block={block} />
      <div className="mt-3 space-y-3">
        {block.fields.filter((field) => field.name !== "options").map((field) => (
          <label key={field.name} className="block">
            <span className="mb-1 block text-[9px] font-bold">{field.label}{field.required ? " *" : ""}</span>
            {field.input_type === "select" ? (
              <select required={field.required} value={values[field.name] || ""} onChange={(event) => updateValue(field.name, event.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[11px] outline-none focus:border-amber-400">
                <option value="">{field.placeholder || "Chọn một giá trị"}</option>
                {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
              </select>
            ) : field.name === "question_text" || field.input_type === "textarea" ? (
              <textarea required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => updateValue(field.name, event.target.value)} className="min-h-24 w-full resize-y rounded-lg border border-border bg-background px-2.5 py-2 text-[11px] outline-none focus:border-amber-400" />
            ) : (
              <input type={field.input_type} required={field.required} placeholder={field.placeholder} value={values[field.name] || ""} onChange={(event) => updateValue(field.name, event.target.value)} className="h-9 w-full rounded-lg border border-border bg-background px-2.5 text-[11px] outline-none focus:border-amber-400" />
            )}
          </label>
        ))}

        {needsOptions && (
          <div className="rounded-xl border border-border bg-muted/20 p-2.5">
            <div className="mb-2 flex items-center justify-between gap-2">
              <div>
                <p className="text-[10px] font-bold">Đáp án</p>
                <p className="text-[9px] text-muted-foreground">{singleCorrect ? "Chọn 1 đáp án đúng." : "Có thể chọn nhiều đáp án đúng."}</p>
              </div>
              <button type="button" onClick={() => setOptions((current) => [...current, { text: "", correct: false }])} className="rounded-lg border border-border px-2 py-1 text-[9px] font-bold hover:bg-muted">+ Thêm đáp án</button>
            </div>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    type={singleCorrect ? "radio" : "checkbox"}
                    name={singleCorrect ? `${block.id}-correct` : `${block.id}-correct-${index}`}
                    checked={option.correct}
                    onChange={() => markCorrect(index)}
                    aria-label={`Đánh dấu đáp án ${index + 1} là đúng`}
                    className="size-4 accent-amber-500"
                  />
                  <input
                    type="text"
                    value={option.text}
                    onChange={(event) => updateOption(index, { text: event.target.value })}
                    placeholder={`Đáp án ${index + 1}`}
                    className="h-9 min-w-0 flex-1 rounded-lg border border-border bg-background px-2.5 text-[11px] outline-none focus:border-amber-400"
                  />
                  {options.length > 2 && <button type="button" onClick={() => setOptions((current) => current.filter((_, optionIndex) => optionIndex !== index))} className="rounded-lg px-2 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-red-600" aria-label={`Xóa đáp án ${index + 1}`}>×</button>}
                </div>
              ))}
            </div>
          </div>
        )}

        {formError && <p role="alert" className="text-[10px] font-semibold text-red-600">{formError}</p>}
        <button type="submit" className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[#FDD239] px-3 text-[11px] font-bold text-slate-950 hover:bg-[#f5c923]">{block.submit_label}<ArrowUp className="size-3.5" /></button>
      </div>
    </form>
  );
}

function BlockHeading({ icon, block }: { icon?: React.ReactNode; block: UIBlock }) {
  if (!block.title && !block.description) return null;
  return <div className="flex gap-2.5 px-3.5 py-3">{icon && <div className="mt-0.5 text-amber-600">{icon}</div>}<div><p className="text-[11px] font-bold">{block.title}</p>{block.description && <p className="mt-1 text-[9px] leading-4 text-muted-foreground">{block.description}</p>}</div></div>;
}
