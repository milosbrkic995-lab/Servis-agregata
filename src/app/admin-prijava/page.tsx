import { redirect } from "next/navigation";
import { AdminAuthScreen } from "@/components/auth/admin-auth-screen";
import { getUser } from "@/lib/auth";
import { getUserRole } from "@/lib/permissions";

export default async function AdminLoginPage() {
  const currentUser = await getUser();
  if (currentUser) redirect(await getUserRole(currentUser.id) === "admin" ? "/admin" : "/dashboard");
  return <AdminAuthScreen />;
}
