import { ChevronLeft, ChevronRight, FileText, MessageSquare, Phone, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { OverviewTab } from "@/components/overview-tab";
import { VisitNoteEditor } from "@/components/visit-note-editor";
import { Button } from "@/components/ui/button";
import { extrasFor } from "@/lib/catalog";
import { DECLINE_REASONS } from "@/lib/demo-data";
import { isNeedsReview, nextPendingId, useTaskStore } from "@/lib/store";
import type { Task } from "@/lib/types";
import { cn, money } from "@/lib/utils";

type Tab = "overview" | "patient" | "visit" | "checkins" | "history" | "files" | "messages";

function kindLabel(task: Task) {
  if (task.kind === "protocol") return "Treatment plan";
  if (task.kind === "prescribe") return "Medical evaluation";
  return task.refillOf ? "Refill" : "Order evaluation";
}

export function ReviewView({
  task,
  onClose,
  onGo,
}: {
  task: Task;
  onClose: () => void;
  onGo: (taskId: string) => void;
}) {
  const tasks = useTaskStore((s) => s.tasks);
  const [tab, setTab] = useState<Tab>("overview");
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState(DECLINE_REASONS[0]!);
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
    setTab("overview");
    setDeclineOpen(false);
    setConfirmHard(false);
  }, [task.id]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (document.body.dataset.modalOpen === "true") return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      const editing =
        tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement | null)?.isContentEditable;
      if (e.key === "Escape") {
        if (declineOpen) setDeclineOpen(false);
        else onClose();
        return;
      }
      if (editing) return;
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
  }, [task.id, live, newPt, hard, declineOpen]);

  function step(dir: number) {
    if (!pendingIds.length) {
      onClose();
      return;
    }
    const i = idx >= 0 ? idx : 0;
    const next = pendingIds[(i + dir + pendingIds.length) % pendingIds.length];
    if (next) onGo(next);
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
    const next =
      res.nextId && res.nextId !== task.id ? res.nextId : nextPendingId(useTaskStore.getState().tasks, task.id);
    window.setTimeout(() => {
      const current = useTaskStore.getState().tasks.find((x) => x.id === task.id);
      if (!current || current.status === "pending" || current.status === "in_review") return;
      if (next && next !== task.id) onGo(next);
      else onClose();
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
      if (next) onGo(next);
      else onClose();
    }, 5200);
  }

  function onPrimary() {
    if (hard && !confirmHard) {
      setConfirmHard(true);
      return;
    }
    doApprove();
  }

  const p = task.patient;

  return (
    <div className="flex h-full min-h-0 flex-col bg-background">
      <header className="shrink-0 border-b border-border bg-card px-4 pt-3 md:px-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
              {p.name} <span className="font-normal text-muted">— State: {p.state}</span>{" "}
              <span className="font-normal text-muted">
                · DOB {p.dob} · {p.age} yrs
              </span>
            </h1>
            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted md:text-sm">
              <span className="font-medium text-foreground">{task.id}</span>
              <span>·</span>
              <span className="font-medium text-accent">
                {kindLabel(task)} ({task.mode})
              </span>
              <span>·</span>
              <span>{p.email}</span>
              <span>·</span>
              <span>{p.phone}</span>
              <span>·</span>
              <span>Patient code: {p.code}</span>
              {task.paidAmount != null ? (
                <>
                  <span>·</span>
                  <span className="tabular">Paid {money(task.paidAmount)}</span>
                </>
              ) : null}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            <IconBtn label="Call patient" onClick={() => toast("Demo — dials the patient in the live portal.")}>
              <Phone className="size-4" />
            </IconBtn>
            <IconBtn label="Message patient" onClick={() => setTab("messages")}>
              <MessageSquare className="size-4" />
            </IconBtn>
            <span className="mx-1 hidden h-6 w-px bg-border sm:block" />
            <IconBtn label="Previous pending" onClick={() => step(-1)}>
              <ChevronLeft className="size-4" />
            </IconBtn>
            <span className="tabular hidden whitespace-nowrap text-xs text-muted sm:inline">
              {idx >= 0 ? `${idx + 1} / ${pendingIds.length}` : "—"}
            </span>
            <IconBtn label="Next pending" onClick={() => step(1)}>
              <ChevronRight className="size-4" />
            </IconBtn>
            <IconBtn label="Close" onClick={onClose}>
              <X className="size-4" />
            </IconBtn>
          </div>
        </div>

        <div className="relative mt-2">
          <div ref={stripRef} onScroll={syncEdges} className="no-scrollbar flex snap-x gap-5 overflow-x-auto">
            {(
              [
                ["overview", "Overview"],
                ["visit", "Visit note"],
                ["patient", "Patient"],
                ["checkins", "Check-ins"],
                ["history", "History"],
                ["files", `Files (${task.docs.length})`],
                [
                  "messages",
                  extrasFor(task.id).messages.length
                    ? `Messages (${extrasFor(task.id).messages.length})`
                    : "Messages",
                ],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                data-tab={id}
                onClick={() => setTab(id)}
                className={cn(
                  "h-10 shrink-0 snap-start border-b-2 text-sm font-medium transition-colors",
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
            <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent" />
          ) : null}
          {edges.right ? (
            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
          ) : null}
        </div>
      </header>

      <div
        className="min-h-0 flex-1 overflow-y-auto px-3 py-3 md:px-4"
      >
        {tab === "overview" ? <OverviewTab task={task} /> : null}
        {tab === "patient" ? <PatientTab task={task} /> : null}
        {tab === "visit" ? <VisitNoteEditor task={task} className="mx-auto max-w-3xl" /> : null}
        {tab === "checkins" ? <CheckInsTab task={task} /> : null}
        {tab === "history" ? <HistoryTab task={task} /> : null}
        {tab === "files" ? <FilesTab task={task} /> : null}
        {tab === "messages" ? <MessagesTab task={task} /> : null}
      </div>

      {live ? (
        <div className="shrink-0 border-t border-border bg-card/95 shadow-bar backdrop-blur">
          <div className="flex flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:px-6">
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
                    {task.paidAmount != null ? "Decline & refund" : "Confirm decline"}
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-1 md:gap-2">
                  <Button variant="danger" onClick={() => setDeclineOpen(true)} className="flex-1 md:flex-none">
                    {task.paidAmount != null ? "Decline & refund" : "Decline"}
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
                  <Button variant="link" onClick={() => toast("Follow-up task created for 30 days.")}>
                    Follow up
                  </Button>
                </div>

                {newPt || hard ? (
                  <p className="hidden text-sm text-muted lg:block">Keyboard approve is off for this case.</p>
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
        <div className="shrink-0 border-t border-border bg-card px-4 py-3 md:px-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {task.status === "declined"
                ? `Declined${task.declineReason ? ` — ${task.declineReason}` : ""}`
                : "Signed"}
            </p>
            <button onClick={onClose} className="text-sm font-semibold text-accent hover:underline">
              Back to queue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function IconBtn({
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
      onClick={onClick}
      className="inline-flex size-9 items-center justify-center rounded-lg text-muted hover:bg-muted-bg hover:text-foreground"
    >
      {children}
    </button>
  );
}

function PatientTab({ task }: { task: Task }) {
  const p = task.patient;
  return (
    <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
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
    </div>
  );
}

function HistoryTab({ task }: { task: Task }) {
  return (
    <div className="mx-auto grid max-w-5xl gap-3 md:grid-cols-2">
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
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card">
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

function CheckInsTab({ task }: { task: Task }) {
  const items = extrasFor(task.id).checkIns;
  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card px-5 py-12 text-center">
        <p className="text-sm font-medium">No check-ins yet</p>
        <p className="mt-1 text-sm text-muted">Follow-up questionnaires will land here.</p>
      </div>
    );
  }
  return (
    <ul className="mx-auto max-w-3xl space-y-3">
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
    <div className="mx-auto max-w-3xl rounded-xl border border-border bg-card">
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
          <Button size="sm" onClick={() => toast("Demo — message would send in the live portal.")}>
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
