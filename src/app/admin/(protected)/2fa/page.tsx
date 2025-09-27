export const dynamic = "force-dynamic";

import { getAdminSession } from "@/lib/adminAuth";
import { getAdminMfa } from "@/lib/adminMfa";
import { createMfaEnrollment, finalizeMfaEnable, disableMfa } from "@/actions/admin";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import React from "react";

export default async function Admin2faPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const mfa = await getAdminMfa();

  async function startEnroll() {
    "use server";
    await createMfaEnrollment();
    redirect("/admin/2fa");
  }

  async function verifyEnroll(formData: FormData) {
    "use server";
    const res = await finalizeMfaEnable(formData);
    if ("error" in res) return;
    redirect("/admin/2fa");
  }

  async function disable() {
    "use server";
    await disableMfa();
    redirect("/admin/2fa");
  }

  // Get / show QR
  let qrDataUrl: string | null = null;
  if (mfa.mfaSecret && !mfa.mfaEnabled) {
    const { qrDataUrl: q } = await createMfaEnrollment();
    qrDataUrl = q;
  }


  return (
    <div className="mx-auto w-full max-w-xl px-5 py-10">
      <Card>
        <CardHeader><CardTitle>Admin 2FA</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {mfa.mfaEnabled ? (
            <>
              <p>Two-factor authentication is <strong>enabled</strong>.</p>
              <form action={disable}>
                <Button variant="destructive">Disable 2FA</Button>
              </form>
            </>
          ) : mfa.mfaSecret ? (
            <>
              <p className="text-sm text-muted-foreground">
                Scan this QR with Google Authenticator / 1Password / Authy, then enter the 6-digit code.
              </p>
              {qrDataUrl && <img src={qrDataUrl} alt="2FA QR" className="mx-auto w-48 h-48" />}
              <form action={verifyEnroll} className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="code">Code</Label>
                  <Input id="code" name="code" inputMode="numeric" pattern="[0-9]*" placeholder="123456" required />
                </div>
                <Button type="submit">Enable 2FA</Button>
              </form>
            </>
          ) : (
            <form action={startEnroll}>
              <Button>Enable 2FA</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
