export interface BackgroundRun {
  run_id: string;
  job_id: string;
  status: string;
}

export interface AgentRun {
  run_id: string;
  status: string;
  [key: string]: unknown;
}

export interface AgentReview {
  review_id: string;
  status: string;
  resource_type?: string;
  resource_payload?: Record<string, unknown>;
  created_at?: string;
  decision_notes?: string;
  [key: string]: unknown;
}

export interface AgentRunEvent {
  type: string;
  sequence?: number;
  timestamp?: string;
  node?: string;
  tool?: string;
  label?: string;
  [key: string]: unknown;
}

function authHeaders(): HeadersInit {
  const token = typeof window !== "undefined"
    ? localStorage.getItem("auth_token")
    : null;
  return token ? { Authorization: "Bearer " + token } : {};
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(
      typeof payload.detail === "string"
        ? payload.detail
        : "AI Agent request failed (" + response.status + ")",
    );
  }
  return response.json() as Promise<T>;
}

export async function enqueueAgentRun(input: {
  message: string;
  session_id?: string;
  locale?: string;
  scope: "learner" | "creator" | "admin";
  context?: Record<string, unknown>;
}): Promise<BackgroundRun> {
  const response = await fetch("/api/ai/runs", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    credentials: "include",
    body: JSON.stringify(input),
  });
  return parseJson<BackgroundRun>(response);
}

export async function getAgentRun(runId: string): Promise<{ run: AgentRun }> {
  const response = await fetch("/api/ai/runs/" + encodeURIComponent(runId), {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(response);
}

export async function getAgentRunEvents(runId: string): Promise<{ events: AgentRunEvent[] }> {
  const response = await fetch(
    "/api/ai/runs/" + encodeURIComponent(runId) + "/events?limit=200",
    { headers: authHeaders(), credentials: "include" },
  );
  return parseJson(response);
}

export async function cancelAgentRun(runId: string): Promise<{ cancel_requested: boolean }> {
  const response = await fetch(
    "/api/ai/runs/" + encodeURIComponent(runId) + "/cancel",
    {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
    },
  );
  return parseJson(response);
}

export async function getAgentReview(reviewId: string): Promise<{ review: AgentReview }> {
  const response = await fetch(
    "/api/ai/reviews/" + encodeURIComponent(reviewId),
    { headers: authHeaders(), credentials: "include" },
  );
  return parseJson(response);
}

export async function listAgentReviews(status: "pending" | "approved" | "rejected" | "all" = "pending"): Promise<{ reviews: AgentReview[] }> {
  const response = await fetch("/api/ai/reviews?status=" + status, {
    headers: authHeaders(),
    credentials: "include",
  });
  return parseJson(response);
}

export async function decideAgentReview(
  reviewId: string,
  decision: "approved" | "rejected",
  notes = "",
): Promise<{ review: AgentReview }> {
  const response = await fetch(
    "/api/ai/reviews/" + encodeURIComponent(reviewId) + "/decision",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders() },
      credentials: "include",
      body: JSON.stringify({ decision, notes }),
    },
  );
  return parseJson(response);
}
