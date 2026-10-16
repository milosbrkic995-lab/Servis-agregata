import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { clients, generators, serviceRecords, user } from "@/db/schema";
import { requireAdmin } from "@/lib/permissions";

function cell(value: unknown): string {
  const text = value === null || value === undefined ? "" : value instanceof Date ? value.toISOString() : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}
function csv(headers: string[], rows: unknown[][], fileName: string) {
  const body = [headers.map(cell).join(";"), ...rows.map((row) => row.map(cell).join(";"))].join("\r\n");
  return new Response(`\uFEFF${body}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${fileName}"`, "Cache-Control": "no-store" } });
}

export async function GET(_request: Request, context: { params: Promise<{ kind: string }> }) {
  await requireAdmin();
  const { kind } = await context.params;
  if (kind === "clients") {
    const rows = await db.select().from(clients).orderBy(asc(clients.name));
    return csv(["Naziv/kontakt","Firma","Email","Telefon","PIB","Adresa","Napomene","Povezan nalog","Kreiran"], rows.map((r) => [r.name,r.company,r.email,r.phone,r.pib,r.address,r.notes,r.userId ? "Da" : "Ne",r.createdAt]), "komitenti.csv");
  }
  if (kind === "generators") {
    const rows = await db.select({ name:generators.name,manufacturer:generators.manufacturer,model:generators.model,engineSerial:generators.serialNumber,generatorSerial:generators.generatorSerialNumber,controller:generators.controller,year:generators.manufacturingYear,mode:generators.operatingMode,power:generators.powerValue,unit:generators.powerUnit,location:generators.location,hours:generators.currentHours,commissioned:generators.commissionedAt,intervalMonths:generators.intervalMonths,nextService:generators.nextServiceDate,clientName:clients.name,company:clients.company,clientEmail:clients.email })
      .from(generators).leftJoin(clients,eq(generators.clientId,clients.id)).orderBy(asc(generators.name));
    return csv(["Naziv agregata","Proizvođač","Model motora","SN motora","SN agregata","Kontroler","Godina","Režim rada","Snaga","Jedinica","Lokacija","Radni sati","Pušten u rad","Interval meseci","Sledeći servis","Komitent","Firma","Email komitenta"],rows.map((r)=>[r.name,r.manufacturer,r.model,r.engineSerial,r.generatorSerial,r.controller,r.year,r.mode,r.power,r.unit,r.location,r.hours,r.commissioned,r.intervalMonths,r.nextService,r.company || r.clientName,r.company,r.clientEmail]),"agregati.csv");
  }
  if (kind === "services") {
    const rows = await db.select({ date:serviceRecords.completedAt,hours:serviceRecords.hoursAtService,notes:serviceRecords.workNotes,generator:generators.name,manufacturer:generators.manufacturer,model:generators.model,serial:generators.serialNumber,client:clients.name,company:clients.company,admin:user.name })
      .from(serviceRecords).innerJoin(generators,eq(serviceRecords.generatorId,generators.id)).leftJoin(clients,eq(generators.clientId,clients.id)).leftJoin(user,eq(serviceRecords.userId,user.id)).orderBy(desc(serviceRecords.completedAt));
    return csv(["Datum servisa","Agregat","Proizvođač","Model","SN motora","Komitent","Firma","Radni sati","Opis radova","Evidentirao"],rows.map((r)=>[r.date,r.generator,r.manufacturer,r.model,r.serial,r.company || r.client,r.company,r.hours,r.notes,r.admin]),"servisna-istorija.csv");
  }
  return new Response("Nepoznat tip izvoza", { status: 404 });
}
