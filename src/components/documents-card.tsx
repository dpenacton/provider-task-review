import { Download, Eye, FileText, IdCard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { DocPreview, type DocKind } from "@/components/doc-preview";
import { IdFace } from "@/components/id-face";
import { IntakeFace } from "@/components/intake-face";
import { extrasFor, idDocsFor } from "@/lib/catalog";
import type { Task } from "@/lib/types";
import { cn, fmtDate } from "@/lib/utils";

/**
 * Two documents, two stacked sections — one for identity, one for the intake.
 * A patient's file is always that shape, so it is laid out as two named things
 * rather than a list that implies more are hiding below.
 */
export function DocumentsCard({ task }: { task: Task }) {
  const ids = idDocsFor(task);
  const extras = extrasFor(task.id);
  const [side, setSide] = useState<"front" | "back">("front");
  const [preview, setPreview] = useState<{ kind: DocKind; name: string } | null>(null);

  const twoSided = ids.length > 1;
  const idDoc = (side === "back" ? ids[1] : ids[0]) ?? ids[0];
  const idName = idDoc?.name ?? `${task.patient.code}-id.jpg`;
  const intakeName = `intake-${task.id.toLowerCase()}.pdf`;

  return (
    <>
      <section className="flex flex-col rounded-xl border border-border bg-card">
        <header className="flex shrink-0 items-center gap-2 border-b border-border px-5 py-3">
          <FileText className="size-4 text-muted" />
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted">Documents</h3>
        </header>

        <div className="divide-y divide-border">
          <DocSection
            icon={<IdCard className="size-4 text-muted" />}
            label="ID proof"
            name={idName}
            meta={idDoc?.date ?? fmtDate(task.createdAt)}
            href={`/id/${task.id}`}
            onPreview={() => setPreview({ kind: "id", name: idName })}
            thumb={
              <span className="block aspect-[1.6/1] w-24 overflow-hidden rounded-md border border-border text-[8px]">
                <IdFace patient={task.patient} side={side} />
              </span>
            }
            extra={
              twoSided ? (
                <div className="mt-2 inline-flex rounded-md bg-muted-bg p-0.5">
                  {(["front", "back"] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSide(s)}
                      className={cn(
                        "h-6 rounded px-2 text-[11px] font-semibold capitalize transition-colors",
                        side === s ? "bg-card text-foreground shadow-sm" : "text-muted hover:text-foreground",
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              ) : null
            }
          />

          <DocSection
            icon={<FileText className="size-4 text-muted" />}
            label="Intake"
            name={intakeName}
            meta={`${fmtDate(task.createdAt)} · ${task.intake.length} answers`}
            href={extras.intakeUrl}
            onPreview={() => setPreview({ kind: "intake", name: intakeName })}
            thumb={
              <span className="block aspect-[1.6/1] w-24 overflow-hidden rounded-md border border-border text-[8px]">
                <IntakeFace task={task} rows={4} />
              </span>
            }
          />
        </div>
      </section>

      {preview ? (
        <DocPreview
          task={task}
          kind={preview.kind}
          name={preview.name}
          side={side}
          onSide={twoSided ? setSide : undefined}
          onClose={() => setPreview(null)}
        />
      ) : null}
    </>
  );
}

/**
 * One document. The thumbnail and the filename both open the preview, the two
 * icons stay separately clickable, and the filename is a real link so a
 * Ctrl-click still opens the standalone page in a tab.
 */
function DocSection({
  icon,
  label,
  name,
  meta,
  href,
  thumb,
  extra,
  onPreview,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  meta: string;
  href: string;
  thumb: React.ReactNode;
  extra?: React.ReactNode;
  onPreview: () => void;
}) {
  return (
    <div className="px-5 py-4">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</h4>
        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onPreview}
            aria-label={`Preview ${name}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-muted-bg hover:text-accent"
          >
            <Eye className="size-4" />
          </button>
          <button
            type="button"
            onClick={() => toast("Demo — the file downloads in the live portal.")}
            aria-label={`Download ${name}`}
            className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-muted-bg hover:text-accent"
          >
            <Download className="size-4" />
          </button>
        </span>
      </div>

      <div className="mt-2 flex items-start gap-3">
        <button type="button" onClick={onPreview} aria-label={`Preview ${name}`} className="shrink-0">
          {thumb}
        </button>
        <div className="min-w-0 flex-1">
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-sm font-medium hover:text-accent hover:underline"
          >
            {name}
          </a>
          <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>
          {extra}
        </div>
      </div>
    </div>
  );
}
