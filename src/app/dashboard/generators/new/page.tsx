import { redirect } from "next/navigation";

// Client portal is intentionally read-only. Administrators add equipment in /admin/generators.
export default function NewGeneratorPage() {
  redirect("/dashboard");
}
