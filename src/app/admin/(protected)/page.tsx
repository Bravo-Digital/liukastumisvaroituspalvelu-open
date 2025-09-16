// src/app/(protected)/admin/page.tsx
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import {
  getAdminSummary,
  sendWarningToAll,
  getFeedbackList,
  markFeedbackHandled,
  getActiveWarningsForAdmin,
  updateWarningExpiry,
} from "@/actions/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { revalidatePath } from "next/cache";
import { baseMessageByLang, formatStampForMessage } from "@/lib/smsUtil";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

/** Format a JS Date to value for <input type="datetime-local"> (local time, yyyy-MM-ddTHH:mm) */
function toDatetimeLocalValue(d: Date) {
  const dt = new Date(d);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = dt.getFullYear();
  const MM = pad(dt.getMonth() + 1);
  const dd = pad(dt.getDate());
  const HH = pad(dt.getHours());
  const mm = pad(dt.getMinutes());
  return `${yyyy}-${MM}-${dd}T${HH}:${mm}`;
}

export default async function AdminHome() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const [summary, feedback, activeWarnings] = await Promise.all([
    getAdminSummary(),
    getFeedbackList({ limit: 50, status: "all" }),
    getActiveWarningsForAdmin(),
  ]);

  // Server action adapters (1 arg: FormData) for the forms
  async function sendWarningAdapter(formData: FormData) {
    "use server";
    await sendWarningToAll(null, formData);
    revalidatePath("/admin");
  }
  async function markHandledAdapter(formData: FormData) {
    "use server";
    await markFeedbackHandled(formData);
  }
  async function updateExpiryAdapter(formData: FormData) {
    "use server";
    await updateWarningExpiry(formData);
  }

  // default date range: last 30 days
  const to = new Date();
  const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
  const toStr = to.toISOString().slice(0, 10);
  const fromStr = from.toISOString().slice(0, 10);

  // Preview texts
  const stamp = formatStampForMessage();
  const preview = {
    fi: baseMessageByLang("fi", stamp),
    sv: baseMessageByLang("sv", stamp),
    en: baseMessageByLang("en", stamp),
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <Badge variant="secondary">Admin</Badge>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader><CardTitle>Total users</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{summary.totalUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>New (30d)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{summary.newUsers}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Warnings (30d)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{summary.warnings}</div></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>SMS sent (30d)</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold">{summary.smsSent}</div></CardContent>
        </Card>
      </div>

      {/* Report */}
      <Card>
        <CardHeader><CardTitle>Export report (CSV)</CardTitle></CardHeader>
        <CardContent>
          <form method="GET" action="/admin/report" target="_blank" className="grid grid-cols-1 gap-4 sm:grid-cols-5">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="from">From</Label>
              <Input id="from" name="from" type="date" defaultValue={fromStr} required />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="to">To</Label>
              <Input id="to" name="to" type="date" defaultValue={toStr} required />
            </div>
            <div className="sm:col-span-1 flex items-end">
              <Button type="submit" className="w-full">Download CSV</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Active warnings — edit expiry */}
      <Card>
        <CardHeader><CardTitle>Active warnings</CardTitle></CardHeader>
        <CardContent>
          {activeWarnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active warnings.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Onset</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="w-[220px]">Set new expiry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activeWarnings.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-mono text-xs">{w.id}</TableCell>
                    <TableCell>{w.area}</TableCell>
                    <TableCell>{new Date(w.onsetAt).toLocaleString()}</TableCell>
                    <TableCell className={cn(new Date(w.expiresAt) < new Date() ? "text-destructive" : "")}>
                      {new Date(w.expiresAt).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <form action={updateExpiryAdapter} className="flex items-center gap-2">
                        <input type="hidden" name="id" value={w.id} />
                        <Input
                          type="datetime-local"
                          name="expiresAt"
                          defaultValue={toDatetimeLocalValue(new Date(w.expiresAt))}
                          className="w-full"
                          required
                        />
                        <Button type="submit" size="sm">Save</Button>
                      </form>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Send warning to all users */}
      <Card>
        <CardHeader><CardTitle>Send warning to all users</CardTitle></CardHeader>
        <CardContent>
          <div className="mb-4 text-sm text-muted-foreground">
            This will send a localized warning to each user based on their language (FI/SV/EN).
          </div>

          {/* Preview of what will be sent */}
          <div className="grid gap-2 mb-6">
            <div className="rounded-md border p-3 text-sm"><strong>FI</strong>: {preview.fi}</div>
            <div className="rounded-md border p-3 text-sm"><strong>SV</strong>: {preview.sv}</div>
            <div className="rounded-md border p-3 text-sm"><strong>EN</strong>: {preview.en}</div>
          </div>

          <form action={sendWarningAdapter} className="grid grid-cols-1 gap-4 sm:grid-cols-6">
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="area">Area label (shown in DB)</Label>
              <Input id="area" name="area" placeholder="Helsinki" defaultValue="Helsinki" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <Label htmlFor="hours">Expires in (hours)</Label>
              <Input id="hours" name="hours" type="number" min={1} max={168} defaultValue={72} />
            </div>
            <div className="sm:col-span-6">
              <Button type="submit">Send to SMS Scheduler</Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Feedback */}
      <Card>
        <CardHeader><CardTitle>Feedback</CardTitle></CardHeader>
        <CardContent>
          {feedback.length === 0 ? (
            <p className="text-sm text-muted-foreground">No feedback yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[140px]">Created</TableHead>
                  <TableHead className="w-[120px]">Status</TableHead>
                  <TableHead className="w-[160px]">Name</TableHead>
                  <TableHead className="w-[220px]">Email</TableHead>
                  <TableHead>Subject / Message</TableHead>
                  <TableHead className="w-[130px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {feedback.map((fb) => (
                  <TableRow key={fb.id}>
                    <TableCell className="font-mono text-xs">{fb.id}</TableCell>
                    <TableCell className="text-xs">{new Date(fb.createdAt).toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge variant={fb.status === "handled" ? "secondary" : "default"}>
                        {fb.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{fb.name || "—"}</TableCell>
                    <TableCell className="truncate">{fb.email || "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{fb.subject}</div>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">{fb.message}</div>
                    </TableCell>
                    <TableCell>
                      {fb.status === "handled" ? (
                        <span className="text-xs text-muted-foreground">Done</span>
                      ) : (
                        <form action={markHandledAdapter}>
                          <input type="hidden" name="id" value={fb.id} />
                          <Button size="sm" type="submit">Mark handled</Button>
                        </form>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
