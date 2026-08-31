import { Repeat2 } from "lucide-react";
import { useState } from "react";
import { ChangeMedModal } from "@/components/change-med-modal";
import { useTaskStore } from "@/lib/store";
import type { MedLine, Task } from "@/lib/types";
import { cn, money, PROVIDER_FEE } from "@/lib/utils";

/**
 * Medication sections for the prescribe card. These render flat — dividers, no
 * nested panels — because they live inside one card and boxes-in-boxes make the
 * decision harder to read, not easier.
 */
export function MedBlock({ task }: { task: Task }) {
  const [changeFor, setChangeFor] = useState<{ lineId?: string; name?: string } | null>(null);

  return (
    <>
      {task.kind === "protocol" && task.protocol ? (
        <ProtocolSection task={task} onChange={() => setChangeFor({ name: task.protocol?.name })} />
      ) : (
        task.lines.map((line, i) => (
          <LineSection
            key={line.id}
            task={task}
            line={line}
            showFee={i === 0}
            onChange={() => setChangeFor({ lineId: line.id, name: line.name })}
          />
        ))
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

function Money({ price, showFee }: { price: number; showFee: boolean }) {
  return (
    <div className="shrink-0 text-right">
      <p className="tabular text-lg font-semibold">{money(price)}</p>
      {showFee ? (
        <p className="tabular mt-0.5 whitespace-nowrap text-xs text-muted">
          {money(PROVIDER_FEE)} to you<span className="hidden sm:inline"> for this visit</span>
        </p>
      ) : null}
    </div>
  );
}

function ChangeLink({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
    >
      <Repeat2 className="size-4" />
      {label}
    </button>
  );
}

function ProtocolSection({ task, onChange }: { task: Task; onChange: () => void }) {
  const proto = task.protocol!;
  const selectStep = useTaskStore((s) => s.selectStep);
  const setSig = useTaskStore((s) => s.setSig);
  const selected = proto.steps.find((s) => s.id === proto.selectedStepId) ?? proto.steps[0];

  return (
    <>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">Following protocol</p>
            <h2 className="mt-0.5 text-lg font-semibold tracking-tight">{proto.name}</h2>
            <p className="mt-0.5 text-sm text-muted">
              {proto.steps.length} step{proto.steps.length === 1 ? "" : "s"} · pick one to start
            </p>
          </div>
          <Money price={selected?.line.price ?? proto.price} showFee />
        </div>

        <div className="mt-2 divide-y divide-border border-y border-border">
          {proto.steps.map((step) => {
            const on = proto.selectedStepId === step.id;
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => selectStep(task.id, step.id)}
                className={cn(
                  "flex w-full items-start gap-3 py-2.5 pl-1 pr-2 text-left transition-colors",
                  on ? "bg-accent-soft/50" : "hover:bg-muted-bg/60",
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
          <div className="mt-3 space-y-3">
            <SigField value={selected.line.sig} onChange={(v) => setSig(task.id, selected.line.id, v)} disabled={false} />
            <ChangeLink onClick={onChange} label="Change medication or protocol" />
          </div>
        ) : null}
      </div>
    </>
  );
}

function LineSection({
  task,
  line,
  showFee,
  onChange,
}: {
  task: Task;
  line: MedLine;
  showFee: boolean;
  onChange: () => void;
}) {
  const setSig = useTaskStore((s) => s.setSig);
  const declineLine = useTaskStore((s) => s.declineLine);
  const restoreLine = useTaskStore((s) => s.restoreLine);
  const multi = task.lines.length > 1;

  return (
    <div className={cn("px-5 py-4", line.declined && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          {task.kind === "prescribe" ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Recommended medication</p>
          ) : task.refillOf ? (
            <p className="text-xs font-semibold uppercase tracking-wide text-accent">
              Refill {task.refillOf.cycle} of {task.refillOf.of}
            </p>
          ) : null}
          <h2 className={cn("mt-0.5 text-lg font-semibold tracking-tight", line.declined && "line-through")}>
            {line.name}
          </h2>
          <p className="mt-0.5 text-sm text-muted">
            {line.strength} · {line.form} · {line.quantity}
            {line.route ? ` · ${line.route}` : ""}
          </p>
        </div>
        <Money price={line.price} showFee={showFee} />
      </div>

      <div className="mt-3 space-y-3">
        <SigField value={line.sig} onChange={(v) => setSig(task.id, line.id, v)} disabled={Boolean(line.declined)} />
        <div className="flex flex-wrap items-center gap-4">
          <ChangeLink onClick={onChange} label="Change medication" />
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
    </div>
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
