"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return <button type="button" onClick={() => window.print()} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground print:hidden"><Printer size={16}/> Štampaj / sačuvaj PDF</button>;
}
