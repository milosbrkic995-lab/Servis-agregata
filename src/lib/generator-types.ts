export type IntervalType = "calendar" | "hours";
export type PowerUnit = "kVA" | "kW";
export type ServiceStatus = "overdue" | "today" | "upcoming" | "current";

export interface GeneratorRecord {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  powerValue: number;
  powerUnit: PowerUnit;
  location: string;
  commissionedAt: string;
  intervalType: IntervalType;
  intervalMonths: number | null;
  intervalHours: number | null;
  currentHours: number;
  lastServiceHours: number | null;
  nextServiceDate: string | null;
  reminderDays: number;
  notificationsEnabled: boolean;
  updatedAt: string;
}

export interface ServiceRecord {
  id: string;
  generatorId: string;
  completedAt: string;
  hoursAtService: number | null;
  workNotes: string;
}

export interface AppNotification {
  id: string;
  generatorId: string | null;
  kind: string;
  title: string;
  body: string;
  dueDate: string | null;
  readAt: string | null;
  browserNotifiedAt: string | null;
  createdAt: string;
}

export interface UserSettings {
  remindersEnabled: boolean;
  emailNotificationsEnabled: boolean;
}

export interface GeneratorFormValues {
  id?: string;
  name: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  powerValue: string;
  powerUnit: PowerUnit;
  location: string;
  commissionedAt: string;
  intervalType: IntervalType;
  intervalMonths: string;
  intervalHours: string;
  currentHours: string;
  reminderDays: string;
  notificationsEnabled: boolean;
}

export type ActionResult =
  | { ok: true; message?: string }
  | { ok: false; message: string };
