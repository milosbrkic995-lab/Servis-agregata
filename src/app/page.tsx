import { redirect } from "next/navigation";

import { AuthScreen } from "@/components/auth/auth-screen";
import { getUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getUser();
  if (user) redirect("/dashboard");
  return <AuthScreen />;
}
