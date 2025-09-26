// src/app/admin/login/LoginForm.tsx
"use client";

import { useFormState, useFormStatus } from "react-dom";
import { adminSignIn, type LoginState } from "@/actions/admin";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

const initialState: LoginState = { error: null };

export default function LoginForm() {
  const [state, formAction] = useFormState(adminSignIn, initialState);
  const { pending } = useFormStatus();

  return (
    <div className="mx-auto w-full max-w-md px-5 py-10">
      <Card>
        <CardHeader><CardTitle>Admin Login</CardTitle></CardHeader>
        <CardContent>
          <form action={formAction} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input id="username" name="username" autoComplete="username" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" autoComplete="current-password" required />
            </div>
            {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
      <p>This page uses cookies.</p>
    </div>
  );
}
