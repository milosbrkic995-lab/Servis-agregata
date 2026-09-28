"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, Bolt, Boxes, ClipboardCheck, LogOut, Settings2 } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

interface AppShellProps {
  children: ReactNode;
  name: string;
  email: string;
  unreadCount: number;
}

const navigation = [
  { href: "/dashboard", label: "Agregati", icon: Boxes },
  { href: "/dashboard/notifications", label: "Obaveštenja", icon: Bell },
  { href: "/dashboard/settings", label: "Podešavanja", icon: Settings2 },
];

export function AppShell({ children, name, email, unreadCount }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }

  function isActive(href: string) {
    return href === "/dashboard"
      ? pathname === href || pathname.startsWith("/dashboard/generators")
      : pathname === href;
  }

  return (
    <div className="flex h-dvh min-w-0 flex-col overflow-hidden bg-background md:flex-row">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
        <Link href="/dashboard" className="flex h-[76px] items-center gap-3 border-b border-sidebar-border px-6">
          <span className="flex size-10 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Bolt size={21} strokeWidth={2.2} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-bold tracking-wide text-sidebar-foreground">SERVISNI DNEVNIK</span>
            <span className="mt-0.5 block text-[11px] text-muted-foreground">Evidencija agregata</span>
          </span>
        </Link>
        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Radni panel</p>
          <nav aria-label="Glavna navigacija" className="grid gap-1">
            {navigation.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  isActive(href)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/70 hover:text-sidebar-foreground",
                )}
              >
                <Icon size={18} strokeWidth={1.8} />
                <span className="flex-1">{label}</span>
                {href === "/dashboard/notifications" && unreadCount > 0 ? (
                  <span className="rounded-sm bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">{unreadCount}</span>
                ) : null}
              </Link>
            ))}
          </nav>
        </div>
        <div className="mt-auto border-t border-sidebar-border p-4">
          <div className="mb-3 min-w-0 px-2">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">{name || "Moj nalog"}</p>
            <p className="mt-1 truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start gap-3 px-2 text-muted-foreground" onClick={handleSignOut}>
            <LogOut size={17} /> Odjavi se
          </Button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-2.5">
            <span className="flex size-8 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground">
              <Bolt size={17} strokeWidth={2.2} />
            </span>
            <span className="truncate text-xs font-bold tracking-[0.1em]">SERVISNI DNEVNIK</span>
          </Link>
          <Button variant="ghost" size="icon" aria-label="Odjavi se" onClick={handleSignOut}>
            <LogOut size={18} />
          </Button>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto w-full max-w-6xl px-4 pb-8 pt-5 sm:px-6 md:px-8 md:pt-8">{children}</div>
        </main>
        <nav aria-label="Glavna navigacija" className="grid shrink-0 grid-cols-3 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              aria-current={isActive(href) ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 text-[10px] font-semibold",
                isActive(href) ? "text-primary" : "text-muted-foreground",
              )}
            >
              <span className="relative">
                <Icon size={19} strokeWidth={1.9} />
                {href === "/dashboard/notifications" && unreadCount > 0 ? (
                  <span className="absolute -right-2 -top-1 size-2 rounded-full bg-destructive" />
                ) : null}
              </span>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
