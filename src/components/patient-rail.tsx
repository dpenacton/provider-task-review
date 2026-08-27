import { ExternalLink, FileText, MapPin, ShieldAlert } from "lucide-react";
import { extrasFor, idDocsFor } from "@/lib/catalog";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PatientRail({ task }: { task: Task }) {
  const p = task.patient;
  const extras = extrasFor(task.id);
  const ids = idDocsFor(task);
  const flagged = Boolean(task.safety.hardStop) || task.safety.flags.length > 0;

  return (
    <div className="flex flex-col gap-3">
      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">AI overview</h3>
          <span className="text-xs text-muted">Draft — verify against intake</span>
        </div>
        <p className="mt-2 text-sm leading-relaxed">{extras.aiOverview}</p>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Patient snapshot</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <Row k="Height / Weight" v={`${p.height} · ${p.weight} (BMI ${p.bmi})`} />
          <Row k="Allergies" v={p.allergies} />
        </dl>
        <div className="mt-3 flex items-start gap-2 rounded-lg bg-accent-soft px-3 py-2.5 text-sm">
          <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Ships to</p>
            <p className="mt-0.5 font-medium leading-snug">{p.address}</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Intake highlights</h3>
          <a
            href={extras.intakeUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold hover:border-accent hover:text-accent"
          >
            View intake
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <dl className="mt-3 space-y-3">
          {task.intake.map((qa) => (
            <div key={qa.q}>
              <dt className="text-xs text-muted">{qa.q}</dt>
              <dd className="mt-0.5 text-sm font-medium leading-snug">{qa.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-xl border border-border bg-card p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">ID</h3>
          <a
            href={`/id/${task.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-background px-2.5 text-xs font-semibold hover:border-accent hover:text-accent"
          >
            View ID
            <ExternalLink className="size-3.5" />
          </a>
        </div>
        <ul className="mt-2 space-y-2">
          {ids.map((d) => (
            <li key={d.name}>
              <a
                href={`/id/${task.id}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-sm hover:text-accent"
              >
                <FileText className="size-4 text-muted" />
                <span className="min-w-0 flex-1 truncate font-medium">{d.name}</span>
                <span className="text-xs text-muted">{d.date}</span>
              </a>
            </li>
          ))}
        </ul>
      </section>

      {flagged ? (
        <section
          className={cn(
            "rounded-xl border p-4",
            task.safety.hardStop ? "border-danger-border bg-danger-soft" : "border-warn-border bg-warn-soft",
          )}
        >
          <div className="flex items-center gap-2">
            <ShieldAlert className={cn("size-4", task.safety.hardStop ? "text-danger" : "text-warn")} />
            <h3 className="text-xs font-semibold uppercase tracking-wide">Needs attention</h3>
          </div>
          {task.safety.flags.map((f) => (
            <p key={f} className="mt-2 text-sm font-medium">
              {f}
            </p>
          ))}
          {task.safety.hardStop ? (
            <p className="mt-2 text-sm font-semibold text-danger">{task.safety.hardStop}</p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
