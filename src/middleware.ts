// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// ---- i18n (next-intl) for non-API routes ----
const intlMiddleware = createMiddleware(routing);

// ---- Public API prefixes (everything else under /api requires INTERNAL_API_KEY) ----
const PUBLIC_API_PREFIXES = ["/api/warnings", "/api/receive-sms"];

function isPublicApi(pathname: string) {
  return PUBLIC_API_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/") || pathname === `${p}/`
  );
}

// ---- Internal API auth (Authorization: Bearer <key> or x-internal-key) ----
function isAuthorizedInternal(req: NextRequest) {
  const expected = process.env.INTERNAL_API_KEY;

  // Optional dev convenience: allow if no key set in non-production
  if (!expected && process.env.NODE_ENV !== "production") return true;

  const authHeader = req.headers.get("authorization") || "";
  const bearer = authHeader.replace(/^Bearer\s+/i, "").trim();
  const headerKey = req.headers.get("x-internal-key") || bearer;

  return !!expected && headerKey === expected;
}

export default function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // Gate API routes
  if (pathname.startsWith("/api/")) {
    if (isPublicApi(pathname)) {
      return NextResponse.next();
    }

    // Allow CORS preflight for internal endpoints
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204 });
    }

    // Internal-only requires key
    if (!isAuthorizedInternal(req)) {
      return new NextResponse(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "content-type": "application/json" },
      });
    }

    return NextResponse.next();
  }

  // Everything else 
  return intlMiddleware(req);
}

// Run on both API and app routes, but skip static assets/_next and exclude /admin from i18n
export const config = {
  matcher: [
    "/api/:path*",                            // all API
    "/((?!_next|_vercel|admin(?:/.*)?|.*\\..*).*)", // all non-admin app routes 
  ],
};
