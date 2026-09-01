import { NextRequest } from "next/server";
import { proxyAgent } from "../../../_proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, { params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  return proxyAgent(request, "/runs/" + encodeURIComponent(runId) + "/cancel");
}

