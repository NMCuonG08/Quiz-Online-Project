import { NextRequest } from "next/server";
import { proxyAgent } from "../../_proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  return proxyAgent(request, "/reviews/" + encodeURIComponent(reviewId));
}

