import { NextRequest } from "next/server";

const agentUrl = (process.env.AI_AGENT_INTERNAL_URL || "http://localhost:8000").replace(/\/$/, "");

export async function proxyAgent(request: NextRequest, path: string): Promise<Response> {
  try {
    const authorization = request.headers.get("authorization");
    const headers: HeadersInit = {
      Accept: "application/json",
      ...(authorization ? { Authorization: authorization } : {}),
    };
    const hasBody = !["GET", "HEAD"].includes(request.method);
    if (hasBody) {
      headers["Content-Type"] = request.headers.get("content-type") || "application/json";
    }
    const upstream = await fetch(agentUrl + path, {
      method: request.method,
      headers,
      body: hasBody ? await request.text() : undefined,
      cache: "no-store",
    });
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("content-type") || "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return Response.json({ detail: "AI Agent không khả dụng." }, { status: 502 });
  }
}

