export type TaskKind = "order" | "protocol" | "prescribe";
export type TaskStatus = "pending" | "approved" | "declined" | "partial" | "in_review";
export type VisitMode = "async" | "sync";
export type QueueFilter = "needs" | "order" | "treatment" | "refill" | "done" | "all";

export interface CatalogMed {
  id: string;
  name: string;
  strength: string;
  form: string;
  route: string;
  quantity: string;
  daysSupply: string;
  sig: string;
  price: number;
  category: string;
}

export interface CatalogTreatment {
  id: string;
  name: string;
  price: number;
  titrates?: boolean;
  category: string;
  steps: { n: number; phase: string; medId: string }[];
}

export interface SwapOption {
  id: string;
  name: string;
  strength: string;
  form: string;
  route: string;
  quantity: string;
  daysSupply: string;
  sig: string;
  price: number;
}

export interface MedLine {
  id: string;
  name: string;
  strength: string;
  form: string;
  route: string;
  quantity: string;
  daysSupply: string;
  sig: string;
  price: number;
  paid?: boolean;
  paidPrice?: number;
  declined?: boolean;
  swaps: SwapOption[];
  swapOf?: string;
}

export interface ProtocolStep {
  id: string;
  n: number;
  phase: string;
  line: MedLine;
}

export interface Patient {
  name: string;
  code: string;
  dob: string;
  age: number;
  sex: "Male" | "Female";
  state: string;
  licensed: boolean;
  licenseMismatch?: boolean;
  email: string;
  phone: string;
  height: string;
  weight: string;
  bmi: string;
  allergies: string;
  address: string;
  newPatient: boolean;
  pastOrderCount: number;
  lastOrder?: string;
}

export interface IntakeQA {
  q: string;
  a: string;
}

export interface DocFile {
  name: string;
  kind: string;
  date: string;
}

export interface PastOrder {
  id: string;
  date: string;
  med: string;
  status: string;
  amount: number;
}

export interface PrevRx {
  date: string;
  med: string;
  sig: string;
  prescriber: string;
}

export interface CheckIn {
  date: string;
  title: string;
  note: string;
}

export interface Message {
  from: "patient" | "staff";
  at: string;
  body: string;
}

export interface Task {
  id: string;
  orderId?: string;
  kind: TaskKind;
  status: TaskStatus;
  mode: VisitMode;
  service: string;
  createdAt: string;
  dueAt: string;
  overdueDays: number;
  paidAmount?: number;
  refillOf?: { cycle: number; of: number };
  patient: Patient;
  protocol?: {
    name: string;
    price: number;
    titrates?: boolean;
    steps: ProtocolStep[];
    selectedStepId: string | null;
  };
  lines: MedLine[];
  catalog?: SwapOption[];
  refills: number;
  titrates?: boolean;
  autoRefill: boolean;
  oneTime: boolean;
  maintenance: boolean;
  followUpDays: number | null;
  providerNotes: string;
  visitNote?: string;
  intake: IntakeQA[];
  docs: DocFile[];
  pastOrders: PastOrder[];
  prevRx: PrevRx[];
  safety: {
    interactions: string;
    flags: string[];
    hardStop?: string;
  };
  declineReason?: string;
}
