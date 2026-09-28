"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, ChevronRight } from "lucide-react";

import { markNotificationsRead } from "@/app/actions";
import { Button } from "@/components/ui/button";
import type { AppNotification } from "@/lib/generator-types";
import { formatDate } from "@/lib/generator-utils";

interface NotificationListProps {
  notifications: AppNotification[];
}

export function NotificationList({ notifications }: NotificationListProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const unreadIds = notifications.filter((notification) => !notification.readAt).map((notification) => notification.id);

  async function markAllRead() {
    setBusy(true);
    setError("");
    const result = await markNotificationsRead(unreadIds);
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    router.refresh();
  }

  return (
    <div className="grid gap-3">
      {unreadIds.length > 0 ? <div className="flex justify-end"><Button variant="outline" disabled={busy} onClick={markAllRead} className="min-h-10 gap-2"><CheckCheck size={16} />{busy ? "Ažuriranje…" : "Označi sve kao pročitano"}</Button></div> : null}
      {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      {notifications.length ? notifications.map((notification) => {
        const content = (
          <article className={`flex min-w-0 items-start gap-3 rounded-lg border p-4 sm:p-5 ${notification.readAt ? "border-border bg-card" : "border-primary/25 bg-primary/5"}`}>
            <span className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded ${notification.readAt ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"}`}><Bell size={17} /></span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1"><h2 className="text-sm font-semibold">{notification.title}</h2><time className="text-xs text-muted-foreground">{formatDate(notification.dueDate)}</time></div>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">{notification.body}</p>
              {notification.readAt ? <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Pročitano</p> : <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-primary">Novo obaveštenje</p>}
            </div>
            {notification.generatorId ? <ChevronRight size={18} className="mt-2 shrink-0 text-muted-foreground" /> : null}
          </article>
        );
        return notification.generatorId ? <Link key={notification.id} href={`/dashboard/generators/${notification.generatorId}`} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{content}</Link> : <div key={notification.id}>{content}</div>;
      }) : (
        <div className="rounded-lg border border-dashed border-border bg-card px-5 py-12 text-center">
          <Bell className="mx-auto text-muted-foreground" size={22} />
          <p className="mt-3 text-sm font-semibold">Nema obaveštenja</p>
          <p className="mt-1 text-xs text-muted-foreground">Kada se servisni rok približi, pojaviće se ovde.</p>
        </div>
      )}
    </div>
  );
}
