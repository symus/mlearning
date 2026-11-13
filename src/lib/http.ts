import { NextResponse } from "next/server";

/**
 * Redirect to a path on this same site with a relative Location header.
 * `new URL(path, request.url)` can point at the server's own name (localhost / 0.0.0.0) in dev,
 * which breaks phones and tablets on the home network; a relative path always stays on the
 * address the browser is already using.
 */
export function redirectTo(path: string, status: 303 | 307 = 307) {
  if (!path.startsWith("/") || path.startsWith("//")) throw new Error("redirectTo only takes a same-site path");
  return new NextResponse(null, { status, headers: { Location: path } });
}
