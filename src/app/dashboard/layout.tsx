import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/app/app-shell";
import { db } from "@/db";
import { appNotifications } from "@/db/schema";
import { getUser } from "@/lib/auth";
import { getUserRole } from "@/lib/permissions";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const currentUser = await getUser();
  if (!currentUser) redirect("/");
  if (await getUserRole(currentUser.id) === "admin") redirect("/admin");

  const unread = await db
    .select({ id: appNotifications.id })
    .from(appNotifications)
    .where(and(eq(appNotifications.userId, currentUser.id), isNull(appNotifications.readAt)));
  return (
    <AppShell name={currentUser.name} email={currentUser.email} unreadCount={unread.length}>
      {children}
    </AppShell>
  );
}
