// Pure presentation helpers for due-date pills.
// No clinical logic here — only arithmetic on top of rules.ts output.

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
