import { Activity, Sparkles } from "lucide-react";
import { DocumentsCard } from "@/components/documents-card";
import { PrescribeBlock } from "@/components/prescribe-block";
import { VisitNoteEditor } from "@/components/visit-note-editor";
import { aiFor } from "@/lib/catalog";
import type { Task } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";

/**
 * One screen, no tab hopping. AI and the visit note run down the left third;
 * the decision sits top-right where the eye lands first, with the intake and
 * the documents under it. The prescribe card is never scrolled inside — the
 * intake is, so the page itself stays a natural top-to-bottom read.
 */
export function OverviewTab({ task }: { task: Task }) {
  const ai = aiFor(task.id);

  return (
    <div className="grid items-start gap-4 lg:grid-cols-3">
      {/* Left third — AI analysis over the visit note */}
      <div className="flex flex-col gap-4">
        <Card
          icon={<Sparkles className="size-4 text-accent" />}
          title="AI analysis"
          tone="accent"
          right={
            <span className="rounded-full bg-card px-2 py-0.5 text-[11px] font-semibold text-accent">
              {ai.confidence}% confidence
            </span>
          }
        >
          <div className="flex items-baseline justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-wide text-muted">Status</p>
              <p className="text-sm font-semibold">{ai.status}</p>
            </div>
            <p className="text-[11px] text-muted">{fmtDate(task.createdAt, true)}</p>
          </div>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Status reasoning</p>
          <p className="mt-1 text-sm leading-relaxed">{ai.reasoning}</p>
          {ai.findings.length ? (
            <>
              <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted">Checks run</p>
              <ul className="mt-1 space-y-1">
                {ai.findings.map((f) => (
                  <li key={f} className="flex gap-2 text-sm leading-snug">
                    <span className="mt-1.5 size-1 shrink-0 rounded-full bg-muted" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
          <p className="mt-3 text-[11px] uppercase tracking-wide text-muted">
            task-medical-analysis v2.1 · draft, verify against intake
          </p>
        </Card>

        <VisitNoteEditor task={task} />
      </div>

      {/* Right two thirds — the decision, then the evidence behind it */}
      <div className="flex flex-col gap-4 lg:col-span-2">
        <PrescribeBlock task={task} />

        <div className="grid gap-4 md:grid-cols-2">
          <Card
            icon={<Activity className="size-4 text-muted" />}
            title="Medical context"
            right={<span className="text-[11px] text-muted">{task.intake.length} answers</span>}
            bodyClassName="max-h-[420px] overflow-y-auto"
          >
            <dl className="space-y-2">
              {task.intake.map((qa) => (
                <div key={qa.q} className="rounded-lg bg-muted-bg px-3 py-2">
                  <dt className="text-[11px] uppercase tracking-wide text-muted">{qa.q}</dt>
                  <dd className="mt-0.5 text-sm font-medium leading-snug">{qa.a}</dd>
                </div>
              ))}
            </dl>
          </Card>

          <DocumentsCard task={task} />
        </div>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  right,
  children,
  className,
  bodyClassName,
  tone,
}: {
  icon: React.ReactNode;
  title: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  tone?: "accent";
}) {
  return (
    <section className={cn("flex flex-col rounded-xl border border-border bg-card", className)}>
      <header
        className={cn(
          "flex shrink-0 items-center gap-2 border-b border-border px-5 py-3",
          tone === "accent" && "bg-accent-soft/60",
        )}
      >
        {icon}
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</h3>
        {right ? <span className="ml-auto">{right}</span> : null}
      </header>
      <div className={cn("px-5 py-4", bodyClassName)}>{children}</div>
    </section>
  );
}
