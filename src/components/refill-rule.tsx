import { Minus, Plus } from "lucide-react";
import { MAX_REFILL_REVIEW, refillRuleFor, reviewPoints, useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * The provider's own refill rule — not the patient's checkout auto-refill.
 * "Auto-approve the next N refills, then send it back to me" and it repeats:
 * with N = 3 the provider reviews (and is paid for) refills 4, 8, 12…
 * Renders flat: it is a section of the prescribe card, not a card of its own.
 */
export function RefillRule({ task }: { task: Task }) {
  const setRefillReview = useTaskStore((s) => s.setRefillReview);
  const n = refillRuleFor(task);

  if (task.titrates) {
    return (
      <div className="px-5 py-4">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Refill rule</h4>
        <p className="mt-1 text-sm font-medium">You review every cycle</p>
        <p className="mt-0.5 text-xs text-muted">
          Titrating product — each fill is a new Rx and comes back to you. No auto-approved run.
        </p>
      </div>
    );
  }

  const points = reviewPoints(n);

  return (
    <div className="px-5 py-4">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted">Refill rule</h4>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <div className="flex h-10 items-center rounded-lg border border-border bg-background">
          <button
            type="button"
            aria-label="Fewer auto-approved refills"
            disabled={n <= 0}
            onClick={() => setRefillReview(task.id, n - 1)}
            className="inline-flex size-9 items-center justify-center rounded-l-lg text-muted hover:text-foreground disabled:opacity-40"
          >
            <Minus className="size-4" />
          </button>
          <span className="tabular w-9 text-center text-base font-semibold">{n}</span>
          <button
            type="button"
            aria-label="More auto-approved refills"
            disabled={n >= MAX_REFILL_REVIEW}
            onClick={() => setRefillReview(task.id, n + 1)}
            className="inline-flex size-9 items-center justify-center rounded-r-lg text-muted hover:text-foreground disabled:opacity-40"
          >
            <Plus className="size-4" />
          </button>
        </div>
        <p className="min-w-0 flex-1 text-sm leading-snug">
          {n === 0 ? (
            <>Every refill comes back to you for review.</>
          ) : (
            <>
              Auto-approve the next <span className="font-semibold">{n}</span> refill{n === 1 ? "" : "s"}, then it comes
              back to you — and again after every {n}.
            </>
          )}
        </p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-1">
        {Array.from({ length: MAX_REFILL_REVIEW }, (_, i) => i + 1).map((r) => {
          const mine = points.includes(r);
          return (
            <span
              key={r}
              title={mine ? `You review refill ${r}` : `Refill ${r} auto-approved`}
              className={cn(
                "tabular inline-flex h-6 min-w-6 items-center justify-center rounded-md px-1.5 text-xs font-semibold",
                mine ? "bg-accent text-white" : "bg-muted-bg text-muted",
              )}
            >
              {r}
            </span>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">
        {points.length
          ? `Blue = you review and get paid — refill ${points.slice(0, 3).join(", ")}${points.length > 3 ? "…" : ""}.`
          : "Blue = you review and get paid."}{" "}
        The patient keeps their shipments on schedule either way.
      </p>
    </div>
  );
}
