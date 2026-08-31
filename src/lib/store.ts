import { create } from "zustand";
import { persist } from "zustand/middleware";
import { medById } from "@/lib/catalog";
import { SEED_TASKS } from "@/lib/demo-data";
import type { CatalogMed, CatalogTreatment, MedLine, ProtocolStep, QueueFilter, Task, TaskStatus } from "@/lib/types";

function lineFromMed(med: CatalogMed, from?: Partial<MedLine>): MedLine {
  return {
    id: med.id,
    name: med.name,
    strength: med.strength,
    form: med.form,
    route: med.route,
    quantity: med.quantity,
    daysSupply: med.daysSupply,
    sig: med.sig,
    price: med.price,
    swaps: [],
    ...from,
  };
}

function stepsFromTreatment(tx: CatalogTreatment): ProtocolStep[] {
  return tx.steps.map((s) => {
    const med = medById(s.medId);
    if (!med) throw new Error(`Missing catalog med ${s.medId}`);
    return { id: `${tx.id}-${s.n}`, n: s.n, phase: s.phase, line: lineFromMed(med) };
  });
}

const HOLD_MS = 5000;

/** Most refills a provider can hand out before the next paid review. */
export const MAX_REFILL_REVIEW = 12;
/** What the rule defaults to when the provider hasn't touched it. */
export const DEFAULT_REFILL_REVIEW = 3;

/**
 * Auto-approved refills between paid provider reviews. Titrating products always
 * come back each cycle, so they can never carry an auto-approved run.
 */
export function refillRuleFor(t: Task) {
  if (t.titrates) return 0;
  return t.refillReview ?? DEFAULT_REFILL_REVIEW;
}

/** Refill numbers the provider gets paid to review, given the rule. */
export function reviewPoints(interval: number, upTo = MAX_REFILL_REVIEW) {
  if (interval <= 0) return Array.from({ length: upTo }, (_, i) => i + 1);
  const out: number[] = [];
  for (let n = interval + 1; n <= upTo; n += interval + 1) out.push(n);
  return out;
}

interface Transmit {
  taskId: string;
  snapshot: Task;
  timeout: ReturnType<typeof setTimeout> | null;
}

interface TaskState {
  tasks: Task[];
  filter: QueueFilter;
  search: string;
  transmit: Transmit | null;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setFilter: (f: QueueFilter) => void;
  setSearch: (s: string) => void;
  update: (id: string, patch: (t: Task) => Task) => void;
  approve: (id: string) => { ok: boolean; nextId: string | null; reason?: string };
  decline: (id: string, reason: string) => { ok: boolean; nextId: string | null };
  undo: () => string | null;
  declineLine: (taskId: string, lineId: string) => void;
  restoreLine: (taskId: string, lineId: string) => void;
  selectStep: (taskId: string, stepId: string) => void;
  applyMed: (taskId: string, med: CatalogMed, lineId?: string) => void;
  applyTreatment: (taskId: string, tx: CatalogTreatment) => void;
  setSig: (taskId: string, lineId: string, sig: string) => void;
  setNotes: (taskId: string, notes: string) => void;
  setRefillReview: (taskId: string, n: number) => void;
  setVisitNote: (taskId: string, note: string) => void;
  applyVisitTemplate: (taskId: string, templateId: string, html: string) => void;
  signVisitNote: (taskId: string, at: string) => void;
  setAdvanced: (
    taskId: string,
    patch: Partial<Pick<Task, "oneTime" | "maintenance" | "followUpDays">>,
  ) => void;
  markReview: (id: string) => void;
  reset: () => void;
}

function cloneSeed(): Task[] {
  return structuredClone(SEED_TASKS);
}

function live(t: Task) {
  return t.status === "pending" || t.status === "in_review" || t.status === "partial";
}

export function isNeedsReview(t: Task) {
  return live(t);
}

export function nextPendingId(tasks: Task[], currentId: string) {
  const pending = tasks.filter(isNeedsReview);
  const idx = pending.findIndex((t) => t.id === currentId);
  if (idx < 0) return pending[0]?.id ?? null;
  return pending[idx + 1]?.id ?? pending[0]?.id ?? null;
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: cloneSeed(),
      filter: "needs",
      search: "",
      transmit: null,
      hydrated: false,
      setHydrated: (v) => set({ hydrated: v }),
      setFilter: (filter) => set({ filter }),
      setSearch: (search) => set({ search }),
      update: (id, patch) =>
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === id ? patch(t) : t)),
        })),
      approve: (id) => {
        const { tasks, transmit } = get();
        const t = tasks.find((x) => x.id === id);
        if (!t) return { ok: false, nextId: null, reason: "Missing task" };
        if (!live(t)) return { ok: false, nextId: null, reason: "Already processed" };
        if (t.safety.hardStop) {
          return { ok: false, nextId: null, reason: t.safety.hardStop };
        }
        if (t.kind === "protocol" && !t.protocol?.selectedStepId) {
          return { ok: false, nextId: null, reason: "Select a protocol step first" };
        }
        const remaining = t.lines.filter((l) => !l.declined);
        if (t.kind !== "protocol" && remaining.length === 0) {
          return { ok: false, nextId: null, reason: "All lines declined" };
        }
        if (transmit?.timeout) clearTimeout(transmit.timeout);
        const snapshot = structuredClone(t);
        const status: TaskStatus =
          t.kind !== "protocol" && t.lines.some((l) => l.declined) && remaining.length > 0
            ? "partial"
            : "approved";
        set((s) => ({
          tasks: s.tasks.map((x) => (x.id === id ? { ...x, status } : x)),
          transmit: { taskId: id, snapshot, timeout: null },
        }));
        const timeout = setTimeout(() => {
          set({ transmit: null });
        }, HOLD_MS);
        set({ transmit: { taskId: id, snapshot, timeout } });
        const nextId = nextPendingId(get().tasks, id);
        return { ok: true, nextId };
      },
      decline: (id, reason) => {
        const { tasks, transmit } = get();
        const t = tasks.find((x) => x.id === id);
        if (!t || !live(t)) return { ok: false, nextId: null };
        if (transmit?.timeout) clearTimeout(transmit.timeout);
        const snapshot = structuredClone(t);
        set((s) => ({
          tasks: s.tasks.map((x) =>
            x.id === id
              ? {
                  ...x,
                  status: "declined" as const,
                  declineReason: reason,
                  lines: x.lines.map((l) => ({ ...l, declined: true })),
                }
              : x,
          ),
          transmit: { taskId: id, snapshot, timeout: null },
        }));
        const timeout = setTimeout(() => set({ transmit: null }), HOLD_MS);
        set((s) => ({ transmit: s.transmit ? { ...s.transmit, timeout } : null }));
        return { ok: true, nextId: nextPendingId(get().tasks, id) };
      },
      undo: () => {
        const { transmit } = get();
        if (!transmit) return null;
        if (transmit.timeout) clearTimeout(transmit.timeout);
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === transmit.taskId ? transmit.snapshot : t)),
          transmit: null,
        }));
        return transmit.taskId;
      },
      declineLine: (taskId, lineId) =>
        get().update(taskId, (t) => ({
          ...t,
          lines: t.lines.map((l) => (l.id === lineId ? { ...l, declined: true } : l)),
        })),
      restoreLine: (taskId, lineId) =>
        get().update(taskId, (t) => ({
          ...t,
          lines: t.lines.map((l) => (l.id === lineId ? { ...l, declined: false } : l)),
        })),
      selectStep: (taskId, stepId) =>
        get().update(taskId, (t) =>
          t.protocol ? { ...t, protocol: { ...t.protocol, selectedStepId: stepId } } : t,
        ),
      applyMed: (taskId, med, lineId) =>
        get().update(taskId, (t) => {
          const paidLine = t.lines.find((l) => l.id === lineId) ?? t.lines[0];
          const next = lineFromMed(med, {
            paid: paidLine?.paid,
            paidPrice: paidLine?.paidPrice,
            declined: false,
          });
          const lines = lineId
            ? t.lines.map((l) => (l.id === lineId ? next : l))
            : [next];
          return {
            ...t,
            kind: t.paidAmount != null ? "order" : "prescribe",
            protocol: undefined,
            titrates: med.category === "GLP-1",
            refillReview: med.category === "GLP-1" ? 0 : t.refillReview,
            lines,
          };
        }),
      applyTreatment: (taskId, tx) =>
        get().update(taskId, (t) => {
          const steps = stepsFromTreatment(tx);
          return {
            ...t,
            kind: "protocol",
            titrates: Boolean(tx.titrates),
            autoRefill: tx.titrates ? false : t.autoRefill,
            refillReview: tx.titrates ? 0 : t.refillReview,
            protocol: {
              name: tx.name,
              price: tx.price,
              titrates: tx.titrates,
              steps,
              selectedStepId: steps[0]?.id ?? null,
            },
            lines: [],
          };
        }),
      setSig: (taskId, lineId, sig) =>
        get().update(taskId, (t) => ({
          ...t,
          lines: t.lines.map((l) => (l.id === lineId ? { ...l, sig } : l)),
          protocol: t.protocol
            ? {
                ...t.protocol,
                steps: t.protocol.steps.map((s) =>
                  s.line.id === lineId ? { ...s, line: { ...s.line, sig } } : s,
                ),
              }
            : t.protocol,
        })),
      setNotes: (taskId, providerNotes) => get().update(taskId, (t) => ({ ...t, providerNotes })),
      setRefillReview: (taskId, n) =>
        get().update(taskId, (t) => ({ ...t, refillReview: Math.min(MAX_REFILL_REVIEW, Math.max(0, n)) })),
      setVisitNote: (taskId, visitNote) => get().update(taskId, (t) => ({ ...t, visitNote })),
      applyVisitTemplate: (taskId, templateId, html) =>
        get().update(taskId, (t) => ({
          ...t,
          visitNoteTemplateId: templateId,
          visitNote: html,
          visitNoteSignedAt: undefined,
        })),
      signVisitNote: (taskId, at) => get().update(taskId, (t) => ({ ...t, visitNoteSignedAt: at })),
      setAdvanced: (taskId, patch) => get().update(taskId, (t) => ({ ...t, ...patch })),
      markReview: (id) =>
        get().update(id, (t) => ({ ...t, status: t.status === "in_review" ? "pending" : "in_review" })),
      reset: () => {
        const { transmit } = get();
        if (transmit?.timeout) clearTimeout(transmit.timeout);
        set({ tasks: cloneSeed(), filter: "needs", search: "", transmit: null });
      },
    }),
    {
      name: "minimal-provider-review-v5",
      partialize: (s) => ({ tasks: s.tasks, filter: s.filter }),
      skipHydration: true,
    },
  ),
);


