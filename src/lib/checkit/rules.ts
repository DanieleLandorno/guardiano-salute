// CheckIt — JSON regole screening (fornito dall'utente)
// Engine deterministico che valuta le regole su un profilo utente.

export type Sex = "F" | "M";

export interface UserProfile {
  sesso: Sex;
  eta: number;
  regione: string;
  diagnosi_oncologica?: string[];           // es. ["cervice_uterina"]
  vaccinazione_hpv?: "si" | "no" | "unknown";
  screenings?: Record<
    string,
    {
      fatto?: boolean;
      ultimo_test_tipo?: string | null;
      ultimo_test_data?: string | null;      // YYYY-MM
      ultimo_test_esito?: "negativo" | "positivo" | "non_ricordo" | null;
      ultimo_test_valore?: number | null;
    }
  >;
  comorbidita?: string[];
  fumo?: "si" | "no" | "ex";
  sigarette_giorno?: "1_5" | "5_10" | "10_20" | "20_30" | "30_40" | "40_plus";
  fuma_da?: "meno_1" | "1_5" | "6_10" | "11_20" | "oltre_20";
  ex_smesso_anni?: number;
  ex_smesso_mesi?: number;
  attivita_fisica?: "mai" | "raramente" | "qualche" | "spesso" | "ns";
  altezza_cm?: number | null;
  peso_kg?: number | null;
  familiarita_oncologica?: string[];
  familiarita_diabete?: "si" | "no" | "ns";
  familiarita_cardio?: "si" | "no" | "ns";
  pelle?: "chiara" | "media" | "scura" | "ns";
  nei?: "pochi" | "diversi" | "molti" | "ns";
  sole?: "poco" | "moderato" | "molto" | "ns";
}

export const RULES_JSON = {
  version: "1.0",
  screenings: [
    {
      id: "cervice_uterina",
      nome: "Screening della cervice uterina",
      descrizione_breve: "Pap test e HPV-DNA test",
      categoria: "oncologico",
      fonte: "Flowchart interno cervice + protocollo screening cervicale",
      criteri_base: {
        sesso: ["F"], eta_min: 25, eta_max: 64,
        escludi_se: { diagnosi_oncologica: ["cervice_uterina"] },
      },
      regole: [
        { id: "cervice_25_29_vaccinata",
          if: { eta_min: 25, eta_max: 29, vaccinazione_hpv: "si" },
          then: { azione: "primo_invito_futuro", test: "hpv_dna", eta_invito: 30 } },
        { id: "cervice_25_29_non_vaccinata",
          if: { eta_min: 25, eta_max: 29, vaccinazione_hpv: ["no", "unknown"] },
          then: { azione: "screening", test: "pap_test", cadenza_mesi: 36 } },
        { id: "cervice_30_64_primo_hpv",
          if: { eta_min: 30, eta_max: 64, ultimo_test_tipo: "pap_test", ultimo_test_esito: "negativo" },
          then: { azione: "screening_se_scaduto", test: "hpv_dna", mesi_minimi_da_ultimo_test: 36, cadenza_mesi: 60 } },
        { id: "cervice_hpv_negativo",
          if: { ultimo_test_tipo: "hpv_dna", ultimo_test_esito: "negativo" },
          then: { azione: "screening_se_scaduto", test: "hpv_dna", cadenza_mesi: 60 } },
        { id: "cervice_test_positivo",
          if: { ultimo_test_esito: "positivo" }, then: { azione: "delega_medico" } },
      ],
    },
    {
      id: "mammella",
      nome: "Screening mammella",
      descrizione_breve: "Mammografia",
      categoria: "oncologico",
      criteri_base: {
        sesso: ["F"], eta_min: 45, eta_max: 74,
        escludi_se: { diagnosi_oncologica: ["mammella"] },
      },
      regole: [
        { id: "mammella_45_49", if: { eta_min: 45, eta_max: 49 },
          then: { azione: "screening_se_scaduto", test: "mammografia", cadenza_mesi: 12 } },
        { id: "mammella_50_74", if: { eta_min: 50, eta_max: 74 },
          then: { azione: "screening_se_scaduto", test: "mammografia", cadenza_mesi: 24 } },
        { id: "mammella_test_positivo", if: { ultimo_test_esito: "positivo" }, then: { azione: "delega_medico" } },
      ],
    },
    {
      id: "prostata",
      nome: "Screening prostata",
      descrizione_breve: "PSA",
      categoria: "oncologico",
      criteri_base: { sesso: ["M"], eta_min: 50, eta_max: 64, escludi_se: { diagnosi_oncologica: ["prostata"] } },
      regole: [
        { id: "psa_mai_fatto", if: { ultimo_test_data: null }, then: { azione: "fare_test", test: "psa" } },
        { id: "psa_valore_minore_1", if: { ultimo_test_valore_lt: 1 },
          then: { azione: "screening_se_scaduto", test: "psa", cadenza_mesi: 60 } },
        { id: "psa_valore_1_3", if: { ultimo_test_valore_gte: 1, ultimo_test_valore_lt: 3 },
          then: { azione: "screening_se_scaduto", test: "psa", cadenza_mesi: 24 } },
        { id: "psa_valore_maggiore_3", if: { ultimo_test_valore_gte: 3 }, then: { azione: "delega_medico" } },
      ],
    },
    {
      id: "colon_retto",
      nome: "Screening colon-retto",
      descrizione_breve: "Sangue occulto fecale",
      categoria: "oncologico",
      criteri_base: { sesso: ["M", "F"], eta_min: 50, eta_max: 74, escludi_se: { diagnosi_oncologica: ["colon_retto"] } },
      regole: [
        { id: "colon_retto_standard", if: { eta_min: 50, eta_max: 74 },
          then: { azione: "screening_se_scaduto", test: "sof", cadenza_mesi: 24 } },
        { id: "colon_retto_test_positivo", if: { ultimo_test_esito: "positivo" }, then: { azione: "richiedi_colonscopia" } },
        { id: "colon_retto_test_negativo", if: { ultimo_test_esito: "negativo" }, then: { azione: "prosegui_secondo_cadenza" } },
      ],
    },
  ],
} as const;

// --- Engine -----------------------------------------------------------------

export interface MatchedScreening {
  id: string;
  nome: string;
  descrizione_breve: string;
  azione: string;        // screening | screening_se_scaduto | delega_medico | richiedi_colonscopia | primo_invito_futuro | fare_test | prosegui_secondo_cadenza
  test?: string;
  cadenza_mesi?: number;
  meta?: string;
  regione?: string;      // se programma regionale
}

function inAgeRange(eta: number, min?: number, max?: number) {
  if (min != null && eta < min) return false;
  if (max != null && eta > max) return false;
  return true;
}

function eligible(s: any, u: UserProfile): boolean {
  const cb = s.criteri_base;
  if (!(cb.sesso as readonly string[]).includes(u.sesso)) return false;
  if (!inAgeRange(u.eta, cb.eta_min, cb.eta_max)) return false;
  const excl: string[] = cb.escludi_se?.diagnosi_oncologica ?? [];
  if (excl.some((d) => (u.diagnosi_oncologica ?? []).includes(d))) return false;
  return true;
}

function matchIf(cond: any, u: UserProfile, screen: ReturnType<typeof getScreenState>): boolean {
  for (const [k, v] of Object.entries(cond)) {
    switch (k) {
      case "eta_min": if (u.eta < (v as number)) return false; break;
      case "eta_max": if (u.eta > (v as number)) return false; break;
      case "vaccinazione_hpv": {
        const cur = u.vaccinazione_hpv ?? "unknown";
        if (Array.isArray(v)) { if (!(v as string[]).includes(cur)) return false; }
        else if (cur !== v) return false;
        break;
      }
      case "ultimo_test_tipo":
        if (screen.ultimo_test_tipo !== v) return false; break;
      case "ultimo_test_esito":
        if (screen.ultimo_test_esito !== v) return false; break;
      case "ultimo_test_data":
        if (v === null && screen.ultimo_test_data != null) return false;
        if (v != null && screen.ultimo_test_data !== v) return false;
        break;
      case "ultimo_test_valore_lt":
        if (screen.ultimo_test_valore == null) return false;
        if (!(screen.ultimo_test_valore < (v as number))) return false;
        break;
      case "ultimo_test_valore_gte":
        if (screen.ultimo_test_valore == null) return false;
        if (!(screen.ultimo_test_valore >= (v as number))) return false;
        break;
    }
  }
  return true;
}

function getScreenState(u: UserProfile, id: string) {
  return u.screenings?.[id] ?? {};
}

export function computePlan(u: UserProfile): MatchedScreening[] {
  const out: MatchedScreening[] = [];
  for (const s of RULES_JSON.screenings) {
    if (!eligible(s, u)) continue;
    const state = getScreenState(u, s.id);
    let firedAction: string | null = null;
    let firedThen: any = null;
    for (const r of s.regole) {
      if (matchIf(r.if, u, state as any)) { firedAction = r.then.azione; firedThen = r.then; break; }
    }
    if (!firedAction) {
      // default fallback: invito allo screening
      firedAction = "screening_se_scaduto";
      firedThen = {};
    }
    const meta =
      firedAction === "delega_medico" ? "Da gestire col tuo medico" :
      firedAction === "richiedi_colonscopia" ? "Esito positivo · contatta il medico" :
      firedAction === "primo_invito_futuro" ? `Invito a partire dai ${firedThen.eta_invito} anni` :
      firedAction === "fare_test" ? "Primo test" :
      firedThen?.cadenza_mesi ? `Ogni ${firedThen.cadenza_mesi >= 24 ? firedThen.cadenza_mesi / 12 + " anni" : firedThen.cadenza_mesi + " mesi"}` :
      undefined;

    out.push({
      id: s.id, nome: s.nome, descrizione_breve: s.descrizione_breve,
      azione: firedAction, test: firedThen?.test, cadenza_mesi: firedThen?.cadenza_mesi,
      meta,
      regione: s.id === "prostata" ? u.regione : undefined,
    });
  }
  return out;
}
