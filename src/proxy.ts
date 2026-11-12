import { NextResponse, type NextRequest } from "next/server";

// Fast, optimistic check only: no cookie -> go to login.
// Real authorisation happens in src/lib/auth/dal.ts on every page and action.
export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has("wg_session");
  if (!hasSession) {
    const url = new URL("/login", request.url);
    url.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/parent/:path*", "/play/:path*", "/admin/:path*"],
};
