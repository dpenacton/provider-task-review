import type { Patient } from "@/lib/types";
import { cn, initials } from "@/lib/utils";

/**
 * A stand-in render of the licence the patient uploaded. The same faces back
 * both the tile thumbnail and the full preview, so what the provider clicks is
 * what they get — just larger.
 */
export function IdFace({ patient, side, className }: { patient: Patient; side: "front" | "back"; className?: string }) {
  const p = patient;
  if (side === "back") {
    return (
      <div className={cn("flex h-full w-full flex-col gap-[6%] bg-zinc-100 p-[6%] text-foreground", className)}>
        <div className="flex h-[22%] items-end gap-[3%]">
          {Array.from({ length: 34 }, (_, i) => (
            <span
              key={i}
              className="h-full bg-foreground/80"
              style={{ width: `${(i % 4) + 1}px`, opacity: i % 3 ? 1 : 0.5 }}
            />
          ))}
        </div>
        <div className="space-y-[3%] leading-tight">
          <Line label="Address" value={p.address} />
          <Line label="Class" value="C — Operator" />
          <Line label="Restrictions" value="None" />
          <Line label="Endorsements" value="None" />
          <Line label="Issued" value="03/14/2023" />
          <Line label="Expires" value="03/14/2031" />
        </div>
      </div>
    );
  }
  return (
    <div className={cn("flex h-full w-full flex-col bg-zinc-100 p-[6%] text-foreground", className)}>
      <p className="text-[0.72em] font-semibold uppercase tracking-wide text-muted">
        {p.state} · Driver licence
      </p>
      <div className="mt-[5%] flex min-h-0 flex-1 gap-[5%]">
        <div className="flex aspect-[3/4] h-full max-h-full shrink-0 items-center justify-center rounded-[3px] bg-foreground/85 text-[1.1em] font-semibold text-white">
          {initials(p.name)}
        </div>
        <div className="min-w-0 flex-1 space-y-[4%] leading-tight">
          <Line label="Name" value={p.name} />
          <Line label="DOB" value={p.dob} />
          <Line label="Sex" value={p.sex} />
          <Line label="State" value={p.state} />
          <Line label="ID" value={p.code} />
        </div>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-[0.62em] uppercase tracking-wide text-muted">{label}</p>
      <p className="truncate text-[0.8em] font-semibold">{value}</p>
    </div>
  );
}
