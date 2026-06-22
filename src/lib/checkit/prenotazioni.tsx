import { createContext, useContext, useState, type ReactNode } from "react";

const KEY = "checkit-prenotazioni-v1";

export type StatoPrenotazione =
  | { stato: "da_prenotare" }
  | { stato: "in_agenda"; data: string; ora: string; centro: string }
  | { stato: "eseguito"; data: string; refertoId?: string };

interface PrenotazioniCtx {
  prenotazioni: Record<string, StatoPrenotazione>;
  setPrenotazione: (screeningId: string, s: StatoPrenotazione) => void;
  getPrenotazione: (screeningId: string) => StatoPrenotazione;
  reset: () => void;
}

const Ctx = createContext<PrenotazioniCtx | null>(null);

function persist(p: Record<string, StatoPrenotazione>) {
  try { sessionStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

export function PrenotazioniProvider({ children }: { children: ReactNode }) {
  const [prenotazioni, setMap] = useState<Record<string, StatoPrenotazione>>(() => {
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem(KEY) : null;
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  });

  const setPrenotazione: PrenotazioniCtx["setPrenotazione"] = (id, s) =>
    setMap((p) => {
      const next = { ...p, [id]: s };
      persist(next);
      return next;
    });

  const getPrenotazione: PrenotazioniCtx["getPrenotazione"] = (id) =>
    prenotazioni[id] ?? { stato: "da_prenotare" };

  const reset = () => {
    setMap({});
    persist({});
  };

  return (
    <Ctx.Provider value={{ prenotazioni, setPrenotazione, getPrenotazione, reset }}>
      {children}
    </Ctx.Provider>
  );
}

export function usePrenotazioni() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("usePrenotazioni must be used inside PrenotazioniProvider");
  return ctx;
}
