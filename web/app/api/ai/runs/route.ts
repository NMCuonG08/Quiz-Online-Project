import { NextRequest } from "next/server";
import { proxyAgent } from "../_proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  return proxyAgent(request, "/runs");
}

