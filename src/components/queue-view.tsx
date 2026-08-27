import { Link } from "@tanstack/react-router";
import {
  CheckCircle2,
  ChevronDown,
  Clock3,
  ExternalLink,
  RotateCcw,
  Search,
  Video,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { isNeedsReview, useTaskStore } from "@/lib/store";
import type { QueueFilter, Task } from "@/lib/types";
import { cn, initials, money } from "@/lib/utils";

const FILTERS: { id: QueueFilter; label: string }[] = [
  { id: "needs", label: "Needs review" },
  { id: "order", label: "Orders" },
  { id: "treatment", label: "Treatments" },
  { id: "refill", label: "Refills" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
];

function kindLabel(t: Task) {
  if (t.kind === "order") return t.refillOf ? "Refill" : "Order";
  if (t.kind === "protocol") return "Protocol";
  return "Prescribe";
}

function medSummary(t: Task) {
  if (t.protocol) return t.protocol.name;
  const first = t.lines[0]?.name ?? t.service;
  if (t.lines.length > 1) return `${first} +${t.lines.length - 1} more`;
  return first;
}

function matches(t: Task, q: string) {
  if (!q.trim()) return true;
  const s = q.toLowerCase();
  return [t.patient.name, t.patient.code, t.patient.email, t.patient.phone, t.id, t.orderId, t.service, medSummary(t)]
    .filter(Boolean)
    .some((v) => v!.toLowerCase().includes(s));
}

function inFilter(t: Task, f: QueueFilter) {
  if (f === "needs") return isNeedsReview(t);
  if (f === "order") return isNeedsReview(t) && t.kind === "order" && !t.refillOf;
  if (f === "treatment") return isNeedsReview(t) && (t.kind === "protocol" || t.kind === "prescribe");
  if (f === "refill") return isNeedsReview(t) && Boolean(t.refillOf);
  if (f === "done") return t.status === "approved" || t.status === "declined" || t.status === "partial";
  return true;
}

export function QueueView() {
  const tasks = useTaskStore((s) => s.tasks);
  const filter = useTaskStore((s) => s.filter);
  const search = useTaskStore((s) => s.search);
  const setFilter = useTaskStore((s) => s.setFilter);
  const setSearch = useTaskStore((s) => s.setSearch);
  const reset = useTaskStore((s) => s.reset);
  const [blocked, setBlocked] = useState<Task[] | null>(null);

  const visible = useMemo(
    () => tasks.filter((t) => inFilter(t, filter) && matches(t, search)),
    [tasks, filter, search],
  );
  const pending = tasks.filter(isNeedsReview);
  const pendingAsync = pending.filter((t) => t.mode === "async").length;
  const pendingSync = pending.filter((t) => t.mode === "sync").length;
  const done = tasks.filter((t) => t.status === "approved" || t.status === "partial");
  const doneAsync = done.filter((t) => t.mode === "async").length;
  const doneSync = done.filter((t) => t.mode === "sync").length;

  function openPendingTabs() {
    if (pending.length === 0) {
      toast("Nothing waiting.");
      return;
    }
    const blockedOnes: Task[] = [];
    for (const t of pending) {
      const w = window.open(`/tasks/${t.id}`, "_blank", "noopener");
      if (!w) blockedOnes.push(t);
    }
    if (blockedOnes.length) {
      setBlocked(blockedOnes);
      toast.error("Browser blocked some tabs. Open them from the list below, or Ctrl-click rows.");
    } else {
      toast.success(`Opened ${pending.length} tab${pending.length === 1 ? "" : "s"}.`);
    }
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-4 md:px-8 md:py-6">
      <div className="flex items-center justify-between gap-3 md:items-end md:gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight md:text-2xl">Tasks</h1>
          <p className="mt-0.5 truncate text-sm text-muted md:mt-1">
            {pending.length === 0 ? (
              "Queue is clear."
            ) : (
              <>
                {pending.length} waiting
                <span className="hidden md:inline"> · click a row or Ctrl-click to open in a new tab.</span>
              </>
            )}
          </p>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={openPendingTabs}
            disabled={pending.length === 0}
            className="max-md:size-10 max-md:px-0"
            aria-label="Open pending in tabs"
          >
            <ExternalLink />
            <span className="hidden md:inline">Open pending in tabs</span>
            {pending.length > 0 ? (
              <span className="tabular hidden rounded-full bg-muted-bg px-1.5 text-xs font-semibold md:inline">
                {pending.length}
              </span>
            ) : null}
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() => {
              reset();
              toast("Demo reset.");
            }}
            className="max-md:size-10 max-md:px-0"
            aria-label="Reset demo"
          >
            <RotateCcw />
            <span className="hidden md:inline">Reset demo</span>
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 divide-x divide-border overflow-hidden rounded-xl border border-border bg-card md:mt-5 md:gap-3 md:divide-x-0 md:border-0 md:bg-transparent lg:grid-cols-4">
        <Stat
          label="Pending async"
          short="Async"
          value={pendingAsync}
          icon={<Clock3 className="size-5 text-accent" />}
        />
        <Stat label="Pending sync" short="Sync" value={pendingSync} icon={<Video className="size-5 text-accent" />} />
        <Stat
          label="Signed today"
          short="Signed"
          value={doneAsync}
          icon={<CheckCircle2 className="size-5 text-success" />}
        />
        <Stat
          label="Sync signed"
          short="Sync ✓"
          value={doneSync}
          icon={<CheckCircle2 className="size-5 text-success" />}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 md:mt-5">
        <div className="flex items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search patient, email, task…"
              className="h-10 w-full rounded-lg border border-border bg-card pl-10 pr-3 text-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 md:h-11"
            />
          </div>
          <div className="relative shrink-0 sm:hidden">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as QueueFilter)}
              aria-label="Filter tasks"
              className="h-10 appearance-none rounded-lg border border-border bg-card pl-3 pr-8 text-sm font-medium outline-none ring-accent/30 focus:ring-2"
            >
              {FILTERS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          </div>
        </div>
        <div className="no-scrollbar hidden snap-x gap-1 overflow-x-auto sm:flex sm:w-fit sm:max-w-full sm:flex-wrap sm:rounded-lg sm:bg-muted-bg sm:p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "h-9 shrink-0 snap-start rounded-lg border px-3 text-sm font-medium transition-colors sm:rounded-md sm:border-0",
                filter === f.id
                  ? "border-transparent bg-primary text-primary-fg sm:bg-card sm:text-foreground sm:shadow-sm"
                  : "border-border bg-card text-muted hover:text-foreground sm:border-0 sm:bg-transparent",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {blocked && blocked.length > 0 ? (
        <div className="mt-4 rounded-xl border border-warn-border bg-warn-soft p-4">
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium">
              Open the rest in new tabs — Ctrl-click also works on any row.
            </p>
            <button className="text-sm text-muted hover:text-foreground" onClick={() => setBlocked(null)}>
              Dismiss
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {blocked.map((t) => (
              <a
                key={t.id}
                href={`/tasks/${t.id}`}
                target="_blank"
                rel="noreferrer"
                className="rounded-md border border-border bg-card px-3 py-1.5 text-sm font-medium hover:border-accent"
              >
                {t.patient.name}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(220px,1.3fr)_minmax(220px,1.4fr)_88px_minmax(120px,0.8fr)_auto] gap-4 border-b border-border bg-muted-bg/60 px-5 py-2.5 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
          <span>Patient</span>
          <span>What to review</span>
          <span>Visit</span>
          <span>Due</span>
          <span className="text-right">Action</span>
        </div>

        {visible.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-base font-medium">Nothing in this view</p>
            <p className="mt-1 text-sm text-muted">Clear search or switch filters. Reset demo to restore cases.</p>
          </div>
        ) : (
          <ul>
            {visible.map((t) => (
              <li key={t.id} className="border-b border-border last:border-0">
                <Link
                  to="/tasks/$taskId"
                  params={{ taskId: t.id }}
                  className="grid grid-cols-1 gap-1 px-4 py-3 transition-colors hover:bg-muted-bg/50 md:grid-cols-[minmax(220px,1.3fr)_minmax(220px,1.4fr)_88px_minmax(120px,0.8fr)_auto] md:items-center md:gap-4 md:px-5 md:py-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-muted-bg text-sm font-semibold md:size-11">
                      {initials(t.patient.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-base font-semibold">{t.patient.name}</span>
                        {t.patient.newPatient ? (
                          <span className="shrink-0 rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                            New
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-0.5 truncate text-sm text-muted">
                        {t.patient.code} · {t.patient.age}y · {t.patient.state}
                        {t.patient.licensed ? "" : " · unlicensed"}
                      </p>
                    </div>
                    <span className="shrink-0 md:hidden">
                      <StatusDue t={t} />
                    </span>
                  </div>

                  <div className="min-w-0 ps-[52px] md:ps-0">
                    <p className="flex min-w-0 items-center gap-1.5 text-sm md:hidden">
                      <KindChip t={t} />
                      <span className="truncate font-medium">{medSummary(t)}</span>
                      {t.paidAmount != null ? (
                        <span className="tabular shrink-0 text-muted">· {money(t.paidAmount)}</span>
                      ) : null}
                    </p>

                    <div className="hidden md:block">
                      <p className="truncate text-base font-medium">{medSummary(t)}</p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm text-muted">
                        <KindChip t={t} />
                        <span>{t.service}</span>
                        {t.paidAmount != null ? <span className="tabular">· {money(t.paidAmount)}</span> : null}
                        {t.autoRefill ? (
                          <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-xs font-medium text-accent">
                            Auto-refill
                          </span>
                        ) : t.titrates ? (
                          <span className="rounded-full bg-muted-bg px-1.5 py-0.5 text-xs font-medium">
                            Re-evaluate each cycle
                          </span>
                        ) : null}
                      </p>
                    </div>
                  </div>

                  <div className="hidden md:block">
                    <span
                      className={cn(
                        "inline-flex rounded-md px-2 py-1 text-xs font-semibold uppercase",
                        t.mode === "sync" ? "bg-accent-soft text-accent" : "bg-muted-bg text-muted",
                      )}
                    >
                      {t.mode}
                    </span>
                  </div>

                  <div className="hidden md:block">
                    <StatusDue t={t} />
                  </div>

                  <div className="hidden md:flex md:items-center md:justify-end">
                    <span className="inline-flex h-11 items-center rounded-lg border border-border bg-card px-4 text-sm font-semibold">
                      {isNeedsReview(t) ? "Review" : "Open"}
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  short,
  value,
  icon,
}: {
  label: string;
  short: string;
  value: number;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-3 py-2 md:rounded-xl md:border md:border-border md:bg-card md:px-4 md:py-3">
      <div className="min-w-0">
        <p className="truncate text-[11px] font-medium uppercase tracking-wide text-muted md:text-xs">
          <span className="md:hidden">{short}</span>
          <span className="hidden md:inline">{label}</span>
        </p>
        <p className="tabular text-lg font-semibold tracking-tight md:mt-1 md:text-2xl">{value}</p>
      </div>
      <span className="hidden size-10 items-center justify-center rounded-full bg-muted-bg md:flex">{icon}</span>
    </div>
  );
}

function KindChip({ t }: { t: Task }) {
  const label = kindLabel(t);
  const cls =
    t.kind === "order"
      ? "bg-accent-soft text-accent"
      : t.kind === "protocol"
        ? "bg-success-soft text-success"
        : "bg-muted-bg text-foreground";
  return <span className={cn("rounded-full px-1.5 py-0.5 text-xs font-semibold", cls)}>{label}</span>;
}

function StatusDue({ t }: { t: Task }) {
  if (t.status === "approved" || t.status === "partial") {
    return <span className="text-sm font-medium text-success">Signed</span>;
  }
  if (t.status === "declined") {
    return <span className="text-sm font-medium text-danger">Declined</span>;
  }
  if (t.status === "in_review") {
    return <span className="text-sm font-medium text-accent">In review</span>;
  }
  if (t.overdueDays > 0) {
    return (
      <span className="inline-flex items-center rounded-md bg-danger-soft px-2 py-1 text-xs font-semibold text-danger">
        Overdue {t.overdueDays}d
      </span>
    );
  }
  return <span className="text-sm text-muted">Due today</span>;
}
