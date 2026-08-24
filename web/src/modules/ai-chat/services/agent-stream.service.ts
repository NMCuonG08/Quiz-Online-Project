import type { AgentStreamEvent, ChatPageContext, ChatScope } from "../types";

interface StreamChatOptions {
  message: string;
  userId: string;
  sessionId?: string;
  locale?: string;
  scope: ChatScope;
  context: ChatPageContext;
  signal?: AbortSignal;
  onEvent: (event: AgentStreamEvent) => void;
}

const AGENT_URL = (process.env.NEXT_PUBLIC_AI_AGENT_URL || "/api/ai").replace(/\/$/, "");

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
  const token = typeof window !== "undefined" ? localStorage.getItem("auth_token") : null;
  const response = await fetch(`${AGENT_URL}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      message: options.message,
      user_id: options.userId,
      session_id: options.sessionId,
      locale: options.locale || "vi",
      scope: options.scope,
      context: options.context,
    }),
    signal: options.signal,
  });

  if (!response.ok) {
    throw new Error(`Agent server returned ${response.status}`);
  }
  if (!response.body) {
    throw new Error("Streaming is not supported by this browser");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done }).replace(/\r\n/g, "\n");
    const blocks = buffer.split("\n\n");
    buffer = blocks.pop() || "";

    for (const block of blocks) {
      const event = parseEventBlock(block);
      if (event) options.onEvent(event);
    }
    if (done) break;
  }

  if (buffer.trim()) {
    const event = parseEventBlock(buffer);
    if (event) options.onEvent(event);
  }
}
