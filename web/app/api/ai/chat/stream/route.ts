import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const agentUrl = (process.env.AI_AGENT_INTERNAL_URL || "http://localhost:8000").replace(/\/$/, "");

export async function POST(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  const upstream = await fetch(`${agentUrl}/chat/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/event-stream",
      ...(authorization ? { Authorization: authorization } : {}),
    },
    body: await request.text(),
    cache: "no-store",
  });

  if (!upstream.body) {
    return new Response("AI Agent did not return a response body", { status: 502 });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("content-type") || "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
