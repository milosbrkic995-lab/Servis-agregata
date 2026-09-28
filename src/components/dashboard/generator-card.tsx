import Link from "next/link";
import { ArrowUpRight, CalendarClock, Clock3, MapPin, Zap } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { GeneratorRecord } from "@/lib/generator-types";
import { formatShortDate, getServiceStatus, getStatusLabel, serviceCountdown } from "@/lib/generator-utils";
import { cn } from "@/lib/utils";

interface GeneratorCardProps {
  generator: GeneratorRecord;
}

export function GeneratorCard({ generator }: GeneratorCardProps) {
  const status = getServiceStatus(generator);
  const statusTone = {
    overdue: "border-destructive/30 bg-destructive/10 text-destructive",
    today: "border-primary/35 bg-primary/10 text-primary",
    upcoming: "border-primary/25 bg-primary/5 text-primary",
    current: "border-border bg-muted text-muted-foreground",
  }[status];

  return (
    <Link
      href={`/dashboard/generators/${generator.id}`}
      className="group block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5"
    >
      <div className="flex min-w-0 items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-md border border-primary/15 bg-primary/5 text-primary">
            <Zap size={21} strokeWidth={1.8} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-base font-semibold tracking-tight text-card-foreground">{generator.name}</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">{generator.manufacturer} · {generator.model}</p>
          </div>
        </div>
        <ArrowUpRight className="mt-1 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" size={18} />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><MapPin size={14} />{generator.location}</span>
        <span className="inline-flex items-center gap-1.5"><Zap size={14} />{generator.powerValue} {generator.powerUnit}</span>
        {generator.intervalType === "hours" ? (
          <span className="inline-flex items-center gap-1.5"><Clock3 size={14} />{generator.currentHours.toLocaleString("sr-Latn-RS")} radnih sati</span>
        ) : (
          <span className="inline-flex items-center gap-1.5"><CalendarClock size={14} />{formatShortDate(generator.nextServiceDate)}</span>
        )}
      </div>
      <div className="mt-4 flex items-center justify-between gap-3">
        <Badge variant="outline" className={cn("min-h-7 rounded-sm px-2.5 text-[11px] font-semibold", statusTone)}>{getStatusLabel(status)}</Badge>
        <span className="truncate text-xs font-medium text-muted-foreground">{serviceCountdown(generator)}</span>
      </div>
    </Link>
  );
}
