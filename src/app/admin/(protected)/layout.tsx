import { requireAdmin } from "@/lib/adminAuth";
import { adminSignOut } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  noStore();
  await requireAdmin();
  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3">
          <div className="font-semibold">Liukasbotti Admin</div>
          <form action={adminSignOut}>
            <Button variant="outline" size="sm">Sign out</Button>
          </form>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl px-5 py-6">{children}</main>
    </div>
  );
}
