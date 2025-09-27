export const dynamic = "force-dynamic";

import TwoFactorForm from "./twofactor-form";
import { hasPending2faCookie, getAdminSession } from "@/lib/adminAuth";
import { redirect } from "next/navigation";

export default async function TwoFaPage() {
  if (await getAdminSession()) redirect("/admin");
  if (!(await hasPending2faCookie())) redirect("/admin/login");
  return <TwoFactorForm />;
}
