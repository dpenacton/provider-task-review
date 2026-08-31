import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { CATALOG_MEDS, CATALOG_TREATMENTS } from "@/lib/catalog";
import { useTaskStore } from "@/lib/store";
import type { CatalogMed, CatalogTreatment } from "@/lib/types";
import { cn, money } from "@/lib/utils";

type Pane = "meds" | "treatments";

export function ChangeMedModal({
  taskId,
  lineId,
  currentName,
  onClose,
}: {
  taskId: string;
  lineId?: string;
  currentName?: string;
  onClose: () => void;
}) {
  const [pane, setPane] = useState<Pane>("meds");
  const [q, setQ] = useState("");
  const applyMed = useTaskStore((s) => s.applyMed);
  const applyTreatment = useTaskStore((s) => s.applyTreatment);

  useEffect(() => {
    // Flagged so the drawer's own Escape handler doesn't close underneath us.
    document.body.dataset.modalOpen = "true";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    }
    window.addEventListener("keydown", onKey, true);
    return () => {
      delete document.body.dataset.modalOpen;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [onClose]);

  const meds = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CATALOG_MEDS.filter(
      (m) =>
        !s ||
        m.name.toLowerCase().includes(s) ||
        m.category.toLowerCase().includes(s) ||
        m.strength.toLowerCase().includes(s),
    );
  }, [q]);

  const treatments = useMemo(() => {
    const s = q.trim().toLowerCase();
    return CATALOG_TREATMENTS.filter(
      (t) => !s || t.name.toLowerCase().includes(s) || t.category.toLowerCase().includes(s),
    );
  }, [q]);

  function pickMed(m: CatalogMed) {
    applyMed(taskId, m, lineId);
    onClose();
  }
  function pickTx(t: CatalogTreatment) {
    applyTreatment(taskId, t);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <button className="absolute inset-0 bg-foreground/40" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-label="Change medication"
        className="relative flex max-h-[88vh] w-full max-w-xl flex-col rounded-t-2xl border border-border bg-card shadow-lg sm:rounded-2xl"
      >
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <h2 className="text-base font-semibold">Change medication</h2>
            <p className="text-sm text-muted">Search the catalog, or pick a treatment protocol.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-10 items-center justify-center rounded-lg hover:bg-muted-bg"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search medications or treatments…"
              className="h-11 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm outline-none ring-accent/30 focus:ring-2"
            />
          </div>
          <div className="mt-3 flex gap-1 rounded-lg bg-muted-bg p-1">
            {(
              [
                ["meds", `Medications (${meds.length})`],
                ["treatments", `Treatments (${treatments.length})`],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onClick={() => setPane(id)}
                className={cn(
                  "h-9 flex-1 rounded-md text-sm font-medium",
                  pane === id ? "bg-card shadow-sm" : "text-muted",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
          {pane === "meds"
            ? meds.map((m) => {
                const current = m.name === currentName;
                return (
                  <button
                    key={m.id}
                    type="button"
                    disabled={current}
                    onClick={() => pickMed(m)}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left",
                      current ? "bg-muted-bg" : "hover:bg-muted-bg/70",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{m.name}</span>
                      <span className="text-xs text-muted">
                        {m.category} · {m.strength} · {m.form} · {m.quantity}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-sm font-semibold">
                      {money(m.price)}
                      {current ? <span className="ml-2 text-xs font-medium text-muted">Current</span> : null}
                    </span>
                  </button>
                );
              })
            : treatments.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTx(t)}
                  className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-muted-bg/70"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{t.name}</span>
                    <span className="text-xs text-muted">
                      {t.category} · {t.steps.length} step{t.steps.length === 1 ? "" : "s"}
                      {t.titrates ? " · re-evaluate each cycle" : ""}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-sm font-semibold">{money(t.price)}</span>
                </button>
              ))}
          {(pane === "meds" ? meds : treatments).length === 0 ? (
            <p className="px-3 py-8 text-center text-sm text-muted">No matches.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
