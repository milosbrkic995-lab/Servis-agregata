"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-client";

export function AdminSignOutButton() {
  const router = useRouter();
  async function handleSignOut() {
    await signOut();
    router.replace("/");
    router.refresh();
  }
  return <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={handleSignOut}><LogOut size={16}/> Odjavi se</Button>;
}
