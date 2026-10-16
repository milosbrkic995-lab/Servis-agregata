import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, LayoutDashboard, Users, Zap } from "lucide-react";

import { AdminSignOutButton } from "@/components/app/admin-sign-out-button";
import { getUser } from "@/lib/auth";
import { getUserRole } from "@/lib/permissions";

export default async function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getUser();
  if (!currentUser) redirect("/");
  if (await getUserRole(currentUser.id) !== "admin") redirect("/dashboard");

  const links = [
    { href: "/admin", label: "Pregled", icon: LayoutDashboard },
    { href: "/admin/clients", label: "Komitenti", icon: Users },
    { href: "/admin/generators", label: "Agregati", icon: Zap },
    { href: "/admin/work-orders", label: "Radni nalozi", icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">J&amp;B POWER</p>
              <h1 className="mt-1 text-xl font-bold tracking-tight">Master panel</h1>
            </div>
            <div className="text-right text-xs text-muted-foreground">
              <p className="font-semibold text-foreground">{currentUser.name}</p>
              <p>{currentUser.email}</p>
              <p className="mt-1">Administrator</p>
            </div>
            <AdminSignOutButton />
          </div>
          <nav aria-label="Administratorska navigacija" className="flex flex-wrap gap-2">
            {links.map(({ href, label, icon: Icon }) => (
              <Link key={href} href={href} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium hover:bg-muted">
                <Icon size={16} /> {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
