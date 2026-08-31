import type { CatalogMed, CatalogTreatment, CheckIn, DocFile, Message, Task } from "@/lib/types";

export const CATALOG_MEDS: CatalogMed[] = [
  {
    id: "sil-55",
    name: "Sildenafil 55mg (Yellow/White)",
    strength: "55mg",
    form: "Capsules",
    route: "oral",
    quantity: "8 capsules",
    daysSupply: "30",
    sig: "Take 1 capsule by mouth 30–60 minutes before activity. Max 1 capsule in 24 hours.",
    price: 82.08,
    category: "ED",
  },
  {
    id: "sil-100",
    name: "Sildenafil 100mg (Blue)",
    strength: "100mg",
    form: "Tablets",
    route: "oral",
    quantity: "8 tablets",
    daysSupply: "30",
    sig: "Take 1 tablet by mouth 30–60 minutes before activity. Max 1 tablet in 24 hours.",
    price: 96,
    category: "ED",
  },
  {
    id: "tad-6",
    name: "Tadalafil 6 mg Tablet (Green)",
    strength: "6mg",
    form: "Chewable tablet",
    route: "chewable",
    quantity: "30 tablets",
    daysSupply: "30",
    sig: "Chew or swallow 1 tablet by mouth once daily as needed.",
    price: 71,
    category: "ED",
  },
  {
    id: "enc-6",
    name: "Enclomiphene 6.25mg",
    strength: "6.25mg",
    form: "Capsule",
    route: "oral",
    quantity: "30",
    daysSupply: "30",
    sig: "Take 1 capsule by mouth once daily.",
    price: 124,
    category: "Hormone",
  },
  {
    id: "enc-12",
    name: "Enclomiphene 12.5mg",
    strength: "12.5mg",
    form: "Tablet",
    route: "oral",
    quantity: "30",
    daysSupply: "30",
    sig: "Take 1 tablet by mouth once daily.",
    price: 124,
    category: "Hormone",
  },
  {
    id: "sema-m1",
    name: "Month 1: Semaglutide 2.5 mg/ml 1 ml Vial",
    strength: "2.5 mg/ml",
    form: "1 ml Vial",
    route: "subcutaneous",
    quantity: "1 vial",
    daysSupply: "30",
    sig: "Inject as directed once weekly. Titrate per protocol.",
    price: 194,
    category: "GLP-1",
  },
  {
    id: "sema-m2",
    name: "Month 2: Semaglutide 2.5 mg/ml 1 ml Vial",
    strength: "2.5 mg/ml",
    form: "1 ml Vial",
    route: "subcutaneous",
    quantity: "1 vial",
    daysSupply: "30",
    sig: "Inject as directed once weekly.",
    price: 299,
    category: "GLP-1",
  },
  {
    id: "sema-m3",
    name: "Month 3: Semaglutide 2.5 mg/ml 2 ml Vial",
    strength: "2.5 mg/ml",
    form: "2 ml Vial",
    route: "subcutaneous",
    quantity: "1 vial",
    daysSupply: "30",
    sig: "Inject as directed once weekly.",
    price: 299,
    category: "GLP-1",
  },
  {
    id: "sema-pkg",
    name: "Semaglutide 2-Month Package (M1+M2)",
    strength: "2.5 mg/ml",
    form: "2 ml Vial",
    route: "subcutaneous",
    quantity: "1 vial",
    daysSupply: "60",
    sig: "Inject as directed once weekly.",
    price: 399,
    category: "GLP-1",
  },
  {
    id: "oral-sema",
    name: "Oral Semaglutide 2mg",
    strength: "2mg",
    form: "Tablet",
    route: "oral",
    quantity: "30 tablets",
    daysSupply: "30",
    sig: "Take 1 tablet by mouth once daily on an empty stomach.",
    price: 199,
    category: "GLP-1",
  },
  {
    id: "oral-sema-3",
    name: "Oral Semaglutide 3mg",
    strength: "3mg",
    form: "Tablet",
    route: "oral",
    quantity: "30 tablets",
    daysSupply: "30",
    sig: "Take 1 tablet by mouth once daily on an empty stomach.",
    price: 229,
    category: "GLP-1",
  },
  {
    id: "tirz",
    name: "Tirzepatide ODT 3mg",
    strength: "3mg",
    form: "ODT",
    route: "oral",
    quantity: "30 tablets",
    daysSupply: "30",
    sig: "Dissolve 1 tablet under the tongue once daily.",
    price: 199,
    category: "GLP-1",
  },
  {
    id: "b12",
    name: "B12 Injections 4 mg",
    strength: "4mg",
    form: "Injection",
    route: "intramuscular",
    quantity: "4 vials",
    daysSupply: "28",
    sig: "Inject 1 mL intramuscularly once weekly.",
    price: 49,
    category: "Support",
  },
];

export const CATALOG_TREATMENTS: CatalogTreatment[] = [
  {
    id: "tx-enclo",
    name: "Enclomiphene",
    price: 124,
    category: "Hormone",
    steps: [
      { n: 1, phase: "Ongoing", medId: "enc-6" },
      { n: 2, phase: "Ongoing", medId: "enc-12" },
    ],
  },
  {
    id: "tx-tad",
    name: "Tadalafil",
    price: 71,
    category: "ED",
    steps: [{ n: 1, phase: "Ongoing", medId: "tad-6" }],
  },
  {
    id: "tx-sema",
    name: "Semaglutide titration",
    price: 194,
    titrates: true,
    category: "GLP-1",
    steps: [
      { n: 1, phase: "Month 1", medId: "sema-m1" },
      { n: 2, phase: "Month 2", medId: "sema-m2" },
      { n: 3, phase: "Month 3", medId: "sema-m3" },
    ],
  },
  {
    id: "tx-oral-sema",
    name: "Oral Semaglutide",
    price: 199,
    titrates: true,
    category: "GLP-1",
    steps: [
      { n: 1, phase: "Month 1", medId: "oral-sema" },
      { n: 2, phase: "Month 2", medId: "oral-sema-3" },
    ],
  },
];

export function medById(id: string) {
  return CATALOG_MEDS.find((m) => m.id === id);
}

export interface TaskExtras {
  aiOverview: string;
  visitNote: string;
  intakeUrl: string;
  checkIns: CheckIn[];
  messages: Message[];
}

const EXTRAS: Record<string, TaskExtras> = {
  TASK6297: {
    aiOverview:
      "Returning 36y male, BMI 28.5, on lisinopril. Intake denies nitrates and chest pain. ED ~6 months. No interaction flags against the current sildenafil request.",
    visitNote:
      "Async review of paid sildenafil order. History consistent with prior fills. No nitrate use. Plan: continue current strength, auto-refill per patient opt-in at checkout.",
    intakeUrl: "/intake/TASK6297",
    checkIns: [
      { date: "Jul 10, 2026", title: "Week 4 check-in", note: "Tolerating well. No visual changes or dizziness." },
      { date: "Apr 08, 2026", title: "Post-first fill", note: "Effective. Requested same product." },
    ],
    messages: [
      { from: "staff", at: "Aug 11, 4:02 PM", body: "Your refill is in review. We’ll message if we need anything." },
      { from: "patient", at: "Aug 12, 9:14 AM", body: "Same as last time is fine unless you think I should switch." },
    ],
  },
  TASK6402: {
    aiOverview:
      "New 38y female, first prescription. Goal is energy/libido postpartum. Penicillin allergy only. No clot/stroke history. IUD in place. First-Rx review required.",
    visitNote:
      "New patient medical evaluation for enclomiphene. Intake negative for VTE. Discussed protocol steps. Start at 6.25mg daily with 30-day follow-up.",
    intakeUrl: "/intake/TASK6402",
    checkIns: [],
    messages: [{ from: "staff", at: "Aug 21, 2:10 PM", body: "Intake complete. Ready for provider review." }],
  },
  TASK6246: {
    aiOverview:
      "60y male, returning, prefers daily low-dose tadalafil. Denies nitrates and cardiac symptoms. On atorvastatin and omeprazole. Prior tadalafil fill in January.",
    visitNote:
      "Async tadalafil evaluation. Patient previously tolerated 6mg daily. Continue protocol step 1.",
    intakeUrl: "/intake/TASK6246",
    checkIns: [{ date: "Jan 20, 2026", title: "First-fill check-in", note: "No headache. Using 3–4 days/week." }],
    messages: [],
  },
  TASK6059: {
    aiOverview:
      "34y female, BMI 36.8, on metformin. Goal weight 175. Denies MTC and pancreatitis. Sync visit required before signing a titrating GLP-1.",
    visitNote:
      "Sync GLP-1 evaluation. Counseling on titration and GI effects documented. Start Month 1 semaglutide. Re-evaluate each cycle — no auto-refill.",
    intakeUrl: "/intake/TASK6059",
    checkIns: [],
    messages: [{ from: "patient", at: "Jul 16, 4:02 PM", body: "I can do the video visit this evening." }],
  },
  TASK6180: {
    aiOverview:
      "40y female on oral semaglutide month 2 of 3. −9 lbs, mild week-1 nausea resolved. No MTC. Refill re-authorization of a titrating product.",
    visitNote:
      "Refill review, oral semaglutide 2mg. Tolerating. Continue current dose. Titrating — re-evaluate next cycle.",
    intakeUrl: "/intake/TASK6180",
    checkIns: [{ date: "Jul 27, 2026", title: "Month 1 check-in", note: "Nausea gone. Appetite down. −9 lbs." }],
    messages: [],
  },
  TASK6310: {
    aiOverview:
      "35y female, BMI 35.1, on sertraline. No MTC or pancreatitis. No protocol on file — recommended Month 1 injectable semaglutide.",
    visitNote:
      "Medical evaluation without a locked protocol. Recommended starter vial. Counsel on weekly injection and follow-up in 28 days.",
    intakeUrl: "/intake/TASK6310",
    checkIns: [],
    messages: [],
  },
  TASK6411: {
    aiOverview:
      "43y male, BMI 34.1, on atorvastatin. Paid two-line order: tirzepatide ODT + B12. No GLP-1 contraindications flagged.",
    visitNote:
      "Paid combo order. Both lines appropriate. B12 adjunct. Patient opted into auto-refill at checkout.",
    intakeUrl: "/intake/TASK6411",
    checkIns: [],
    messages: [],
  },
  TASK6236: {
    aiOverview:
      "34y male requesting sildenafil. Intake positive for daily isosorbide mononitrate and prior stent. PDE-5 + nitrate is a hard stop.",
    visitNote:
      "Declined. Nitrate therapy is an absolute contraindication to PDE-5 inhibitors. Patient advised to follow up with cardiology. Refund queued.",
    intakeUrl: "/intake/TASK6236",
    checkIns: [],
    messages: [{ from: "staff", at: "Aug 21, 8:40 PM", body: "Flagged nitrate use on intake. Do not sign." }],
  },
};

const FALLBACK: TaskExtras = {
  aiOverview: "Intake screened. No additional model notes.",
  visitNote: "",
  intakeUrl: "",
  checkIns: [],
  messages: [],
};

export function extrasFor(taskId: string): TaskExtras {
  const extra = EXTRAS[taskId] ?? FALLBACK;
  return { ...extra, intakeUrl: extra.intakeUrl || `/intake/${taskId}` };
}

export interface AiDetail {
  /** What the model thinks should happen next — mirrors the portal's status pill. */
  status: string;
  /** 0–100. Shown next to the status, never used to gate anything. */
  confidence: number;
  /** The long-form reasoning the provider actually reads. */
  reasoning: string;
  /** Discrete checks the model ran, one line each. */
  findings: string[];
}

const AI_DETAIL: Record<string, AiDetail> = {
  TASK6297: {
    status: "Provider review",
    confidence: 88,
    reasoning:
      "Returning 36-year-old male requesting a repeat fill of sildenafil 55mg. Two prior fills of the same product in the last six months, both delivered with no reported adverse effects and no messages to the clinic. Intake denies nitrates, nitric-oxide donors and any cardiac history; the only active medication is lisinopril 10mg daily, which is not a contraindication and needs no dose adjustment. Blood pressure self-reported at 122/78 is within range for PDE-5 therapy. No new symptoms since the last review and no change to the shipping state, so the existing license coverage still applies.",
    findings: [
      "No nitrate or nitric-oxide donor on the active medication list.",
      "No reported chest pain, MI, CVA or unstable angina.",
      "Lisinopril + sildenafil: expected mild additive hypotension, monitor only.",
      "Two prior fills tolerated, most recent Jul 08 2026.",
      "ID matches the intake name and date of birth.",
      "Shipping state AK is covered by the prescriber's license.",
    ],
  },
  TASK6402: {
    status: "First-Rx review required",
    confidence: 74,
    reasoning:
      "New 38-year-old female, no prior prescription on file. Goal is energy and libido recovery postpartum, six months out from delivery and no longer breastfeeding. Penicillin is the only listed allergy and is not relevant to enclomiphene. Intake is negative for venous thromboembolism, stroke and estrogen-sensitive malignancy; a levonorgestrel IUD is in place, which does not interact. Because this is a first prescription for a new patient, FSMB guidance expects a documented review rather than a quick approve, and the keyboard shortcut is disabled for this task.",
    findings: [
      "First prescription — no medication history to compare against.",
      "Negative for clot, stroke and estrogen-sensitive cancer history.",
      "Levonorgestrel IUD in place — no interaction with enclomiphene.",
      "Penicillin allergy noted, unrelated to this therapy.",
      "Protocol offers two steps; step 1 (6.25mg) is the standard start.",
      "30-day follow-up recommended to check tolerance.",
    ],
  },
  TASK6246: {
    status: "Provider review",
    confidence: 86,
    reasoning:
      "60-year-old male, returning patient, requesting daily low-dose tadalafil. Prior fill in January was tolerated with no headache or flushing reported at the check-in, and usage was three to four days a week. Active medications are atorvastatin and omeprazole; neither is a contraindication to a PDE-5 inhibitor. Intake denies nitrates and any cardiac symptoms. Age alone is not a bar to therapy, but the daily dosing schedule warrants confirming the patient is not also using an alpha blocker — none is listed.",
    findings: [
      "No nitrates or alpha blockers on the medication list.",
      "Atorvastatin, omeprazole — no clinically significant interaction.",
      "Prior tadalafil fill Jan 2026 tolerated, check-in negative.",
      "Denies chest pain, syncope and exertional symptoms.",
      "Protocol step 1 (6mg daily) matches the previous course.",
      "ID and intake identity match.",
    ],
  },
  TASK6059: {
    status: "Sync visit required",
    confidence: 69,
    reasoning:
      "34-year-old female, BMI 36.8, requesting semaglutide for weight management with a stated goal weight of 175 lbs. Metformin 500mg BID is active, which is compatible and often continued alongside a GLP-1. Intake denies personal and family history of medullary thyroid carcinoma, MEN2 and pancreatitis. This is a titrating product, so state rules require a synchronous video visit before the first prescription is signed, and every subsequent cycle comes back for re-evaluation rather than auto-refilling. Counseling on injection technique, titration pace and GI side effects should be documented in the visit note.",
    findings: [
      "Sync video visit required before signing — titrating GLP-1.",
      "Negative for MTC, MEN2 and pancreatitis history.",
      "Metformin may continue; watch for additive GI upset.",
      "BMI 36.8 meets the treatment threshold on its own.",
      "No gallbladder disease or planned pregnancy reported.",
      "Each cycle re-evaluated — no auto-approved refill run.",
    ],
  },
  TASK6180: {
    status: "Provider review",
    confidence: 84,
    reasoning:
      "40-year-old female on oral semaglutide, month 2 of a 3-month titration. Down 9 lbs since starting, with mild week-one nausea that resolved without intervention and no vomiting, dehydration or abdominal pain since. No new medications. Intake remains negative for MTC and pancreatitis. This is a re-authorization of a titrating product, so the fill is a new prescription rather than a refill against the original — the decision is whether to hold at the current dose or advance to month 3.",
    findings: [
      "−9 lbs since start; tolerance reported as good.",
      "Week-one nausea resolved, no recurrence at the month-1 check-in.",
      "No MTC, MEN2 or pancreatitis history.",
      "Titrating product — this fill is a fresh Rx, not an auto-refill.",
      "No new medications since the last review.",
      "Dose decision: hold at 2mg or advance to 3mg.",
    ],
  },
  TASK6310: {
    status: "Provider review",
    confidence: 71,
    reasoning:
      "35-year-old female, BMI 35.1, requesting weight-management therapy with no protocol locked at checkout. Sertraline is active; SSRIs are compatible with GLP-1 therapy though combined GI upset is worth mentioning at counseling. Intake is negative for MTC, MEN2, pancreatitis and gallbladder disease. Because nothing was pre-selected, the provider is choosing both the product and the starting step — the Month 1 injectable vial is the conventional start for this presentation, with a 28-day follow-up to check tolerance before advancing.",
    findings: [
      "No protocol selected at checkout — provider picks the product.",
      "BMI 35.1 meets the treatment threshold.",
      "Sertraline compatible; counsel on additive GI effects.",
      "Negative for MTC, MEN2 and pancreatitis.",
      "Month 1 starter vial recommended over an oral agent.",
      "Follow-up in 28 days suggested.",
    ],
  },
  TASK6411: {
    status: "Provider review",
    confidence: 82,
    reasoning:
      "43-year-old male, BMI 34.1, paid a two-line order: tirzepatide ODT 3mg plus B12 injections. Atorvastatin is the only active medication and carries no GLP-1 interaction. Intake is negative for MTC, MEN2 and pancreatitis. The B12 line is an adjunct and can be approved or declined independently of the GLP-1 line without refunding the whole order. Both lines ship together, so a decline on either one triggers a partial refund of that line only.",
    findings: [
      "Two paid lines — each can be approved or declined separately.",
      "Negative for MTC, MEN2 and pancreatitis.",
      "Atorvastatin: no interaction with tirzepatide or B12.",
      "B12 is an adjunct, not required for the GLP-1 line.",
      "BMI 34.1 supports the primary therapy.",
      "Declining one line refunds that line only.",
    ],
  },
  TASK6236: {
    status: "Hold — contraindication",
    confidence: 96,
    reasoning:
      "34-year-old male requesting sildenafil. Intake is positive for daily isosorbide mononitrate 30mg and a coronary stent placed in 2023 for stable angina. Concurrent PDE-5 inhibitor and nitrate therapy is an absolute contraindication — the combination can cause profound, refractory hypotension. There is no dose adjustment or timing strategy that makes this safe while the nitrate is active. The order should be declined with a refund and the patient directed back to cardiology; if the nitrate is ever discontinued, the request can be reassessed.",
    findings: [
      "HARD STOP: daily isosorbide mononitrate on the active list.",
      "Coronary stent 2023, stable angina — ongoing cardiac disease.",
      "PDE-5 + nitrate: risk of profound refractory hypotension.",
      "No safe dose or timing separation exists for this pair.",
      "Refer to cardiology before any reassessment.",
      "Decline and refund is the expected outcome.",
    ],
  },
};

export function aiFor(taskId: string): AiDetail {
  return (
    AI_DETAIL[taskId] ?? {
      status: "Provider review",
      confidence: 70,
      reasoning: extrasFor(taskId).aiOverview,
      findings: [],
    }
  );
}

export function idDocsFor(task: Task): DocFile[] {
  const ids = task.docs.filter((d) => d.kind.toLowerCase() === "id");
  if (ids.length) return ids;
  return [{ name: `${task.patient.code}-id.jpg`, kind: "ID", date: task.createdAt.slice(5, 10) + "/2026" }];
}
