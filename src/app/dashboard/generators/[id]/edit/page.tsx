import { redirect } from "next/navigation";

// Client portal is intentionally read-only. Administrators manage equipment in /admin/generators.
export default function EditGeneratorPage() {
  redirect("/dashboard");
}
