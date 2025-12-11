import { NextRequest, NextResponse } from "next/server";

// Redirect bare callback (no locale prefix) to default locale route, preserving query params
const DEFAULT_LOCALE = "en";

export function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.search; // includes leading "?" when present
  const target = `/${DEFAULT_LOCALE}/auth/google/callback${search}`;
  return NextResponse.redirect(new URL(target, url.origin));
}
