// src/app/api/warnings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { warningsTable } from "@/lib/schema";
import { desc } from "drizzle-orm";

/** ---- limiter ---- */
const RL_LIMIT = 60;             // 60 req
const RL_WINDOW_MS = 60_000;     // per 1 minute
const MAX_BUCKETS = 20_000;      // safety cap
let lastSweep = 0;

type Bucket = { count: number; resetAt: number };
const buckets: Map<string, Bucket> =
  (globalThis as any).__RL_BUCKETS__ || ((globalThis as any).__RL_BUCKETS__ = new Map());

function sweepExpired(now: number) {
  // run at most once per window
  if (now - lastSweep < RL_WINDOW_MS) return;
  for (const [k, v] of buckets) {
    if (v.resetAt <= now) buckets.delete(k);
  }
  lastSweep = now;
}

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  const cf = req.headers.get("cf-connecting-ip");
  if (cf) return cf;
  const xrip = req.headers.get("x-real-ip");
  if (xrip) return xrip;
  // @ts-ignore
  return (req as any).ip || "0.0.0.0";
}

function checkRateLimit(key: string) {
  const now = Date.now();
  sweepExpired(now); // 🔹 keep map from growing forever

  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 1, resetAt: now + RL_WINDOW_MS };
    buckets.set(key, b);
  } else {
    b.count++;
  }

  // safety cap to avoid memory spikes
  if (buckets.size > MAX_BUCKETS) {
    return {
      limited: true,
      headers: {
        "X-RateLimit-Limit": String(RL_LIMIT),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(b.resetAt / 1000)),
      },
      retryAfter: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }

  const remaining = Math.max(0, RL_LIMIT - b.count);
  const limited = b.count > RL_LIMIT;
  const headers = {
    "X-RateLimit-Limit": String(RL_LIMIT),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(Math.ceil(b.resetAt / 1000)), // epoch seconds
  };
  const retryAfter = Math.max(1, Math.ceil((b.resetAt - now) / 1000));
  return { limited, headers, retryAfter };
}



export async function GET(request: NextRequest) {
  // rate limit first
  const ip = getClientIp(request);
  const pathname = new URL(request.url).pathname;
  const { limited, headers, retryAfter } = checkRateLimit(`${ip}:${pathname}`);
  if (limited) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...headers, "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

    const allWarnings = await db.select().from(warningsTable).orderBy(desc(warningsTable.createdAt));

    const warningsMap = new Map<string, { id: string; date: string; time: string; area: string }>();
    allWarnings.forEach((warning) => {
      if (!warningsMap.has(warning.id)) {
        const d = new Date(warning.onsetAt);
        const date = `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
        const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
        warningsMap.set(warning.id, { id: warning.id, date, time, area: warning.area || "" });
      }
    });

    const allUnique = Array.from(warningsMap.values());
    const page = allUnique.slice(offset, offset + limit);

    return NextResponse.json(
      {
        warnings: page,
        pagination: { total: allUnique.length, limit, offset, hasMore: offset + limit < allUnique.length },
      },
      { headers } // include rate headers
    );
  } catch (error) {
    console.error("Error fetching warnings:", error);
    return NextResponse.json({ error: "Failed to fetch warnings" }, { status: 500 });
  }
}
