export const dynamic = "force-dynamic";
import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import LoginForm from "./LoginForm";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");
  return <LoginForm />;
}
