import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { db } from "@/db";
import { appNotifications } from "@/db/schema";
import { getUser } from "@/lib/auth";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getUser();
  if (!user) redirect("/");
  const unread = await db
    .select({ id: appNotifications.id })
    .from(appNotifications)
    .where(and(eq(appNotifications.userId, user.id), isNull(appNotifications.readAt)));
  return (
    <AppShell name={user.name} email={user.email} unreadCount={unread.length}>
      {children}
    </AppShell>
  );
}
