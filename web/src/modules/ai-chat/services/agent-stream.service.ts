import type { AgentStreamEvent, ChatFormSubmission, ChatPageContext, ChatScope } from "../types";

interface StreamChatOptions {
  message: string;
  userId: string;
  sessionId?: string;
  locale?: string;
  scope: ChatScope;
  context: ChatPageContext;
  formSubmission?: ChatFormSubmission;
  signal?: AbortSignal;
  accessToken?: string | null;
  onTokenRefreshed?: (token: string) => void;
  onEvent: (event: AgentStreamEvent) => void;
}

const AGENT_URL = (process.env.NEXT_PUBLIC_AI_AGENT_URL || "/api/ai").replace(/\/$/, "");
const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3333").replace(/\/$/, "");
let refreshPromise: Promise<string | null> | null = null;

export class AgentStreamError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "AgentStreamError";
  }
}

async function refreshAccessToken(signal?: AbortSignal): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/refresh-cookie`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: "{}",
        signal,
      });
      if (!response.ok) return null;
      const payload = await response.json();
      const data = payload.data || payload;
      const token = data.accessToken || data.token;
      if (typeof token !== "string" || !token) return null;
      localStorage.setItem("auth_token", token);
      return token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

async function parseErrorMessage(response: Response): Promise<string> {
  try {
    const payload = await response.json();
    const detail = payload.detail || payload.error?.message || payload.message;
    if (typeof detail === "string" && detail) return detail;
  } catch {
    // Fall through to status-specific copy.
  }
  if (response.status === 401) return "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.";
  if (response.status === 403) return "Tài khoản không có quyền thực hiện yêu cầu này.";
  if (response.status === 429) return "Bạn gửi yêu cầu quá nhanh. Hãy thử lại sau một phút.";
  if (response.status === 503) return "AI Agent đang tạm thời chưa sẵn sàng.";
  return `AI Agent trả về lỗi ${response.status}.`;
}

async function openAgentStream(
  options: StreamChatOptions,
  token: string | null,
): Promise<Response> {
  return fetch(`${AGENT_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: "include",
    body: JSON.stringify({
      message: options.message,
      user_id: options.userId,
      session_id: options.sessionId,
      locale: options.locale || "vi",
      scope: options.scope,
      context: options.context,
      form_submission: options.formSubmission,
    }),
    signal: options.signal,
  });
}

function parseEventBlock(block: string): AgentStreamEvent | null {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) return null;
  try {
    return JSON.parse(data) as AgentStreamEvent;
  } catch {
    return null;
  }
}

export async function streamAgentChat(options: StreamChatOptions): Promise<void> {
  const storedToken = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  let response = await openAgentStream(options, storedToken || options.accessToken || null);

  if (response.status === 401) {
    await response.body?.cancel();
    const refreshedToken = await refreshAccessToken(options.signal);
    if (refreshedToken) {
      options.onTokenRefreshed?.(refreshedToken);
      response = await openAgentStream(options, refreshedToken);
    }
  }

  if (!response.ok) {
    throw new AgentStreamError(await parseErrorMessage(response), response.status);
  }
  if (!response.body) {
    throw new AgentStreamError("Trình duyệt không hỗ trợ streaming response.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const emitBlock = (block: string): boolean => {
    const event = parseEventBlock(block);
    if (!event) return false;
    options.onEvent(event);
    // The UI has all data it needs at this point. Do not wait for a proxy or
    // upstream server to close the HTTP stream cleanly.
    return event.type === "done" || event.type === "error";
  };

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      if (emitBlock(block)) {
        await reader.cancel();
        return;
      }
    }
    if (done) break;
  }

  if (buffer.trim()) {
    emitBlock(buffer);
  }
}
