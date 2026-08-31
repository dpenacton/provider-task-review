import { Download, ExternalLink, X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";
import { IdFace } from "@/components/id-face";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export type DocKind = "id" | "intake";

/**
 * Inline preview so the provider can eyeball the ID or the intake PDF without
 * leaving the drawer. The filename still links out, so Ctrl-click keeps working
 * for anyone who'd rather have it in a tab.
 */
export function DocPreview({
  task,
  kind,
  name,
  side = "front",
  onSide,
  onClose,
}: {
  task: Task;
  kind: DocKind;
  name: string;
  side?: "front" | "back";
  /** Provided only when the ID was uploaded as two faces. */
  onSide?: (side: "front" | "back") => void;
  onClose: () => void;
}) {
  const href = kind === "id" ? `/id/${task.id}` : `/intake/${task.id}`;

  useEffect(() => {
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

  const p = task.patient;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button aria-label="Close preview" onClick={onClose} className="absolute inset-0 bg-foreground/50" />
      <div className="relative flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
        <header className="flex items-center gap-2 border-b border-border px-4 py-2.5">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name}</p>
            <p className="text-xs text-muted">
              {kind === "id" ? "Government ID" : "Intake form"} · {p.name}
            </p>
          </div>
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 text-xs font-semibold hover:border-accent hover:text-accent"
          >
            Open in tab
            <ExternalLink className="size-3.5" />
          </a>
          <button
            type="button"
            aria-label="Download"
            onClick={() => toast("Demo — the file downloads in the live portal.")}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-muted-bg hover:text-foreground"
          >
            <Download className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Close preview"
            onClick={onClose}
            className="inline-flex size-8 items-center justify-center rounded-md text-muted hover:bg-muted-bg hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto bg-background p-4">
          {kind === "id" ? (
            <div className="mx-auto max-w-md">
              {onSide ? (
                <div className="mb-3 flex gap-1 rounded-lg bg-muted-bg p-1">
                  {(["front", "back"] as const).map((sd) => (
                    <button
                      key={sd}
                      type="button"
                      onClick={() => onSide(sd)}
                      className={cn(
                        "h-8 flex-1 rounded-md text-xs font-semibold capitalize transition-colors",
                        side === sd ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground",
                      )}
                    >
                      {sd}
                    </button>
                  ))}
                </div>
              ) : null}
              <div className="aspect-[1.6/1] overflow-hidden rounded-xl border border-border text-[19px]">
                <IdFace patient={p} side={side} />
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-xl rounded-xl border border-border bg-card p-5">
              <h4 className="text-base font-semibold">Intake form — {p.name}</h4>
              <p className="mt-0.5 text-xs text-muted">
                {p.code} · {task.service}
              </p>
              <dl className="mt-4 divide-y divide-border">
                {task.intake.map((qa) => (
                  <div key={qa.q} className="py-2">
                    <dt className="text-xs text-muted">{qa.q}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{qa.a}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
