import { extrasFor } from "@/lib/catalog";
import type { Task } from "@/lib/types";
import { fmtDate, money } from "@/lib/utils";

export interface VisitTemplate {
  id: string;
  name: string;
  /** Categories this template is offered for. Empty = offered everywhere. */
  categories: string[];
  /** Body HTML. `#outcome` and `#content` are replaced when inserted. */
  body: string;
}

const ROW = (k: string, v: string) => `<tr><th>${k}</th><td>${v}</td></tr>`;

function table(rows: string[]) {
  return `<table><tbody>${rows.join("")}</tbody></table>`;
}

export const VISIT_TEMPLATES: VisitTemplate[] = [
  {
    id: "vt-async-eval",
    name: "General Async Evaluation Template",
    categories: [],
    body: table([
      ROW("Patient", "#patient"),
      ROW("Date of service", "#date"),
      ROW("Modality", "#modality"),
      ROW("Service", "#service"),
      ROW("Chief concern", "#service request submitted through the online intake."),
      ROW("Subjective", "#content"),
      ROW("Objective", "No in-person exam. Intake responses and uploaded identification reviewed."),
      ROW("Assessment", "#outcome"),
      ROW("Plan", "#plan"),
      ROW("Prescriber", "#prescriber"),
    ]),
  },
  {
    id: "vt-ed",
    name: "ED Async Visit Template",
    categories: ["ED"],
    body: table([
      ROW("Patient", "#patient"),
      ROW("Date of service", "#date"),
      ROW("Modality", "#modality"),
      ROW("Chief concern", "Erectile dysfunction — request for PDE-5 therapy."),
      ROW("Cardiac screen", "Intake reviewed for nitrate use, recent MI/CVA and unstable angina."),
      ROW("Subjective", "#content"),
      ROW("Assessment", "#outcome"),
      ROW("Plan", "#plan"),
      ROW("Counseling", "Priapism &gt;4 hours, sudden vision or hearing loss — seek emergency care."),
      ROW("Prescriber", "#prescriber"),
    ]),
  },
  {
    id: "vt-glp1",
    name: "GLP-1 Titration Visit Template",
    categories: ["GLP-1"],
    body: table([
      ROW("Patient", "#patient"),
      ROW("Date of service", "#date"),
      ROW("Modality", "#modality"),
      ROW("Chief concern", "Weight management — GLP-1 therapy."),
      ROW("Vitals", "#vitals"),
      ROW("Screening", "Personal/family history of MTC or MEN2 and pancreatitis reviewed on intake."),
      ROW("Subjective", "#content"),
      ROW("Assessment", "#outcome"),
      ROW("Plan", "#plan"),
      ROW("Counseling", "Titration schedule, GI side effects and injection technique discussed."),
      ROW("Prescriber", "#prescriber"),
    ]),
  },
  {
    id: "vt-refill",
    name: "Refill Re-authorization Template",
    categories: [],
    body: table([
      ROW("Patient", "#patient"),
      ROW("Date of service", "#date"),
      ROW("Modality", "#modality"),
      ROW("Interval history", "#content"),
      ROW("Tolerance", "No new adverse effects reported since the last fill."),
      ROW("Assessment", "#outcome"),
      ROW("Plan", "#plan"),
      ROW("Prescriber", "#prescriber"),
    ]),
  },
];

function category(task: Task) {
  const name = (task.protocol?.name ?? task.lines[0]?.name ?? task.service).toLowerCase();
  if (/semaglutide|tirzepatide|glp/.test(name)) return "GLP-1";
  if (/sildenafil|tadalafil/.test(name)) return "ED";
  return "";
}

export function templatesFor(task: Task) {
  const cat = category(task);
  const mine = VISIT_TEMPLATES.filter((t) => t.categories.includes(cat));
  const general = VISIT_TEMPLATES.filter((t) => t.categories.length === 0);
  const refill = task.refillOf ? general.filter((t) => t.id === "vt-refill") : [];
  const rest = general.filter((t) => !refill.includes(t));
  return [...refill, ...mine, ...rest];
}

/** What the provider is signing off on — fills `#outcome`. */
export function outcomeFor(task: Task) {
  if (task.protocol) {
    const step = task.protocol.steps.find((s) => s.id === task.protocol?.selectedStepId);
    if (!step) return `${task.protocol.name} — no step selected yet.`;
    return `Appropriate for ${task.protocol.name}, step ${step.n} (${step.phase}): ${step.line.name}. No contraindication identified on review.`;
  }
  const live = task.lines.filter((l) => !l.declined);
  if (live.length === 0) return "Not appropriate for therapy at this time.";
  const meds = live.map((l) => `${l.name} — ${l.quantity}`).join("; ");
  return `Appropriate for therapy as requested: ${meds}. No contraindication identified on review.`;
}

/** The narrative body — fills `#content`. */
export function contentFor(task: Task) {
  return extrasFor(task.id).aiOverview;
}

function planFor(task: Task) {
  const lines = task.protocol
    ? task.protocol.steps.filter((s) => s.id === task.protocol?.selectedStepId).map((s) => s.line)
    : task.lines.filter((l) => !l.declined);
  const rx = lines.map((l) => `${l.name} — ${l.sig}`).join("<br />");
  return rx || "No medication dispensed.";
}

export function fillTemplate(tpl: VisitTemplate, task: Task) {
  const p = task.patient;
  const map: Record<string, string> = {
    "#patient": `${p.name} (${p.code}) · DOB ${p.dob} · ${p.age} yrs · ${p.state}`,
    "#date": fmtDate(task.createdAt, true),
    "#modality": task.mode === "sync" ? "Synchronous video visit" : "Asynchronous store-and-forward review",
    "#service": task.service,
    "#vitals": `${p.height} · ${p.weight} · BMI ${p.bmi}`,
    "#prescriber": "Jonathan Miller, MD",
    "#outcome": outcomeFor(task),
    "#content": contentFor(task),
    "#plan": planFor(task),
  };
  let out = `<h2>Visit Record — ${p.name}</h2>${tpl.body}`;
  for (const [k, v] of Object.entries(map)) out = out.split(k).join(v);
  if (task.paidAmount != null) {
    out += `<p class="rx-foot">Patient paid ${money(task.paidAmount)} at checkout for this visit.</p>`;
  }
  return out;
}
