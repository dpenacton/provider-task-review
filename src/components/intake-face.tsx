import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

/** A miniature of the intake PDF's first page — enough to read as a document. */
export function IntakeFace({ task, rows = 6, className }: { task: Task; rows?: number; className?: string }) {
  return (
    <div className={cn("h-full w-full overflow-hidden bg-white p-[7%] text-foreground", className)}>
      <p className="text-[0.85em] font-semibold leading-tight">Intake form</p>
      <p className="mt-[1%] truncate text-[0.62em] text-muted">
        {task.patient.name} · {task.patient.code}
      </p>
      <div className="mt-[5%] space-y-[3.5%]">
        {task.intake.slice(0, rows).map((qa) => (
          <div key={qa.q} className="min-w-0">
            <p className="truncate text-[0.58em] leading-tight text-muted">{qa.q}</p>
            <p className="truncate text-[0.7em] font-medium leading-tight">{qa.a}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
