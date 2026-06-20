import { createContext, useContext, useState, type ReactNode } from "react";

const KEY = "checkit-visits-v1";

export type VisitTipologia =
  | "oncologica"
  | "cardiologica"
  | "dermatologica"
  | "ginecologica"
  | "urologica"
  | "gastroenterologica"
  | "senologica"
  | "endocrinologica"
  | "oculistica"
  | "altro";

export const TIPOLOGIE: { value: VisitTipologia; label: string }[] = [
  { value: "oncologica", label: "Oncologica" },
  { value: "cardiologica", label: "Cardiologica" },
  { value: "dermatologica", label: "Dermatologica" },
  { value: "ginecologica", label: "Ginecologica" },
  { value: "urologica", label: "Urologica" },
  { value: "gastroenterologica", label: "Gastroenterologica" },
  { value: "senologica", label: "Senologica" },
  { value: "endocrinologica", label: "Endocrinologica" },
  { value: "oculistica", label: "Oculistica" },
  { value: "altro", label: "Altro" },
];

export interface Visit {
  id: string;
  tipologia: VisitTipologia;
  tipologia_altro?: string;
  nome: string;
  frequenza_n: number;
  frequenza_u: "mesi" | "anni";
  data: string; // YYYY-MM-DD
  screening_id: string | null;
}

interface Ctx {
  visits: Visit[];
  add: (v: Omit<Visit, "id">) => Visit;
  update: (id: string, patch: Partial<Visit>) => void;
  remove: (id: string) => void;
  get: (id: string) => Visit | undefined;
}

const VisitsContext = createContext<Ctx | null>(null);

function persist(v: Visit[]) {
  try { sessionStorage.setItem(KEY, JSON.stringify(v)); } catch {}
}

function load(): Visit[] {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function VisitsProvider({ children }: { children: ReactNode }) {
  const [visits, setVisits] = useState<Visit[]>(() => load());

  const add: Ctx["add"] = (v) => {
    const id = `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
    const visit: Visit = { id, ...v };
    setVisits((s) => { const next = [...s, visit]; persist(next); return next; });
    return visit;
  };
  const update: Ctx["update"] = (id, patch) =>
    setVisits((s) => { const next = s.map((v) => v.id === id ? { ...v, ...patch } : v); persist(next); return next; });
  const remove: Ctx["remove"] = (id) =>
    setVisits((s) => { const next = s.filter((v) => v.id !== id); persist(next); return next; });
  const get: Ctx["get"] = (id) => visits.find((v) => v.id === id);

  return <VisitsContext.Provider value={{ visits, add, update, remove, get }}>{children}</VisitsContext.Provider>;
}

export function useVisits() {
  const ctx = useContext(VisitsContext);
  if (!ctx) throw new Error("useVisits must be used inside VisitsProvider");
  return ctx;
}

export function formatDateIT(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function visitStatus(iso: string): "futura" | "passata" {
  if (!iso) return "futura";
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const d = new Date(iso + "T00:00:00");
  return d.getTime() >= today.getTime() ? "futura" : "passata";
}

export function freqLabel(n: number, u: "mesi" | "anni"): string {
  const unit = u === "anni" ? (n === 1 ? "anno" : "anni") : (n === 1 ? "mese" : "mesi");
  return `Ogni ${n} ${unit}`;
}
