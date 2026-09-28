import { notFound } from "next/navigation";

import { GeneratorForm } from "@/components/generators/generator-form";
import { getGeneratorDetails } from "@/lib/generator-data";
import type { GeneratorFormValues } from "@/lib/generator-types";

export default async function EditGeneratorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getGeneratorDetails(id);
  if (!result) notFound();
  const { generator } = result;
  const initialValues: GeneratorFormValues = {
    id: generator.id,
    name: generator.name,
    manufacturer: generator.manufacturer,
    model: generator.model,
    serialNumber: generator.serialNumber,
    powerValue: String(generator.powerValue),
    powerUnit: generator.powerUnit,
    location: generator.location,
    commissionedAt: generator.commissionedAt,
    intervalType: generator.intervalType,
    intervalMonths: String(generator.intervalMonths ?? 6),
    intervalHours: String(generator.intervalHours ?? 500),
    currentHours: String(generator.currentHours),
    reminderDays: String(generator.reminderDays),
    notificationsEnabled: generator.notificationsEnabled,
  };

  return <GeneratorForm initialValues={initialValues} isEditing />;
}
