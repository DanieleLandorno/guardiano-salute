// Pure presentation helpers for due-date pills.
// No clinical logic here — only arithmetic on top of rules.ts output.

import { computePlan, type MatchedScreening, type UserProfile } from "./rules";
import type { StatoPrenotazione } from "./prenotazioni";

export function nextDateFromYearMonth(yyyymm: string, addMonths: number): Date {
  const [y, m] = yyyymm.split("-").map(Number);
  // YYYY-MM → first day of that month, then add cadence months
  return new Date(y, (m - 1) + addMonths, 1);
}

export function nextDateFromIsoDate(iso: string, addMonths: number): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m - 1) + addMonths, d);
}

export function pillState(d: Date): "futura" | "passata" {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dn = new Date(d);
  dn.setHours(0, 0, 0, 0);
  return dn.getTime() >= today.getTime() ? "futura" : "passata";
}

const MESI_SHORT = ["GEN", "FEB", "MAR", "APR", "MAG", "GIU", "LUG", "AGO", "SET", "OTT", "NOV", "DIC"];

export function pillLabels(d: Date): { mese: string; anno: string } {
  return { mese: MESI_SHORT[d.getMonth()], anno: String(d.getFullYear()) };
}

export function freqToMonths(n: number, u: "mesi" | "anni"): number {
  return u === "anni" ? n * 12 : n;
}

// ---------------------------------------------------------------------------
// Shared booking-source helpers — single source of truth for Home + Prenotazioni
// ---------------------------------------------------------------------------

const SSN_IDS = ["cervice_uterina", "mammella", "colon_retto", "prostata"];

/**
 * Screenings SSN che richiedono una prenotazione attiva.
 * - "screening" e "fare_test" → sempre
 * - "screening_se_scaduto" → solo se scaduto (o se manca ultimo_test_data)
 * - tutte le altre azioni (delega_medico, richiedi_colonscopia,
 *   primo_invito_futuro, prosegui_secondo_cadenza) → escluse.
 * Esclude inoltre i tumori già diagnosticati.
 */
export function bookableSsnScreenings(profile: UserProfile): MatchedScreening[] {
  if (!profile.sesso || !profile.eta) return [];
  const plan = computePlan(profile);
  const diagnosed = new Set(profile.diagnosi_oncologica ?? []);
  return plan.filter((s) => {
    if (!SSN_IDS.includes(s.id)) return false;
    if (diagnosed.has(s.id)) return false;
    if (s.azione === "screening" || s.azione === "fare_test") return true;
    if (s.azione === "screening_se_scaduto") {
      const ultimo = profile.screenings?.[s.id]?.ultimo_test_data;
      if (!ultimo || !s.cadenza_mesi) return true;
      return pillState(nextDateFromYearMonth(ultimo, s.cadenza_mesi)) === "passata";
    }
    return false;
  });
}

/**
 * Screenings da gestire col medico (informativi, non prenotabili qui).
 * azione = delega_medico | richiedi_colonscopia, esclusi i diagnosticati.
 */
export function promemoriaMedicoScreenings(profile: UserProfile): MatchedScreening[] {
  if (!profile.sesso || !profile.eta) return [];
  const plan = computePlan(profile);
  const diagnosed = new Set(profile.diagnosi_oncologica ?? []);
  return plan.filter(
    (s) =>
      !diagnosed.has(s.id) &&
      (s.azione === "delega_medico" || s.azione === "richiedi_colonscopia"),
  );
}

/**
 * Contatore unico "Da prenotare" — usato sia dalla Home sia da /app/prenotazioni
 * per garantire che le due viste non divergano mai.
 */
export function contaDaPrenotare(
  profile: UserProfile,
  prenotazioni: Record<string, StatoPrenotazione>,
): number {
  return bookableSsnScreenings(profile).filter((s) => {
    const state = prenotazioni[s.id] ?? { stato: "da_prenotare" as const };
    return state.stato === "da_prenotare";
  }).length;
}
