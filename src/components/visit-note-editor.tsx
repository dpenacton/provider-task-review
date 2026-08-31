import { ChevronDown, Minus, PenLine, Plus, Redo2, Undo2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";
import { contentFor, fillTemplate, outcomeFor, templatesFor } from "@/lib/visit-notes";

/**
 * Visit note, ParkingMD-style: template picker, macro hint, outcome/template
 * peeks, a light rich-text surface and Sign Form. The note is stored as HTML.
 */
export function VisitNoteEditor({ task, className }: { task: Task; className?: string }) {
  const applyTemplate = useTaskStore((s) => s.applyVisitTemplate);
  const setVisitNote = useTaskStore((s) => s.setVisitNote);
  const signVisitNote = useTaskStore((s) => s.signVisitNote);

  const templates = useMemo(() => templatesFor(task), [task]);
  const selectedId = task.visitNoteTemplateId ?? "";
  const signed = Boolean(task.visitNoteSignedAt);

  const [showOutcome, setShowOutcome] = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [size, setSize] = useState(15);

  const editorRef = useRef<HTMLDivElement>(null);
  // Only re-seed the DOM when the underlying document changes — typing must not
  // reset the caret, so the editor stays uncontrolled between those moments.
  const docKey = `${task.id}:${selectedId}:${signed}`;
  const seeded = useRef("");

  useEffect(() => {
    const el = editorRef.current;
    if (!el || seeded.current === docKey) return;
    seeded.current = docKey;
    el.innerHTML = task.visitNote ?? "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docKey]);

  function onPick(id: string) {
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    applyTemplate(task.id, tpl.id, fillTemplate(tpl, task));
    seeded.current = "";
  }

  return (
    <section className={cn("flex min-h-0 flex-col rounded-xl border border-border bg-card", className)}>
      <header className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
        <PenLine className="size-4 text-muted" />
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Visit notes</h3>
        {signed ? (
          <span className="ml-auto rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
            Signed {task.visitNoteSignedAt}
          </span>
        ) : (
          <span className="ml-auto text-[11px] text-muted">Saved on sign</span>
        )}
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <label className="block text-xs font-medium text-muted">Insert visit notes content</label>
        <div className="relative mt-1">
          <select
            value={selectedId}
            disabled={signed}
            onChange={(e) => onPick(e.target.value)}
            className="h-10 w-full appearance-none rounded-lg border border-border bg-background pl-3 pr-9 text-sm outline-none ring-accent/30 focus:ring-2 disabled:opacity-60"
          >
            <option value="" disabled>
              Select a template…
            </option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        </div>

        <p className="mt-2 rounded-lg border border-accent-border bg-accent-soft px-3 py-2 text-xs leading-relaxed">
          <span className="font-semibold">Note:</span> the template replaces{" "}
          <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">#outcome</code> and{" "}
          <code className="rounded bg-white/70 px-1 py-0.5 font-mono text-[11px]">#content</code> when generating the
          PDF.
        </p>

        <div className="mt-2 flex flex-wrap gap-4">
          <Peek label="outcome" open={showOutcome} onToggle={() => setShowOutcome(!showOutcome)} />
          <Peek label="template content" open={showTemplate} onToggle={() => setShowTemplate(!showTemplate)} />
        </div>
        {showOutcome ? <PeekBody>{outcomeFor(task)}</PeekBody> : null}
        {showTemplate ? <PeekBody>{contentFor(task)}</PeekBody> : null}

        <div className="mt-3 overflow-hidden rounded-lg border border-border">
          <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted-bg/60 px-2 py-1.5">
            <ToolBtn label="Undo" onClick={() => document.execCommand("undo")}>
              <Undo2 className="size-4" />
            </ToolBtn>
            <ToolBtn label="Redo" onClick={() => document.execCommand("redo")}>
              <Redo2 className="size-4" />
            </ToolBtn>
            <span className="mx-1 h-5 w-px bg-border" />
            <span className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium">Normal</span>
            <span className="rounded-md border border-border bg-card px-2 py-1 text-xs font-medium">Arial</span>
            <span className="ml-auto flex items-center gap-1">
              <ToolBtn label="Smaller text" onClick={() => setSize((s) => Math.max(11, s - 1))}>
                <Minus className="size-4" />
              </ToolBtn>
              <span className="tabular w-6 text-center text-xs font-medium">{size}</span>
              <ToolBtn label="Larger text" onClick={() => setSize((s) => Math.min(22, s + 1))}>
                <Plus className="size-4" />
              </ToolBtn>
            </span>
          </div>

          {signed ? null : (
            <div className="border-b border-border px-2 py-2">
              <button
                type="button"
                onClick={() => {
                  if (!editorRef.current?.textContent?.trim()) {
                    toast.error("Insert a template or write the note before signing.");
                    return;
                  }
                  signVisitNote(task.id, new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }));
                  toast.success("Visit note signed.");
                }}
                className="h-9 rounded-lg bg-accent px-3 text-sm font-semibold text-white hover:opacity-90"
              >
                Sign Form
              </button>
            </div>
          )}

          <div
            ref={editorRef}
            contentEditable={!signed}
            suppressContentEditableWarning
            onInput={(e) => setVisitNote(task.id, (e.target as HTMLDivElement).innerHTML)}
            data-placeholder="Write something, or pick a template above."
            style={{ fontSize: `${size}px` }}
            className={cn(
              "rich min-h-[220px] px-3 py-3 leading-relaxed outline-none",
              signed && "bg-muted-bg/40 text-muted",
            )}
          />
        </div>
      </div>
    </section>
  );
}

function Peek({ label, open, onToggle }: { label: string; open: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="inline-flex items-center gap-1 text-xs font-semibold text-accent hover:underline"
    >
      <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
      {open ? "Hide" : "Show"} {label}
    </button>
  );
}

function PeekBody({ children }: { children: React.ReactNode }) {
  return (
    <p className="mt-2 rounded-lg bg-muted-bg px-3 py-2 text-xs leading-relaxed text-muted">{children}</p>
  );
}

function ToolBtn({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-card hover:text-foreground"
    >
      {children}
    </button>
  );
}
