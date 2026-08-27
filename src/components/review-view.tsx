import { Link, useNavigate } from "@tanstack/react-router";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  FileText,
  Lock,
  Phone,
  ShieldAlert,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MedBlock } from "@/components/med-block";
import { PatientRail } from "@/components/patient-rail";
import { Button } from "@/components/ui/button";
import { extrasFor } from "@/lib/catalog";
import { DECLINE_REASONS } from "@/lib/demo-data";
import { isNeedsReview, nextPendingId, useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn, initials, money } from "@/lib/utils";

type Tab = "review" | "patient" | "visit" | "checkins" | "history" | "files" | "messages";

export function ReviewView({ task }: { task: Task }) {
  const navigate = useNavigate();
  const tasks = useTaskStore((s) => s.tasks);
  const [tab, setTab] = useState<Tab>("review");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState(DECLINE_REASONS[0]!);
  const [advanced, setAdvanced] = useState(false);
  const [confirmHard, setConfirmHard] = useState(false);
  const stripRef = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ left: false, right: false });

  const live = isNeedsReview(task);
  const hard = Boolean(task.safety.hardStop);
  const newPt = task.patient.newPatient;
  const pendingIds = tasks.filter(isNeedsReview).map((t) => t.id);
  const idx = pendingIds.indexOf(task.id);

  const syncEdges = useCallback(() => {
    const el = stripRef.current;
    if (!el) return;
    setEdges({
      left: el.scrollLeft > 4,
      right: el.scrollLeft + el.clientWidth < el.scrollWidth - 4,
    });
  }, []);

  useEffect(() => {
    syncEdges();
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges, task.id]);

  useEffect(() => {
    stripRef.current
      ?.querySelector(`[data-tab="${tab}"]`)
      ?.scrollIntoView({ inline: "nearest", block: "nearest", behavior: "smooth" });
  }, [tab]);

  useEffect(() => {
    setTab("review");
    setDeclineOpen(false);
    setConfirmHard(false);
    setAdvanced(false);
  }, [task.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "a" || e.key === "A") {
        if (!live) return;
        if (newPt || hard) {
          toast("Review this one fully — keyboard approve is off.");
          return;
        }
        doApprove();
      }
      if (e.key === "d" || e.key === "D") {
        if (!live) return;
        setDeclineOpen(true);
      }
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task.id, live, newPt, hard]);

  function step(dir: number) {
    if (!pendingIds.length) {
      navigate({ to: "/tasks" });
      return;
    }
    const i = idx >= 0 ? idx : 0;
    const next = pendingIds[(i + dir + pendingIds.length) % pendingIds.length];
    if (next) navigate({ to: "/tasks/$taskId", params: { taskId: next } });
  }

  function ctaLabel() {
    if (task.kind === "protocol") return "Start treatment";
    if (task.kind === "prescribe") return "Prescribe";
    if (task.status === "partial") return "Approve remaining";
    return "Approve & Sign";
  }

  function doApprove() {
    const res = useTaskStore.getState().approve(task.id);
    if (!res.ok) {
      toast.error(res.reason ?? "Can't sign yet.");
      return;
    }
    toast.success("Signed. Held 5s before transmit.", {
      action: {
        label: "Undo",
        onClick: () => {
          useTaskStore.getState().undo();
        },
      },
    });
    const next = res.nextId && res.nextId !== task.id ? res.nextId : nextPendingId(useTaskStore.getState().tasks, task.id);
    window.setTimeout(() => {
      const current = useTaskStore.getState().tasks.find((x) => x.id === task.id);
      if (!current || current.status === "pending" || current.status === "in_review") return;
      if (next && next !== task.id) {
        navigate({ to: "/tasks/$taskId", params: { taskId: next } });
      } else {
        navigate({ to: "/tasks" });
      }
    }, 5200);
  }

  function doDecline() {
    const res = useTaskStore.getState().decline(task.id, reason);
    if (!res.ok) return;
    toast.success("Declined. Refund queued. Held 5s.", {
      action: {
        label: "Undo",
        onClick: () => {
          useTaskStore.getState().undo();
        },
      },
    });
    setDeclineOpen(false);
    const next = res.nextId && res.nextId !== task.id ? res.nextId : null;
    window.setTimeout(() => {
      const current = useTaskStore.getState().tasks.find((x) => x.id === task.id);
      if (!current || current.status !== "declined") return;
      if (next) navigate({ to: "/tasks/$taskId", params: { taskId: next } });
      else navigate({ to: "/tasks" });
    }, 5200);
  }

  function onPrimary() {
    if (hard && !confirmHard) {
      setConfirmHard(true);
      return;
    }
    doApprove();
  }

  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col">
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-2 md:px-8">
          <Link to="/tasks" className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline">
            <ChevronLeft className="size-4" />
            All tasks
          </Link>
          <div className="flex items-center gap-1">
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted-bg"
              onClick={() => step(-1)}
              aria-label="Previous pending"
            >
              <ChevronLeft className="size-4" />
            </button>
            <span className="tabular text-xs text-muted">
              {idx >= 0 ? `${idx + 1} of ${pendingIds.length} pending` : "Not in queue"}
            </span>
            <button
              className="inline-flex size-9 items-center justify-center rounded-lg hover:bg-muted-bg"
              onClick={() => step(1)}
              aria-label="Next pending"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="mx-auto max-w-[1320px] px-4 pb-4 md:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted-bg text-sm font-semibold">
                {initials(task.patient.name)}
              </span>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight">{task.patient.name}</h1>
                  {task.patient.licensed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-xs font-semibold text-success">
                      <Check className="size-3" />
                      Licensed in {task.patient.state}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-danger-soft px-2 py-0.5 text-xs font-semibold text-danger">
                      <Lock className="size-3" />
                      License mismatch
                    </span>
                  )}
                  {task.patient.newPatient ? (
                    <span className="rounded-full bg-warn-soft px-2 py-0.5 text-xs font-semibold text-warn">
                      New patient
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted-bg px-2 py-0.5 text-xs font-medium text-muted">
                      Returning
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">
                  {task.patient.code} · DOB {task.patient.dob} · {task.patient.age} yrs · {task.patient.sex}
                  {task.orderId ? ` · ${task.orderId}` : ""} · {task.id}
                </p>
                <p className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
                  <span>{task.patient.email}</span>
                  <span className="inline-flex items-center gap-1">
                    <Phone className="size-3.5" />
                    {task.patient.phone}
                  </span>
                </p>
              </div>
            </div>
            {task.paidAmount == null ? (
              <div className="shrink-0 text-left lg:text-right">
                <p className="text-sm font-medium uppercase tracking-wide text-muted">{task.mode} visit</p>
                <p className="text-base font-semibold">{task.service}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto -mb-px max-w-[1320px] px-4 md:px-8">
          <div className="relative">
            <div
              ref={stripRef}
              onScroll={syncEdges}
              className="no-scrollbar flex snap-x gap-6 overflow-x-auto"
            >
              {(
                [
                  ["review", "Review"],
                  ["patient", "Patient"],
                  [
                    "messages",
                    extrasFor(task.id).messages.length
                      ? `Messages (${extrasFor(task.id).messages.length})`
                      : "Messages",
                  ],
                  ["visit", "Visit note"],
                  ["checkins", "Check-ins"],
                  ["history", "History"],
                  ["files", `Files (${task.docs.length})`],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  data-tab={id}
                  onClick={() => setTab(id)}
                  className={cn(
                    "h-11 shrink-0 snap-start border-b-2 text-sm font-medium transition-colors",
                    tab === id
                      ? "border-accent text-accent"
                      : "border-transparent text-muted hover:border-border hover:text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {edges.left ? (
              <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-gradient-to-r from-card to-transparent" />
            ) : null}
            {edges.right ? (
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-card to-transparent" />
            ) : null}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1320px] flex-1 px-4 py-5 pb-40 md:px-8">
        {tab === "review" ? <ReviewTab task={task} advanced={advanced} setAdvanced={setAdvanced} /> : null}
        {tab === "patient" ? <PatientTab task={task} /> : null}
        {tab === "visit" ? <VisitNoteTab task={task} /> : null}
        {tab === "checkins" ? <CheckInsTab task={task} /> : null}
        {tab === "history" ? <HistoryTab task={task} /> : null}
        {tab === "files" ? <FilesTab task={task} /> : null}
        {tab === "messages" ? <MessagesTab task={task} /> : null}
      </div>

      {live ? (
        <div className="sticky bottom-0 z-20 border-t border-border bg-card/95 shadow-bar backdrop-blur">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:px-8">
            {declineOpen ? (
              <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center">
                <label className="flex min-w-0 flex-1 items-center gap-2 text-sm">
                  <span className="shrink-0 font-medium">Reason</span>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-background px-3 text-sm outline-none"
                  >
                    {DECLINE_REASONS.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </select>
                </label>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setDeclineOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="dangerSolid" onClick={doDecline}>
                    Confirm decline
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button
                    variant="danger"
                    onClick={() => setDeclineOpen(true)}
                    className="flex-1 md:flex-none"
                  >
                    Decline
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => {
                      useTaskStore.getState().markReview(task.id);
                      toast("Marked in review.");
                    }}
                  >
                    Mark review
                  </Button>
                  <Button
                    variant="link"
                    onClick={() => toast("Follow-up task created for 30 days.")}
                  >
                    Follow up
                  </Button>
                </div>

                {newPt || hard ? (
                  <p className="hidden text-sm text-muted lg:block">
                    Keyboard approve is off for this case.
                  </p>
                ) : null}

                <Button
                  size="lg"
                  disabled={!task.patient.licensed || (task.kind === "protocol" && !task.protocol?.selectedStepId)}
                  onClick={onPrimary}
                  className="w-full md:ml-auto md:w-auto md:min-w-44"
                >
                  {confirmHard ? "Confirm anyway" : ctaLabel()}
                </Button>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="border-t border-border bg-card px-4 py-3 md:px-8">
          <div className="mx-auto flex max-w-[1320px] items-center justify-between">
            <p className="text-sm font-medium">
              {task.status === "declined" ? `Declined${task.declineReason ? ` — ${task.declineReason}` : ""}` : "Signed"}
            </p>
            <Link to="/tasks" className="text-sm font-semibold text-accent hover:underline">
              Back to queue
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewTab({
  task,
  advanced,
  setAdvanced,
}: {
  task: Task;
  advanced: boolean;
  setAdvanced: (v: boolean) => void;
}) {
  const setNotes = useTaskStore((s) => s.setNotes);
  const setAdvancedFields = useTaskStore((s) => s.setAdvanced);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.9fr)]">
      <div className="space-y-4">
        {task.patient.newPatient ? (
          <div className="flex items-start gap-2 rounded-xl border border-warn-border bg-warn-soft px-4 py-3">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warn" />
            <p className="text-sm font-medium">
              First prescription for a new patient. FSMB expects a real review — quick-approve keys are off.
            </p>
          </div>
        ) : null}
        <MedBlock task={task} />

        <section className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-sm font-semibold">Provider notes</h3>
            <span className="text-xs font-medium text-danger">Internal only</span>
          </div>
          <textarea
            value={task.providerNotes}
            onChange={(e) => setNotes(task.id, e.target.value)}
            rows={3}
            placeholder="Optional notes about this decision…"
            className="mt-2 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none ring-accent/30 focus:ring-2"
          />
        </section>

        <section className="rounded-xl border border-border bg-card">
          <button
            type="button"
            onClick={() => setAdvanced(!advanced)}
            className="flex w-full items-center justify-between px-4 py-3 text-left"
          >
            <span>
              <span className="text-sm font-semibold">Advanced</span>
              <span className="ml-2 text-sm text-muted">One-time, maintenance, follow-up</span>
            </span>
            <span className="text-sm text-accent">{advanced ? "Hide" : "Show"}</span>
          </button>
          {advanced ? (
            <div className="space-y-4 border-t border-border px-4 py-4">
              <Toggle
                title="One-time treatment"
                hint="Auto-completes after delivery"
                on={task.oneTime}
                onChange={(v) => setAdvancedFields(task.id, { oneTime: v, maintenance: v ? false : task.maintenance })}
              />
              <Toggle
                title="Maintenance"
                hint="Keep the patient on the current step indefinitely"
                on={task.maintenance}
                onChange={(v) => setAdvancedFields(task.id, { maintenance: v, oneTime: v ? false : task.oneTime })}
              />
              <label className="block">
                <span className="text-sm font-medium">Create follow-up task after (days)</span>
                <input
                  type="number"
                  min={0}
                  value={task.followUpDays ?? ""}
                  onChange={(e) =>
                    setAdvancedFields(task.id, {
                      followUpDays: e.target.value === "" ? null : Number(e.target.value),
                    })
                  }
                  placeholder="Leave empty for none"
                  className="mt-1 h-11 w-28 rounded-lg border border-border bg-background px-3 text-sm outline-none"
                />
              </label>
            </div>
          ) : null}
        </section>
      </div>
      <PatientRail task={task} />
    </div>
  );
}

function Toggle({
  title,
  hint,
  on,
  onChange,
}: {
  title: string;
  hint: string;
  on: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={() => onChange(!on)}
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          on ? "bg-accent" : "bg-zinc-300",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform",
            on ? "translate-x-5" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

function PatientTab({ task }: { task: Task }) {
  const p = task.patient;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Identity</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <KV k="Name" v={p.name} />
          <KV k="Patient code" v={p.code} />
          <KV k="DOB" v={`${p.dob} (${p.age} yrs)`} />
          <KV k="Sex" v={p.sex} />
          <KV k="State" v={p.state} />
          <KV k="Email" v={p.email} />
          <KV k="Phone" v={p.phone} />
        </dl>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Clinical</h3>
        <dl className="mt-3 space-y-2 text-sm">
          <KV k="Height" v={p.height} />
          <KV k="Weight" v={p.weight} />
          <KV k="BMI" v={p.bmi} />
          <KV k="Allergies" v={p.allergies} />
          <KV k="Shipping" v={p.address} />
        </dl>
      </section>
      <section className="rounded-xl border border-border bg-card p-5 md:col-span-2">
        <h3 className="text-sm font-semibold">Full intake</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {task.intake.map((qa) => (
            <div key={qa.q} className="rounded-lg bg-muted-bg px-3 py-2">
              <p className="text-xs text-muted">{qa.q}</p>
              <p className="mt-0.5 text-sm font-medium">{qa.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function HistoryTab({ task }: { task: Task }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Past orders</h3>
        {task.pastOrders.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No previous orders.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border">
            {task.pastOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between py-2.5 text-sm">
                <span>
                  <span className="font-medium">{o.med}</span>
                  <span className="ml-2 text-muted">
                    {o.id} · {o.date}
                  </span>
                </span>
                <span className="tabular font-medium">{money(o.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-sm font-semibold">Previous prescriptions</h3>
        {task.prevRx.length === 0 ? (
          <p className="mt-3 text-sm text-muted">No previous prescriptions on file.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {task.prevRx.map((rx) => (
              <li key={rx.date + rx.med} className="text-sm">
                <p className="font-medium">{rx.med}</p>
                <p className="text-muted">{rx.sig}</p>
                <p className="mt-0.5 text-xs text-muted">
                  {rx.date} · {rx.prescriber}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function FilesTab({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-border bg-card">
      {task.docs.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">No files attached.</p>
      ) : (
        <ul className="divide-y divide-border">
          {task.docs.map((d) => (
            <li key={d.name} className="flex items-center gap-3 px-5 py-3">
              <FileText className="size-5 text-muted" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{d.name}</p>
                <p className="text-xs text-muted">
                  {d.kind} · {d.date}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toast("Demo — PDF opens in the real portal.")}
                className="text-sm font-semibold text-accent hover:underline"
              >
                View
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function VisitNoteTab({ task }: { task: Task }) {
  const extras = extrasFor(task.id);
  const value = task.visitNote ?? extras.visitNote;
  const setVisitNote = useTaskStore((s) => s.setVisitNote);
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-sm font-semibold">Visit note</h3>
        <span className="text-xs text-muted">Draft from this review — saved on sign</span>
      </div>
      <textarea
        value={value}
        onChange={(e) => setVisitNote(task.id, e.target.value)}
        rows={12}
        className="mt-3 w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed outline-none ring-accent/30 focus:ring-2"
      />
    </section>
  );
}

function CheckInsTab({ task }: { task: Task }) {
  const items = extrasFor(task.id).checkIns;
  if (items.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card px-5 py-12 text-center">
        <p className="text-sm font-medium">No check-ins yet</p>
        <p className="mt-1 text-sm text-muted">Follow-up questionnaires will land here.</p>
      </div>
    );
  }
  return (
    <ul className="space-y-3">
      {items.map((c) => (
        <li key={c.date + c.title} className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted">{c.date}</p>
          <p className="mt-1 text-sm font-semibold">{c.title}</p>
          <p className="mt-1 text-sm leading-relaxed">{c.note}</p>
        </li>
      ))}
    </ul>
  );
}

function MessagesTab({ task }: { task: Task }) {
  const items = extrasFor(task.id).messages;
  return (
    <div className="rounded-xl border border-border bg-card">
      {items.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">No messages yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((m, i) => (
            <li key={i} className="px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                {m.from === "patient" ? task.patient.name : "Clinic"} · {m.at}
              </p>
              <p className="mt-1.5 text-sm leading-relaxed">{m.body}</p>
            </li>
          ))}
        </ul>
      )}
      <div className="border-t border-border p-4">
        <textarea
          rows={3}
          placeholder="Write a message to the patient…"
          className="w-full resize-y rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-accent/30 focus:ring-2"
        />
        <div className="mt-2 flex justify-end">
          <Button
            size="sm"
            onClick={() => toast("Demo — message would send in the live portal.")}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-muted">{k}</dt>
      <dd className="text-right font-medium">{v}</dd>
    </div>
  );
}
