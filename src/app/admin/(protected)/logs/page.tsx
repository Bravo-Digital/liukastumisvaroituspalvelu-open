import { db } from "@/lib/db";
import { auditEvents } from "@/lib/schema";
import { and, desc, eq, gte, lte } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Next 15: searchParams is a Promise
type RawSearchParams = Record<string, string | string[] | undefined>;
type Props = { searchParams?: Promise<RawSearchParams> };

function toDateStart(d?: string) {
  if (!d) return undefined;
  return new Date(`${d}T00:00:00`);
}
function toDateEnd(d?: string) {
  if (!d) return undefined;
  return new Date(`${d}T23:59:59.999`);
}

// Normalize a value that could be string | string[] | undefined
const pick = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v ?? undefined;

export default async function LogsPage({ searchParams }: Props) {
  // Works whether Next gives a Promise or a plain object
  const spRaw = (await searchParams) ?? {};

  const fromStr = pick(spRaw.from);
  const toStr = pick(spRaw.to);
  const actor = (pick(spRaw.actor) ?? "").trim();
  const action = (pick(spRaw.action) ?? "").trim();
  const outcome = (pick(spRaw.outcome) ?? "").trim();
  const pageStr = pick(spRaw.page) ?? "1";
  const perPageStr = pick(spRaw.perPage) ?? "50";

  const from = toDateStart(fromStr);
  const to = toDateEnd(toStr);

  const page = Math.max(parseInt(pageStr, 10) || 1, 1);
  const perPage = Math.min(Math.max(parseInt(perPageStr, 10) || 50, 1), 200);
  const offset = (page - 1) * perPage;

  const conds = [];
  if (from) conds.push(gte(auditEvents.ts, from));
  if (to) conds.push(lte(auditEvents.ts, to));
  if (actor) conds.push(eq(auditEvents.actorType, actor));
  if (action) conds.push(eq(auditEvents.action, action));
  if (outcome) conds.push(eq(auditEvents.outcome, outcome));

  const rows = await db
    .select({
      id: auditEvents.id,
      ts: auditEvents.ts,
      actorType: auditEvents.actorType,
      actorId: auditEvents.actorId,
      action: auditEvents.action,
      subjectType: auditEvents.subjectType,
      subjectId: auditEvents.subjectId,
      outcome: auditEvents.outcome,
      meta: auditEvents.meta,
    })
    .from(auditEvents)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(auditEvents.ts))
    .limit(perPage)
    .offset(offset);

  // crude “has next page” check
  const rowsNext = await db
    .select({ id: auditEvents.id })
    .from(auditEvents)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(auditEvents.ts))
    .limit(1)
    .offset(offset + perPage);
  const hasNext = rowsNext.length > 0;

  // preserve filters in pagination links
  const q = new URLSearchParams();
  if (fromStr) q.set("from", fromStr);
  if (toStr) q.set("to", toStr);
  if (actor) q.set("actor", actor);
  if (action) q.set("action", action);
  if (outcome) q.set("outcome", outcome);
  q.set("perPage", String(perPage));

  const prevHref = (() => {
    const s = new URLSearchParams(q);
    s.set("page", String(Math.max(page - 1, 1)));
    return `?${s.toString()}`;
  })();

  const nextHref = (() => {
    const s = new URLSearchParams(q);
    s.set("page", String(page + 1));
    return `?${s.toString()}`;
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Audit logs</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form method="GET" className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="from">From</Label>
              <Input id="from" name="from" type="date" defaultValue={fromStr || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="date" defaultValue={toStr || ""} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="actor">Actor</Label>
              <Input id="actor" name="actor" placeholder="admin / worker / api…" defaultValue={actor} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action">Action</Label>
              <Input id="action" name="action" placeholder="login_password / sms_sent…" defaultValue={action} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="outcome">Outcome</Label>
              <Input id="outcome" name="outcome" placeholder="success / fail / error" defaultValue={outcome} />
            </div>
            <div className="flex items-end gap-2">
              <Button type="submit" className="w-full">Apply</Button>
              <a href="/admin/logs">
                <Button type="button" variant="outline">Reset</Button>
              </a>
            </div>

            <input type="hidden" name="page" value={String(page)} />
            <input type="hidden" name="perPage" value={String(perPage)} />
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Results (page {page})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {rows.length} event{rows.length === 1 ? "" : "s"}
            </div>
            <div className="flex gap-2">
              <a href={prevHref} aria-disabled={page <= 1}>
                <Button variant="outline" disabled={page <= 1}>Previous</Button>
              </a>
              <a href={nextHref} aria-disabled={!hasNext}>
                <Button variant="outline" disabled={!hasNext}>Next</Button>
              </a>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead className="w-[110px]">Actor</TableHead>
                <TableHead className="w-[160px]">Actor ID</TableHead>
                <TableHead className="w-[200px]">Action</TableHead>
                <TableHead className="w-[140px]">Subject</TableHead>
                <TableHead className="w-[100px]">Outcome</TableHead>
                <TableHead>Meta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="text-xs">
                    {r.ts ? new Date(r.ts).toLocaleString() : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{r.actorType || "—"}</TableCell>
                  <TableCell className="text-xs">{r.actorId || "—"}</TableCell>
                  <TableCell className="text-xs">{r.action}</TableCell>
                  <TableCell className="text-xs">
                    {r.subjectType ? `${r.subjectType}:${r.subjectId ?? "—"}` : "—"}
                  </TableCell>
                  <TableCell className="text-xs">{r.outcome || "—"}</TableCell>
                  <TableCell className="text-xs whitespace-pre-wrap break-words">
                    {r.meta ? JSON.stringify(r.meta) : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-muted-foreground">
                    No events match the current filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
