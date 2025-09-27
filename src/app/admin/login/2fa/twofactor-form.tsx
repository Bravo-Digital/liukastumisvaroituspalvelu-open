"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminVerifyTotp, type LoginState } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { error: null };

export default function TwoFactorForm() {
  const [state, formAction] = useFormState(adminVerifyTotp, initialState);
  const { pending } = useFormStatus();

  return (
    <div className="mx-auto w-full max-w-md px-5 py-10">
      <Card>
        <CardHeader><CardTitle>Enter 2FA Code</CardTitle></CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Authentication code</Label>
              <Input id="code" name="code" inputMode="numeric" pattern="[0-9]*" placeholder="123456" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Verifying..." : "Verify"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
