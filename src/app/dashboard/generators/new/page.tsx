import { GeneratorForm } from "@/components/generators/generator-form";
import { dateOnly } from "@/lib/generator-utils";
import type { GeneratorFormValues } from "@/lib/generator-types";

export default function NewGeneratorPage() {
  const initialValues: GeneratorFormValues = {
    name: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    powerValue: "",
    powerUnit: "kVA",
    location: "",
    commissionedAt: dateOnly(),
    intervalType: "calendar",
    intervalMonths: "6",
    intervalHours: "500",
    currentHours: "0",
    reminderDays: "7",
    notificationsEnabled: true,
  };

  return <GeneratorForm initialValues={initialValues} />;
}
