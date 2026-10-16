import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getUser } from "@/lib/auth";
import { getUserRole } from "@/lib/permissions";

/** Separate entry point for administrators; it does not use the /admin layout. */
export default async function AdminLoginPage() {
  const currentUser = await getUser();
  if (currentUser) {
    const role = await getUserRole(currentUser.id);
    redirect(role === "admin" ? "/admin" : "/dashboard");
  }

  return <AuthScreen initialMode="signin" />;
}
