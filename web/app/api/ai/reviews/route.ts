import { NextRequest } from "next/server";
import { proxyAgent } from "../_proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const status = request.nextUrl.searchParams.get("status") || "pending";
  return proxyAgent(request, "/reviews?status=" + encodeURIComponent(status));
}
