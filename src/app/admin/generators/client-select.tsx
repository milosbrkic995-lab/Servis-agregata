"use client";

import { useState } from "react";

type ClientOption = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  pib: string | null;
  address: string | null;
};

export function ClientSelectWithPreview({
  clients,
  defaultValue = "",
}: {
  clients: ClientOption[];
  defaultValue?: string;
}) {
  const [clientId, setClientId] = useState(defaultValue);
  const selected = clients.find((client) => client.id === clientId);

  return (
    <div className="grid gap-3 sm:col-span-2 lg:col-span-3">
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Komitent / korisnik opreme</span>
        <select
          name="clientId"
          value={clientId}
          onChange={(event) => setClientId(event.target.value)}
          className="min-h-10 rounded-md border border-input bg-background px-3"
        >
          <option value="">Neizdat agregat — bez komitenta</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.company || client.name} — {client.email}
            </option>
          ))}
        </select>
      </label>

      <div className="rounded-lg border border-border bg-muted/30 p-3 sm:p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
          Podaci o korisniku opreme
        </p>
        <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <PreviewField label="Naziv" value={selected ? (selected.company || selected.name) : "Neizdat agregat / nije izabran komitent"} />
          <PreviewField label="Adresa" value={selected?.address || "Nije uneto"} />
          <PreviewField label="PIB" value={selected?.pib || "Nije uneto"} />
          <PreviewField label="Tel/fax" value={selected?.phone || "Nije uneto"} />
        </dl>
        <p className="mt-3 text-xs leading-5 text-muted-foreground">
          Podaci se preuzimaju iz kartona komitenta. Za izmenu naziva, adrese, PIB-a ili telefona otvori „Komitenti”.
        </p>
      </div>
    </div>
  );
}

function PreviewField({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium">{value}</dd>
    </div>
  );
}
