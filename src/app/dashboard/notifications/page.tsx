import { BellRing } from "lucide-react";

import { NotificationList } from "@/components/dashboard/notification-list";
import { getNotificationsForCurrentUser } from "@/lib/generator-data";

export default async function NotificationsPage() {
  const notifications = await getNotificationsForCurrentUser();
  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6 flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><BellRing size={19} /></span>
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">SERVISNA OBAVEŠTENJA</p><h1 className="mt-1 text-2xl font-bold tracking-tight">Obaveštenja</h1><p className="mt-1 text-sm text-muted-foreground">Rokovi koji su blizu, dospeli ili prekoračeni.</p></div>
      </div>
      <NotificationList notifications={notifications} />
    </div>
  );
}
