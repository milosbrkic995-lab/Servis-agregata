import type { GeneratorRecord, ServiceStatus } from "@/lib/generator-types";

export function dateOnly(value: Date = new Date()): string {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Belgrade",
  }).format(value);
}

export function addMonths(dateValue: string, months: number): string {
  const [year, month, day] = dateValue.split("-").map(Number);
  const targetMonth = month - 1 + months;
  const targetYear = year + Math.floor(targetMonth / 12);
  const normalizedMonth = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, normalizedMonth + 1, 0)).getUTCDate();
  return [targetYear, String(normalizedMonth + 1).padStart(2, "0"), String(Math.min(day, lastDay)).padStart(2, "0")].join("-");
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export function formatDate(value: string | null): string {
  if (!value) return "Nije određeno";
  const date = new Date(`${value}T00:00:00Z`);
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatShortDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("sr-Latn-RS", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${value}T00:00:00Z`));
}

export function getServiceStatus(
  generator: Pick<GeneratorRecord, "intervalType" | "intervalHours" | "currentHours" | "lastServiceHours" | "nextServiceDate" | "reminderDays">,
  today = dateOnly(),
): ServiceStatus {
  if (generator.intervalType === "hours") {
    if (generator.intervalHours === null) return "current";
    const baseline = generator.lastServiceHours ?? 0;
    const remaining = baseline + generator.intervalHours - generator.currentHours;
    if (remaining <= 0) return "overdue";
    return remaining <= Math.max(24, generator.intervalHours * 0.05) ? "upcoming" : "current";
  }
  if (!generator.nextServiceDate) return "current";
  const daysLeft = daysBetween(today, generator.nextServiceDate);
  if (daysLeft < 0) return "overdue";
  if (daysLeft === 0) return "today";
  if (daysLeft <= generator.reminderDays) return "upcoming";
  return "current";
}

export function getStatusLabel(status: ServiceStatus): string {
  switch (status) {
    case "overdue":
      return "Servis zakasnio";
    case "today":
      return "Servis danas";
    case "upcoming":
      return "Servis uskoro";
    default:
      return "U redu";
  }
}

export function serviceCountdown(generator: GeneratorRecord, today = dateOnly()): string {
  if (generator.intervalType === "hours" && generator.intervalHours !== null) {
    const remaining = (generator.lastServiceHours ?? 0) + generator.intervalHours - generator.currentHours;
    return remaining <= 0 ? `Prekoračeno ${Math.abs(Math.floor(remaining))} h` : `Još ${Math.ceil(remaining)} h`;
  }
  if (!generator.nextServiceDate) return "Nije određeno";
  const daysLeft = daysBetween(today, generator.nextServiceDate);
  if (daysLeft < 0) return `${Math.abs(daysLeft)} dana kašnjenja`;
  if (daysLeft === 0) return "Danas je termin";
  if (daysLeft === 1) return "Još 1 dan";
  return `Još ${daysLeft} dana`;
}
