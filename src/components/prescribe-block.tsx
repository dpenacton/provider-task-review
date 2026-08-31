import { ArrowRight, ChevronDown, Pill, ShieldAlert } from "lucide-react";
import { MedBlock } from "@/components/med-block";
import { RefillRule } from "@/components/refill-rule";
import { useState } from "react";
import { useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn, money } from "@/lib/utils";

function liveTotal(task: Task) {
  if (task.protocol) {
    const step = task.protocol.steps.find((s) => s.id === task.protocol?.selectedStepId);
    return step?.line.price ?? task.protocol.price;
  }
  return task.lines.filter((l) => !l.declined).reduce((sum, l) => sum + l.price, 0);
}

function heading(task: Task) {
  if (task.kind === "protocol") return "Treatment plan";
  if (task.kind === "prescribe") return "Prescribe";
  return task.refillOf ? `Refill ${task.refillOf.cycle} of ${task.refillOf.of}` : "Order evaluation";
}

/**
 * Everything the provider decides, in one card: what's being dispensed, the
 * money on both sides, the refill rule and the note. This is the primary card
 * on the screen, so it carries the heavier heading and the roomier padding.
 * Flat sections divided by rules — never a panel inside a panel.
 */
export function PrescribeBlock({ task, className }: { task: Task; className?: string }) {
  const setNotes = useTaskStore((s) => s.setNotes);
  const [notesOpen, setNotesOpen] = useState(Boolean(task.providerNotes));
  const paid = task.paidAmount;
  const total = liveTotal(task);
  const delta = paid != null ? Math.round((total - paid) * 100) / 100 : 0;

  return (
    <section className={cn("flex flex-col rounded-xl border border-border bg-card shadow-card", className)}>
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-5 py-3.5">
        <Pill className="size-[18px] text-accent" />
        <h3 className="text-sm font-semibold tracking-tight">{heading(task)}</h3>
        {paid != null ? (
          <p className="ml-auto text-xs text-muted">
            Patient paid <span className="tabular font-semibold text-foreground">{money(paid)}</span> at checkout
          </p>
        ) : null}
      </header>

      {task.safety.hardStop ? (
        <div className="flex items-start gap-2 border-b border-danger-border bg-danger-soft px-5 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" />
          <p className="text-sm font-semibold text-danger">{task.safety.hardStop}</p>
        </div>
      ) : task.safety.flags.length ? (
        <div className="flex items-start gap-2 border-b border-warn-border bg-warn-soft px-5 py-3">
          <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" />
          <div>
            {task.safety.flags.map((f) => (
              <p key={f} className="text-sm font-medium">
                {f}
              </p>
            ))}
          </div>
        </div>
      ) : null}

      <div className="divide-y divide-border">
        <MedBlock task={task} />

        {paid != null ? <PriceDifference paid={paid} total={total} delta={delta} /> : null}

        <RefillRule task={task} />

        <div>
          <button
            type="button"
            onClick={() => setNotesOpen(!notesOpen)}
            className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
          >
            <span className="flex min-w-0 flex-1 items-baseline gap-2">
              <span className="shrink-0 text-sm font-semibold">Provider notes</span>
              <span className="truncate text-sm text-muted">
                {task.providerNotes || "Internal only — optional"}
              </span>
            </span>
            <ChevronDown className={cn("size-4 shrink-0 text-muted transition-transform", notesOpen && "rotate-180")} />
          </button>
          {notesOpen ? (
            <div className="px-5 pb-4">
              <textarea
                value={task.providerNotes}
                onChange={(e) => setNotes(task.id, e.target.value)}
                rows={3}
                placeholder="Optional notes about this decision…"
                className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none ring-accent/30 focus:ring-2"
              />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

/** What the swap actually does to the patient's card, with the arithmetic shown. */
function PriceDifference({ paid, total, delta }: { paid: number; total: number; delta: number }) {
  const none = Math.abs(delta) < 0.005;
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4">
      <div className="min-w-0">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Price difference</h4>
        <p className="tabular mt-0.5 flex items-center gap-1.5 text-xs text-muted">
          Paid {money(paid)}
          <ArrowRight className="size-3" />
          new total {money(total)}
        </p>
      </div>
      <p
        className={cn(
          "tabular shrink-0 text-sm font-semibold",
          none ? "text-muted" : delta > 0 ? "text-warn" : "text-success",
        )}
      >
        {none ? (
          "No adjustment needed"
        ) : delta > 0 ? (
          <>Patient will be charged an additional {money(delta)}</>
        ) : (
          <>Patient will be refunded {money(-delta)}</>
        )}
      </p>
    </div>
  );
}
