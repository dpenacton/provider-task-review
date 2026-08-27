import { Repeat2 } from "lucide-react";
import { useState } from "react";
import { ChangeMedModal } from "@/components/change-med-modal";
import { useTaskStore } from "@/lib/store";
import type { MedLine, Task } from "@/lib/types";
import { cn, money, PROVIDER_FEE } from "@/lib/utils";

export function MedBlock({ task }: { task: Task }) {
  const [changeFor, setChangeFor] = useState<{ lineId?: string; name?: string } | null>(null);

  return (
    <>
      {task.kind === "protocol" && task.protocol ? (
        <ProtocolCard task={task} onChange={() => setChangeFor({ name: task.protocol?.name })} />
      ) : (
        <div className="space-y-3">
          {task.lines.map((line, i) => (
            <LineCard
              key={line.id}
              task={task}
              line={line}
              showRefill={task.lines.length === 1}
              showFee={i === 0}
              onChange={() => setChangeFor({ lineId: line.id, name: line.name })}
            />
          ))}
          {task.lines.length > 1 ? (
            <section className="rounded-xl border border-border bg-card px-5 py-4">
              <RefillRow task={task} />
            </section>
          ) : null}
        </div>
      )}
      {changeFor ? (
        <ChangeMedModal
          taskId={task.id}
          lineId={changeFor.lineId}
          currentName={changeFor.name}
          onClose={() => setChangeFor(null)}
        />
      ) : null}
    </>
  );
}

function ProtocolCard({ task, onChange }: { task: Task; onChange: () => void }) {
  const proto = task.protocol!;
  const selectStep = useTaskStore((s) => s.selectStep);
  const selected = proto.steps.find((s) => s.id === proto.selectedStepId) ?? proto.steps[0];
  const setSig = useTaskStore((s) => s.setSig);

  return (
    <section className="rounded-xl border border-border bg-card">
      <header className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">Following protocol</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">{proto.name}</h2>
          <p className="mt-0.5 text-sm text-muted">
            {proto.steps.length} step{proto.steps.length === 1 ? "" : "s"} · pick one to start
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-lg font-semibold">
            {money(selected?.line.paidPrice ?? selected?.line.price ?? proto.price)}
          </p>
          <p className="tabular mt-0.5 whitespace-nowrap text-xs text-muted">
              {money(PROVIDER_FEE)} to you<span className="hidden sm:inline"> for this visit</span>
            </p>
        </div>
      </header>

      <div className="divide-y divide-border">
        {proto.steps.map((step) => {
          const on = proto.selectedStepId === step.id;
          return (
            <button
              key={step.id}
              type="button"
              onClick={() => selectStep(task.id, step.id)}
              className={cn(
                "flex w-full items-start gap-3 px-5 py-3.5 text-left transition-colors",
                on ? "bg-accent-soft/60" : "hover:bg-muted-bg/60",
              )}
            >
              <span
                className={cn(
                  "mt-1 flex size-4 shrink-0 items-center justify-center rounded-full border",
                  on ? "border-accent bg-accent" : "border-border",
                )}
              >
                {on ? <span className="size-1.5 rounded-full bg-white" /> : null}
              </span>
              <span className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-start gap-x-3 gap-y-0.5 sm:grid-cols-[104px_1fr_auto] sm:items-baseline sm:gap-4">
                <span className="col-start-1 row-start-1 text-xs font-semibold uppercase tracking-wide text-muted sm:whitespace-nowrap sm:text-sm sm:normal-case sm:tracking-normal sm:text-foreground">
                  {step.n}. {step.phase}
                </span>
                <span className="tabular col-start-2 row-start-1 shrink-0 text-sm font-semibold sm:col-start-3">
                  {money(step.line.price)}
                </span>
                <span className="col-span-2 col-start-1 row-start-2 min-w-0 sm:col-span-1 sm:col-start-2 sm:row-start-1">
                  <span className="block text-sm font-medium">{step.line.name}</span>
                  <span className="text-sm text-muted">
                    {step.line.route} · {step.line.quantity} · {step.line.daysSupply}d
                  </span>
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {selected ? (
        <div className="space-y-3 border-t border-border px-5 py-4">
          <SigField
            value={selected.line.sig}
            onChange={(v) => setSig(task.id, selected.line.id, v)}
            disabled={false}
          />
          <RefillRow task={task} />
          <button
            type="button"
            onClick={onChange}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <Repeat2 className="size-4" />
            Change medication or protocol
          </button>
        </div>
      ) : null}
    </section>
  );
}

function LineCard({
  task,
  line,
  showRefill,
  showFee,
  onChange,
}: {
  task: Task;
  line: MedLine;
  showRefill: boolean;
  showFee: boolean;
  onChange: () => void;
}) {
  const setSig = useTaskStore((s) => s.setSig);
  const declineLine = useTaskStore((s) => s.declineLine);
  const restoreLine = useTaskStore((s) => s.restoreLine);
  const multi = task.lines.length > 1;

  return (
    <section
      className={cn(
        "rounded-xl border bg-card",
        line.declined ? "border-danger-border opacity-70" : "border-border",
      )}
    >
      <header className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="min-w-0 flex-1">
          {task.kind === "prescribe" ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended medication</p>
          ) : task.refillOf ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Refill {task.refillOf.cycle} of {task.refillOf.of}
            </p>
          ) : null}
          <h2 className={cn("mt-1 text-lg font-semibold tracking-tight", line.declined && "line-through")}>
            {line.name}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {line.strength} · {line.form} · {line.quantity}
            {line.route ? ` · ${line.route}` : ""}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="tabular text-lg font-semibold">{money(line.paidPrice ?? line.price)}</p>
          {showFee ? (
            <p className="tabular mt-0.5 whitespace-nowrap text-xs text-muted">
              {money(PROVIDER_FEE)} to you<span className="hidden sm:inline"> for this visit</span>
            </p>
          ) : null}
        </div>
      </header>

      <div className="space-y-3 border-t border-border px-5 py-4">
        <SigField
          value={line.sig}
          onChange={(v) => setSig(task.id, line.id, v)}
          disabled={Boolean(line.declined)}
        />
        {showRefill ? <RefillRow task={task} /> : null}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onChange}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
          >
            <Repeat2 className="size-4" />
            Change medication
          </button>
          {multi ? (
            line.declined ? (
              <button
                type="button"
                onClick={() => restoreLine(task.id, line.id)}
                className="text-sm font-medium text-accent hover:underline"
              >
                Restore this line
              </button>
            ) : (
              <button
                type="button"
                onClick={() => declineLine(task.id, line.id)}
                className="text-sm font-medium text-danger hover:underline"
              >
                Decline this line
              </button>
            )
          ) : null}
        </div>
      </div>
    </section>
  );
}

function SigField({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted">Directions (SIG)</span>
      <textarea
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="mt-1 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none ring-accent/30 focus:ring-2 disabled:opacity-60"
      />
    </label>
  );
}

function RefillRow({ task }: { task: Task }) {
  const setAutoRefill = useTaskStore((s) => s.setAutoRefill);
  if (task.titrates) {
    return (
      <div className="rounded-lg bg-muted-bg px-3 py-2">
        <p className="text-sm font-medium">Re-evaluate each cycle</p>
        <p className="text-xs text-muted">Titrating product — each fill is a new Rx, even if they opted in at checkout.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted-bg px-3 py-2">
      <div>
        <p className="text-sm font-medium">
          {task.autoRefill ? "Auto-refill on" : "Auto-refill off"}
        </p>
        <p className="text-xs text-muted">
          {task.autoRefill
            ? "Patient opted in at checkout. You can turn it off."
            : "Patient did not opt in at checkout."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={task.autoRefill}
        onClick={() => setAutoRefill(task.id, !task.autoRefill)}
        className={cn(
          "relative h-6 w-11 shrink-0 rounded-full transition-colors outline-none ring-accent/30 focus-visible:ring-2",
          task.autoRefill ? "bg-accent" : "bg-zinc-300",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            task.autoRefill ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  );
}
