import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getUser } from "@/lib/auth";
import { getUserRole } from "@/lib/permissions";

export default async function HomePage() {
  const currentUser = await getUser();
  if (!currentUser) return <AuthScreen initialMode="client" />;
  const role = await getUserRole(currentUser.id);
  redirect(role === "admin" ? "/admin" : "/dashboard");
}
