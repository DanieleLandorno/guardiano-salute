import { useState, useRef, useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import { QuestionFrame } from "@/components/checkit/QuestionFrame";
import { OptionButton, FieldLabel, SoftSelect, StepperField, CheckGlyph } from "@/components/checkit/OptionButton";
import { useProfile } from "@/lib/checkit/store";
import type { UserProfile } from "@/lib/checkit/rules";

const REGIONS = ["Abruzzo","Basilicata","Calabria","Campania","Emilia-Romagna","Friuli-Venezia Giulia","Lazio","Liguria","Lombardia","Marche","Molise","Piemonte","Puglia","Sardegna","Sicilia","Toscana","Trentino-Alto Adige","Umbria","Valle d’Aosta","Veneto"];
const MONTHS = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
const YEARS = Array.from({ length: 12 }, (_, i) => 2026 - i);

type StepKey =
  | "sesso" | "data_nascita" | "regione"
  | "comorbidita" | "oncologica"
  | "fam_onco" | "fam_diabete" | "fam_cardio"
  | "fumo" | "peso_altezza" | "attivita" | "pelle_a" | "pelle_b" | "pelle_c"
  | "hpv" | "cervicale" | "mammografia" | "psa" | "colon";

export function Questionario() {
  const { profile, update, setScreening } = useProfile();
  const navigate = useNavigate();

  // Build dynamic step list from profile (sex/age dependent)
  const eta = profile.eta ?? 0;
  const sesso = profile.sesso;
  const baseSteps: StepKey[] = ["sesso", "data_nascita", "regione", "comorbidita", "oncologica", "fam_onco", "fam_diabete", "fam_cardio", "fumo", "peso_altezza", "attivita", "pelle_a", "pelle_b", "pelle_c"];
  const sec5: StepKey[] = [];
  if (sesso === "F") {
    if (eta >= 25 && eta <= 29) sec5.push("hpv");
    sec5.push("cervicale");
    if (eta >= 45) sec5.push("mammografia");
  }
  if (sesso === "M" && eta >= 50) sec5.push("psa");
  if (eta >= 50) sec5.push("colon");
  const steps: StepKey[] = [...baseSteps, ...sec5];

  const [idx, setIdx] = useState(0);
  const cur = steps[Math.min(idx, steps.length - 1)];

  const sectionOf = (k: StepKey): number => {
    if (["sesso","data_nascita","regione"].includes(k)) return 1;
    if (["comorbidita","oncologica"].includes(k)) return 2;
    if (["fam_onco","fam_diabete","fam_cardio"].includes(k)) return 3;
    if (["fumo","peso_altezza","attivita","pelle_a","pelle_b","pelle_c"].includes(k)) return 4;
    return 5;
  };
  const seg5Progress = sectionOf(cur) === 5
    ? (sec5.indexOf(cur) + 1) / sec5.length
    : undefined;

  const next = () => {
    if (idx + 1 >= steps.length) navigate({ to: "/piano" });
    else setIdx((i) => i + 1);
  };
  const back = () => {
    if (idx === 0) navigate({ to: "/come-funziona" });
    else setIdx((i) => i - 1);
  };

  const common = { section: sectionOf(cur), seg5Progress, onBack: back, onContinue: next };

  switch (cur) {
    case "sesso": return <StepSesso {...common} value={profile.sesso} onSet={(v) => update({ sesso: v })} />;
    case "data_nascita": return <StepDataNascita {...common} eta={profile.eta} onSet={(eta) => update({ eta })} />;
    case "regione": return <StepRegione {...common} value={profile.regione} onSet={(regione) => update({ regione })} />;
    case "comorbidita": return <StepComorbidita {...common} value={profile.comorbidita ?? []} onSet={(v) => update({ comorbidita: v })} />;
    case "oncologica": return <StepOncologica {...common} sesso={profile.sesso!} value={profile.diagnosi_oncologica ?? []} onSet={(v) => update({ diagnosi_oncologica: v })} />;
    case "fam_onco": return <StepFamOnco {...common} value={profile.familiarita_oncologica ?? []} onSet={(v) => update({ familiarita_oncologica: v })} />;
    case "fam_diabete": return <StepFamSingle {...common}
      caption="Familiarità — Diabete"
      question="Qualcuno nella tua famiglia soffre di diabete?"
      subtitle="Considera i parenti più stretti: genitori, fratelli o sorelle, figli."
      value={profile.familiarita_diabete} onSet={(v) => update({ familiarita_diabete: v })} />;
    case "fam_cardio": return <StepFamSingle {...common}
      caption="Familiarità — Cardiovascolare"
      question="Qualcuno nella tua famiglia ha avuto malattie cardiovascolari precoci?"
      subtitle="Per esempio infarto o ictus prima dei 65 anni, nei parenti più stretti (genitori, fratelli o sorelle)."
      value={profile.familiarita_cardio} onSet={(v) => update({ familiarita_cardio: v })} />;
    case "fumo": return <StepFumo {...common} profile={profile} update={update} />;
    case "peso_altezza": return <StepPesoAltezza {...common} h={profile.altezza_cm ?? 168} w={profile.peso_kg ?? 64} onSet={(h, w) => update({ altezza_cm: h, peso_kg: w })} />;
    case "attivita": return <StepAttivita {...common} value={profile.attivita_fisica} onSet={(v) => update({ attivita_fisica: v })} />;
    case "pelle_a": return <StepSingleChoice {...common} question="Come descriveresti la tua pelle?"
      opts={[["chiara","Chiara (mi scotto facilmente al sole)"],["media","Media"],["scura","Scura (mi scotto raramente)"],["ns","Non so / Preferisco non rispondere"]]}
      value={profile.pelle} onSet={(v) => update({ pelle: v as any })} />;
    case "pelle_b": return <StepSingleChoice {...common} question="Hai molti nei sul corpo?"
      opts={[["pochi","Pochi"],["diversi","Diversi"],["molti","Molti o non saprei"],["ns","Non so / Preferisco non rispondere"]]}
      value={profile.nei} onSet={(v) => update({ nei: v as any })} />;
    case "pelle_c": return <StepSingleChoice {...common} question="Quanto ti esponi al sole?"
      opts={[["poco","Poco"],["moderato","Moderatamente"],["molto","Molto (sole intenso, lampade, lavoro all’aperto)"],["ns","Non so / Preferisco non rispondere"]]}
      value={profile.sole} onSet={(v) => update({ sole: v as any })} />;
    case "hpv": return <StepHpv {...common} value={profile.vaccinazione_hpv} onSet={(v) => update({ vaccinazione_hpv: v })} />;
    case "cervicale": return <StepScreeningGenerico {...common}
      screeningId="cervice_uterina"
      question="Hai mai fatto uno screening per la cervice uterina?"
      subtitle="Pap test o HPV-DNA test."
      withTipoOpts={[["pap_test","Pap test"],["hpv_dna","HPV-DNA test"],["ns","Non lo so"]]}
      defaultCadenceMonths={36}
      onSetScreening={setScreening} state={profile.screenings?.["cervice_uterina"] ?? {}} />;
    case "mammografia": return <StepScreeningGenerico {...common}
      screeningId="mammella"
      question="Hai mai fatto una mammografia?"
      defaultCadenceMonths={24}
      onSetScreening={setScreening} state={profile.screenings?.["mammella"] ?? {}} />;
    case "psa": return <StepPsa {...common}
      onSetScreening={setScreening} state={profile.screenings?.["prostata"] ?? {}} />;
    case "colon": return <StepScreeningGenerico {...common}
      screeningId="colon_retto"
      question="Hai mai fatto uno screening per il colon-retto?"
      subtitle="Test del sangue occulto fecale o colonscopia."
      withTipoOpts={[["sof","Sangue occulto fecale"],["colonscopia","Colonscopia"],["ns","Non lo so"]]}
      defaultCadenceMonths={24}
      onSetScreening={setScreening} state={profile.screenings?.["colon_retto"] ?? {}} />;
  }
  return null;
}

// ---------- Step components ------------------------------------------------

type Common = { section: number; seg5Progress?: number; onBack: () => void; onContinue: () => void };

function VenusGlyph({ color = "var(--teal-900)" }: { color?: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="9" r="5.2" />
      <path d="M12 14.2v6.8" /><path d="M9 18.5h6" />
    </svg>
  );
}
function MarsGlyph({ color = "var(--teal-900)" }: { color?: string }) {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9.5" cy="14.5" r="5.2" />
      <path d="M13.7 10.3 20 4" /><path d="M14.5 4H20v5.5" />
    </svg>
  );
}

function SexCard({ label, Glyph, selected, onClick }: any) {
  return (
    <button type="button" onClick={onClick} aria-pressed={selected} style={{
      flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 16,
      padding: "28px 14px 24px", cursor: "pointer", borderRadius: "var(--radius-lg)", textAlign: "center",
      background: selected ? "var(--teal-050)" : "var(--surface-card)",
      border: selected ? "2px solid var(--teal-500)" : "1.5px solid var(--line-200)",
      boxShadow: selected ? "none" : "var(--shadow-xs)",
    }}>
      <span style={{
        width: 76, height: 76, borderRadius: 999, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: selected ? "var(--teal-100)" : "var(--surface-sunken)",
      }}>
        <Glyph color={selected ? "var(--teal-700)" : "var(--teal-900)"} />
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 20, fontWeight: selected ? 700 : 600, color: "var(--teal-900)" }}>{label}</span>
    </button>
  );
}

function StepSesso({ value, onSet, ...c }: Common & { value?: "F"|"M"; onSet: (v: "F"|"M") => void }) {
  return (
    <QuestionFrame {...c} question="Qual è il tuo sesso biologico alla nascita?" canContinue={!!value}>
      <div style={{
        marginBottom: 26, padding: "16px 18px", borderRadius: "var(--radius-lg)",
        background: "var(--teal-050)", border: "1px solid var(--teal-100)",
      }}>
        <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.5, color: "var(--teal-900)" }}>
          Lo chiediamo perché alcune patologie e i relativi screening dipendono dal sesso biologico (es. screening della cervice o della prostata). Questo dato ci serve solo per costruire raccomandazioni mediche accurate — indipendentemente da come ti identifichi.
        </p>
      </div>
      <div style={{ display: "flex", gap: 12 }}>
        <SexCard label="Femmina" Glyph={VenusGlyph} selected={value === "F"} onClick={() => onSet("F")} />
        <SexCard label="Maschio" Glyph={MarsGlyph} selected={value === "M"} onClick={() => onSet("M")} />
      </div>
    </QuestionFrame>
  );
}

function StepDataNascita({ eta, onSet, ...c }: Common & { eta?: number; onSet: (eta: number) => void }) {
  // We capture day/month/year and store eta.
  const today = new Date();
  const initialY = eta ? today.getFullYear() - eta : 1972;
  const [d, setD] = useState("14");
  const [m, setM] = useState("03");
  const [y, setY] = useState(String(initialY));
  const valid = !!d && !!m && y.length === 4 && Number(y) > 1900;
  const onNum = (set: (s: string) => void, max: number) => (e: React.ChangeEvent<HTMLInputElement>) =>
    set(e.target.value.replace(/[^0-9]/g, "").slice(0, max));

  const handleContinue = () => {
    const birth = new Date(Number(y), Number(m) - 1, Number(d));
    let age = today.getFullYear() - birth.getFullYear();
    const mDiff = today.getMonth() - birth.getMonth();
    if (mDiff < 0 || (mDiff === 0 && today.getDate() < birth.getDate())) age--;
    onSet(age);
    c.onContinue();
  };

  const boxStyle = (wide?: boolean): React.CSSProperties => ({
    width: wide ? 116 : 78, height: 78, textAlign: "center",
    border: "1.5px solid var(--line-200)", borderRadius: "var(--radius-md)",
    background: "var(--surface-card)", outline: "none",
    fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)",
    fontSize: 38, fontWeight: "var(--fw-display)" as any, color: "var(--teal-900)",
  });
  const Sep = () => <span style={{ width: 16, textAlign: "center", fontFamily: "var(--font-display)", fontSize: 30, color: "var(--ink-300)" }}>/</span>;
  const Cap = ({ wide, children }: any) => <span style={{ width: wide ? 116 : 78, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 600, color: "var(--ink-500)" }}>{children}</span>;

  return (
    <QuestionFrame {...c} onContinue={handleContinue} question="Qual è la tua data di nascita?" canContinue={valid}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, marginTop: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input inputMode="numeric" value={d} onChange={onNum(setD, 2)} placeholder="GG" style={boxStyle()} />
          <Sep />
          <input inputMode="numeric" value={m} onChange={onNum(setM, 2)} placeholder="MM" style={boxStyle()} />
          <Sep />
          <input inputMode="numeric" value={y} onChange={onNum(setY, 4)} placeholder="AAAA" style={boxStyle(true)} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Cap>Giorno</Cap><span style={{ width: 16 }} />
          <Cap>Mese</Cap><span style={{ width: 16 }} />
          <Cap wide>Anno</Cap>
        </div>
      </div>
    </QuestionFrame>
  );
}

function StepRegione({ value, onSet, ...c }: Common & { value?: string; onSet: (v: string) => void }) {
  const [open, setOpen] = useState(true);
  const sel = value ?? "Lombardia";
  const SOON = ["Piemonte", "Veneto"];
  return (
    <QuestionFrame {...c} question="In quale regione vivi?" canContinue
      onContinue={() => { onSet(sel); c.onContinue(); }}>
      <p style={{ margin: "-12px 0 24px", fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.5, color: "var(--ink-500)" }}>
        Alcuni programmi di screening cambiano da regione a regione. Ci serve per mostrarti i controlli disponibili dove vivi.
      </p>
      <FieldLabel>La tua regione</FieldLabel>
      <button type="button" onClick={() => setOpen((o) => !o)} style={{
        width: "100%", height: 60, padding: "0 16px", cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        border: "2px solid var(--teal-500)", borderRadius: "var(--radius-md)", background: "var(--teal-050)",
      }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, color: "var(--teal-900)" }}>{sel}</span>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--teal-700)"
          strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 220ms" }}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ marginTop: 10, border: "1.5px solid var(--line-200)", borderRadius: "var(--radius-md)", background: "var(--surface-card)", maxHeight: 320, overflowY: "auto" }}>
          {REGIONS.map((r, i) => {
            const active = r === sel;
            const soon = SOON.includes(r);
            const badge = soon
              ? { label: "In arrivo", color: "var(--teal-700)", bg: "var(--teal-100)" }
              : { label: "Prossimamente", color: "var(--ink-400)", bg: "var(--surface-sunken)" };
            return (
              <div key={r} onClick={r === "Lombardia" ? () => setOpen(false) : undefined} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
                minHeight: 52, padding: "13px 16px", cursor: r === "Lombardia" ? "pointer" : "default",
                borderTop: i === 0 ? "none" : "1px solid var(--line-100)",
                background: active ? "var(--teal-050)" : "transparent",
              }}>
                <span style={{ fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.25,
                  fontWeight: active ? 700 : 500,
                  color: active ? "var(--teal-900)" : soon ? "var(--ink-900)" : "var(--ink-400)" }}>{r}</span>
                {active
                  ? <CheckGlyph size={20} />
                  : <span style={{ fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700,
                      letterSpacing: "0.04em", textTransform: "uppercase",
                      color: badge.color, background: badge.bg, padding: "4px 9px", borderRadius: 999, whiteSpace: "nowrap", flexShrink: 0 }}>{badge.label}</span>}
              </div>
            );
          })}
        </div>
      )}
      <p style={{ margin: "14px 2px 0", fontFamily: "var(--font-sans)", fontSize: 14, lineHeight: 1.45, color: "var(--teal-700)" }}>
        Al momento CheckIt è attivo in Lombardia. Piemonte e Veneto sono i prossimi.
      </p>
    </QuestionFrame>
  );
}

function StepComorbidita({ value, onSet, ...c }: Common & { value: string[]; onSet: (v: string[]) => void }) {
  const opts: [string,string][] = [["ipertensione","Ipertensione"],["diabete","Diabete"],["colesterolo","Colesterolo o trigliceridi alti"]];
  const EXCLUSIVE = ["nessuna", "ns"];
  const toggle = (k: string) => {
    if (EXCLUSIVE.includes(k)) { onSet(value.includes(k) ? [] : [k]); return; }
    const next = value.filter((x) => !EXCLUSIVE.includes(x));
    onSet(next.includes(k) ? next.filter((x) => x !== k) : [...next, k]);
  };
  return (
    <QuestionFrame {...c} question="Ti è mai stata diagnosticata una di queste condizioni?" canContinue={value.length > 0}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {opts.map(([k,l]) => <OptionButton key={k} multi selected={value.includes(k)} onClick={() => toggle(k)}>{l}</OptionButton>)}
        <div style={{ display: "flex", alignItems: "center", gap: 14, margin: "4px 2px" }}>
          <span style={{ flex: 1, height: 1, background: "var(--line-100)" }} />
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--ink-400)" }}>oppure</span>
          <span style={{ flex: 1, height: 1, background: "var(--line-100)" }} />
        </div>
        <OptionButton selected={value.includes("nessuna")} onClick={() => toggle("nessuna")}>Nessuna di queste</OptionButton>
        <OptionButton selected={value.includes("ns")} onClick={() => toggle("ns")}>Non so / Preferisco non rispondere</OptionButton>
      </div>
    </QuestionFrame>
  );
}

const ONCO_DONNE: [string,string][] = [["colon_retto","Colon-retto"],["cervice_uterina","Cervice uterina"],["mammella","Mammella"],["altro","Altro"]];
const ONCO_UOMINI: [string,string][] = [["colon_retto","Colon-retto"],["prostata","Prostata"],["altro","Altro"]];

function StepOncologica({ sesso, value, onSet, ...c }: Common & { sesso: "F"|"M"; value: string[]; onSet: (v: string[]) => void }) {
  const [sel, setSel] = useState<"si"|"no"|null>(value.length ? "si" : null);
  const opts = sesso === "F" ? ONCO_DONNE : ONCO_UOMINI;
  const toggle = (k: string) => onSet(value.includes(k) ? value.filter(x => x !== k) : [...value, k]);
  const canContinue = sel === "no" || (sel === "si" && value.length > 0);
  return (
    <QuestionFrame {...c} question="Hai mai ricevuto una diagnosi oncologica?" canContinue={canContinue}>
      <p style={{ margin: "-18px 0 18px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>
        Ci aiuta a personalizzare i tuoi controlli di prevenzione. Questa informazione resta privata e protetta.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><OptionButton compact selected={sel === "si"} onClick={() => setSel("si")}>Sì</OptionButton></div>
        <div style={{ flex: 1 }}><OptionButton compact selected={sel === "no"} onClick={() => { setSel("no"); onSet([]); }}>No</OptionButton></div>
      </div>
      {sel === "si" && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line-100)", display: "flex", flexDirection: "column", gap: 10 }}>
          <FieldLabel>Di quale tipo? Puoi indicarne più di uno.</FieldLabel>
          {opts.map(([k,l]) => <OptionButton key={k} compact multi selected={value.includes(k)} onClick={() => toggle(k)}>{l}</OptionButton>)}
        </div>
      )}
    </QuestionFrame>
  );
}

function StepFamOnco({ value, onSet, ...c }: Common & { value: string[]; onSet: (v: string[]) => void }) {
  const [sel, setSel] = useState<"si"|"no"|"ns"|null>(value.includes("ns") ? "ns" : value.length ? "si" : null);
  const opts: [string,string][] = [["colon","Colon-retto"],["mammella","Mammella"],["ovaio","Ovaio"],["altro","Altro"]];
  const toggle = (k: string) => onSet(value.includes(k) ? value.filter(x => x !== k) : [...value.filter(x => x !== "ns"), k]);
  const canContinue = sel === "no" || sel === "ns" || (sel === "si" && value.filter(v => v !== "ns").length > 0);
  return (
    <QuestionFrame {...c} question="Qualcuno nella tua famiglia ha ricevuto una diagnosi oncologica?" canContinue={canContinue}>
      <p style={{ margin: "-18px 0 18px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>
        Considera i parenti più stretti: genitori, fratelli o sorelle, figli.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><OptionButton compact selected={sel === "si"} onClick={() => { setSel("si"); onSet(value.filter(v => v !== "ns")); }}>Sì</OptionButton></div>
        <div style={{ flex: 1 }}><OptionButton compact selected={sel === "no"} onClick={() => { setSel("no"); onSet([]); }}>No</OptionButton></div>
      </div>
      <div style={{ marginTop: 12 }}>
        <OptionButton compact selected={sel === "ns"} onClick={() => { setSel("ns"); onSet(["ns"]); }}>Non so / Preferisco non rispondere</OptionButton>
      </div>
      {sel === "si" && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--line-100)", display: "flex", flexDirection: "column", gap: 10 }}>
          <FieldLabel>Di quale tipo? Puoi indicarne più di uno.</FieldLabel>
          {opts.map(([k,l]) => <OptionButton key={k} compact multi selected={value.includes(k)} onClick={() => toggle(k)}>{l}</OptionButton>)}
        </div>
      )}
    </QuestionFrame>
  );
}

function StepFamSingle({ caption, question, subtitle, value, onSet, ...c }: Common & { caption: string; question: string; subtitle: string; value?: "si"|"no"|"ns"; onSet: (v: "si"|"no"|"ns") => void }) {
  const opts: [string,string][] = [["si","Sì"],["no","No"],["ns","Non so"]];
  return (
    <QuestionFrame {...c} question={question} canContinue={!!value}>
      <p style={{ margin: "-18px 0 22px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>{subtitle}</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {opts.map(([k,l]) => <OptionButton key={k} selected={value === k} onClick={() => onSet(k as any)}>{l}</OptionButton>)}
      </div>
    </QuestionFrame>
  );
}

const SIGARETTE_OPTS: [NonNullable<UserProfile["sigarette_giorno"]>, string][] = [
  ["1_5", "da 1 a 5"], ["5_10", "da 5 a 10"],
  ["10_20", "da 10 a 20"], ["20_30", "da 20 a 30"],
  ["30_40", "da 30 a 40"], ["40_plus", "Più di 40"],
];

function NumberWheel({ label, value, min, max, onChange }: { label: string; value: number; min: number; max: number; onChange: (v: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 36;
  const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

  useEffect(() => {
    if (containerRef.current) {
      const idx = value - min;
      containerRef.current.scrollTop = idx * itemHeight;
    }
  }, [value, min]);

  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleScroll = () => {
    if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      if (!containerRef.current) return;
      const idx = Math.round(containerRef.current.scrollTop / itemHeight);
      const newVal = Math.min(max, Math.max(min, min + idx));
      if (newVal !== value) onChange(newVal);
    }, 80);
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--ink-500)", marginBottom: 4 }}>{label}</span>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="hide-scrollbar"
        style={{
          height: itemHeight * 3,
          overflowY: "auto",
          scrollSnapType: "y mandatory",
          WebkitOverflowScrolling: "touch",
          border: "1.5px solid var(--line-200)",
          borderRadius: "var(--radius-md)",
          background: "var(--surface-card)",
        }}
      >
        <div style={{ height: itemHeight }} />
        {values.map((v) => (
          <div
            key={v}
            style={{
              height: itemHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              scrollSnapAlign: "center",
              fontFamily: "var(--font-display)",
              fontVariationSettings: "var(--font-display-settings)",
              fontWeight: v === value ? 700 : 400,
              fontSize: v === value ? 22 : 16,
              color: v === value ? "var(--teal-900)" : "var(--ink-300)",
            }}
          >
            {v === max && max === 15 ? "15+" : v}
          </div>
        ))}
        <div style={{ height: itemHeight }} />
      </div>
    </div>
  );
}

function StepFumo({ profile, update, ...c }: Common & { profile: Partial<UserProfile>; update: (patch: Partial<UserProfile>) => void }) {
  const [sel, setSel] = useState<"si"|"no"|null>(profile.fumo === "si" ? "si" : profile.fumo === "no" || profile.fumo === "ex" ? "no" : null);
  const [past, setPast] = useState<"mai"|"smesso"|null>(profile.fumo === "ex" ? "smesso" : profile.fumo === "no" ? "mai" : null);
  const [sig, setSig] = useState<UserProfile["sigarette_giorno"] | undefined>(profile.sigarette_giorno);
  const [anni, setAnni] = useState<number>(profile.ex_smesso_anni ?? 2);
  const [mesi, setMesi] = useState<number>(profile.ex_smesso_mesi ?? 3);

  const canContinue =
    (sel === "si" && !!sig) ||
    (sel === "no" && past === "mai") ||
    (sel === "no" && past === "smesso");

  const handleNext = () => {
    if (sel === "si") update({ fumo: "si", sigarette_giorno: sig, ex_smesso_anni: undefined, ex_smesso_mesi: undefined });
    else if (past === "mai") update({ fumo: "no", sigarette_giorno: undefined, ex_smesso_anni: undefined, ex_smesso_mesi: undefined });
    else if (past === "smesso") update({ fumo: "ex", sigarette_giorno: undefined, ex_smesso_anni: anni, ex_smesso_mesi: mesi });
    c.onContinue();
  };

  return (
    <QuestionFrame {...c} onContinue={handleNext} question="Fumi?" canContinue={canContinue}>
      <p style={{ margin: "-18px 0 18px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>Sigarette o tabacco riscaldato.</p>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><OptionButton compact selected={sel === "si"} onClick={() => setSel("si")}>Sì</OptionButton></div>
        <div style={{ flex: 1 }}><OptionButton compact selected={sel === "no"} onClick={() => setSel("no")}>No</OptionButton></div>
      </div>

      {sel === "si" && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line-100)", display: "flex", flexDirection: "column", gap: 12 }}>
          <FieldLabel>Quante al giorno, più o meno?</FieldLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {SIGARETTE_OPTS.map(([k,l]) => (
              <OptionButton key={k} compact selected={sig === k} onClick={() => setSig(k)}>{l}</OptionButton>
            ))}
          </div>
        </div>
      )}

      {sel === "no" && (
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line-100)", display: "flex", flexDirection: "column", gap: 8 }}>
          <FieldLabel>Hai mai fumato in passato?</FieldLabel>
          <OptionButton compact selected={past === "mai"} onClick={() => setPast("mai")}>No, non ho mai fumato</OptionButton>
          <OptionButton compact selected={past === "smesso"} onClick={() => setPast("smesso")}>Sì, ma ho smesso</OptionButton>

          {past === "smesso" && (
            <div style={{ marginTop: 4, display: "flex", flexDirection: "column", gap: 6 }}>
              <FieldLabel>Da quanto hai smesso?</FieldLabel>
              <div style={{ display: "flex", gap: 10 }}>
                <NumberWheel label="Anni" value={Math.min(anni, 15)} min={0} max={15} onChange={setAnni} />
                <NumberWheel label="Mesi" value={mesi} min={0} max={11} onChange={setMesi} />
              </div>
              <p style={{ margin: "2px 0 0", textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--teal-700)", fontWeight: 600 }}>
                {anni >= 15 ? "15+ anni" : `${anni} ${anni === 1 ? "anno" : "anni"}`} · {mesi} {mesi === 1 ? "mese" : "mesi"}
              </p>
            </div>
          )}
        </div>
      )}
    </QuestionFrame>
  );
}

function StepPesoAltezza({ h: H0, w: W0, onSet, ...c }: Common & { h: number; w: number; onSet: (h: number | null, w: number | null) => void }) {
  const [h, setH] = useState(H0);
  const [w, setW] = useState(W0);
  const [skip, setSkip] = useState(false);
  return (
    <QuestionFrame {...c} onContinue={() => { onSet(skip ? null : h, skip ? null : w); c.onContinue(); }} question="Quanto sei alto e quanto pesi?" canContinue>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14, opacity: skip ? 0.4 : 1, pointerEvents: skip ? "none" : "auto" }}>
          <StepperField label="Altezza" value={h} unit="cm" onDec={() => setH((v) => Math.max(120, v - 1))} onInc={() => setH((v) => Math.min(220, v + 1))} />
          <StepperField label="Peso" value={w} unit="kg" onDec={() => setW((v) => Math.max(35, v - 1))} onInc={() => setW((v) => Math.min(220, v + 1))} />
        </div>
        <button type="button" onClick={() => setSkip((s) => !s)} style={{
          marginTop: 12, width: "100%", padding: 12, cursor: "pointer", borderRadius: "var(--radius-md)",
          border: skip ? "1.5px solid var(--teal-500)" : "1.5px solid transparent",
          background: skip ? "var(--teal-050)" : "transparent",
          fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600,
          color: skip ? "var(--teal-700)" : "var(--ink-500)",
        }}>Non lo so / preferisco non inserirlo</button>
      </div>
    </QuestionFrame>
  );
}

function StepAttivita({ value, onSet, ...c }: Common & { value?: UserProfile["attivita_fisica"]; onSet: (v: NonNullable<UserProfile["attivita_fisica"]>) => void }) {
  const opts: [NonNullable<UserProfile["attivita_fisica"]>,string][] = [
    ["mai","Mai"],
    ["raramente","Qualche volta al mese"],
    ["qualche","Almeno una volta a settimana"],
    ["spesso","Più volte a settimana"],
    ["ns","Non so / Preferisco non rispondere"],
  ];
  return (
    <QuestionFrame {...c} question="Quanto spesso fai attività fisica?" canContinue={!!value}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {opts.map(([k,l]) => <OptionButton key={k} selected={value === k} onClick={() => onSet(k)}>{l}</OptionButton>)}
      </div>
    </QuestionFrame>
  );
}

function StepSingleChoice({
  question, opts, value, onSet, aboveTitle, cta, ctaVariant, ...c
}: Common & { question: string; opts: [string, string][]; value?: string; onSet: (v: string) => void; aboveTitle?: ReactNode; cta?: string; ctaVariant?: "primary"|"soft" }) {
  return (
    <QuestionFrame {...c} question={question} canContinue={!!value} aboveTitle={aboveTitle} cta={cta} ctaVariant={ctaVariant}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {opts.map(([k,l]) => <OptionButton key={k} selected={value === k} onClick={() => onSet(k)}>{l}</OptionButton>)}
      </div>
    </QuestionFrame>
  );
}

function SkinSectionHeader({ n }: { n: 1|2|3 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--teal-700)" }}>
        Pelle e sole · passo {n}/3
      </span>
    </div>
  );
}

function StepHpv({ value, onSet, ...c }: Common & { value?: "si"|"no"|"unknown"; onSet: (v: "si"|"no"|"unknown") => void }) {
  const opts: [string,string][] = [["si","Sì, completato"],["no","No, non l’ho fatto"],["unknown","Non lo so"]];
  return (
    <QuestionFrame {...c} question="Hai completato il ciclo vaccinale contro l'HPV?" canContinue={!!value}>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {opts.map(([k,l]) => <OptionButton key={k} selected={value === k} onClick={() => onSet(k as any)}>{l}</OptionButton>)}
      </div>
    </QuestionFrame>
  );
}

function StepScreeningGenerico({
  screeningId, question, subtitle, withTipoOpts, defaultCadenceMonths,
  onSetScreening, state, ...c
}: Common & {
  screeningId: string; question: string; subtitle?: string;
  withTipoOpts?: [string, string][];
  defaultCadenceMonths: number;
  onSetScreening: (id: string, patch: any) => void; state: any;
}) {
  const [sel, setSel] = useState<"si"|"no"|null>(state.fatto === true ? "si" : state.fatto === false ? "no" : null);
  const [tipo, setTipo] = useState<string | null>(state.ultimo_test_tipo ?? null);
  const [month, setMonth] = useState<string>(state.ultimo_test_data?.split("-")[1] ? MONTHS[Number(state.ultimo_test_data.split("-")[1]) - 1] : "");
  const [year, setYear] = useState<string | number>(state.ultimo_test_data?.split("-")[0] ?? "");
  const [esito, setEsito] = useState<"negativo"|"positivo"|"non_ricordo"|null>(state.ultimo_test_esito ?? null);

  const tipoCad = tipo === "pap_test" ? 36 : tipo === "hpv_dna" ? 60 : defaultCadenceMonths;
  const cadence = withTipoOpts ? Math.round(tipoCad / 12) : Math.round(defaultCadenceMonths / 12);
  const dateSet = month !== "" && year !== "";
  const valid = dateSet && (2026 - Number(year)) <= cadence;
  const showTipo = sel === "si" && !!withTipoOpts;
  const showDate = sel === "si" && (!withTipoOpts || !!tipo);
  const showEsito = showDate && dateSet;
  const canContinue = sel === "no" || (showDate && (!valid || !!esito));

  const handleNext = () => {
    if (sel === "no") onSetScreening(screeningId, { fatto: false, ultimo_test_data: null, ultimo_test_esito: null, ultimo_test_tipo: null });
    else {
      const monthIdx = MONTHS.indexOf(month) + 1;
      const dataStr = year && monthIdx > 0 ? `${year}-${String(monthIdx).padStart(2, "0")}` : null;
      onSetScreening(screeningId, {
        fatto: true,
        ultimo_test_tipo: tipo,
        ultimo_test_data: dataStr,
        ultimo_test_esito: esito,
      });
    }
    c.onContinue();
  };

  const EsitoPill = ({ k, label, dot }: { k: "negativo"|"positivo"; label: string; dot: string }) => {
    const on = esito === k;
    return (
      <button type="button" onClick={() => setEsito(k)} style={{
        flex: 1, display: "flex", flexDirection: "row", alignItems: "center", gap: 10,
        padding: "15px 16px", cursor: "pointer", borderRadius: "var(--radius-lg)", textAlign: "left",
        background: on ? "var(--teal-050)" : "var(--surface-card)",
        border: on ? "2px solid var(--teal-500)" : "1.5px solid var(--line-200)",
      }}>
        <span style={{ width: 11, height: 11, borderRadius: 999, background: dot }} />
        <span style={{ fontFamily: "var(--font-sans)", fontWeight: 600, color: "var(--teal-900)", fontSize: 18 }}>{label}</span>
      </button>
    );
  };

  return (
    <QuestionFrame {...c} onContinue={handleNext} question={question} canContinue={canContinue}>
      {subtitle && <p style={{ margin: "-18px 0 18px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>{subtitle}</p>}
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><OptionButton selected={sel === "si"} onClick={() => setSel("si")}>Sì</OptionButton></div>
        <div style={{ flex: 1 }}><OptionButton selected={sel === "no"} onClick={() => setSel("no")}>No</OptionButton></div>
      </div>
      {sel === "si" && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line-100)", display: "flex", flexDirection: "column", gap: 20 }}>
          {showTipo && (
            <div>
              <FieldLabel>Quale test hai fatto?</FieldLabel>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {withTipoOpts!.map(([k,l]) => <OptionButton key={k} compact selected={tipo === k} onClick={() => setTipo(k)}>{l}</OptionButton>)}
              </div>
            </div>
          )}
          {showDate && (
            <div>
              <FieldLabel>Quando l'hai fatto?</FieldLabel>
              <div style={{ display: "flex", gap: 10 }}>
                <SoftSelect placeholder="Mese" value={month} onChange={(e) => setMonth(e.target.value)}>{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</SoftSelect>
                <SoftSelect placeholder="Anno" value={year} onChange={(e) => setYear(Number(e.target.value))}>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</SoftSelect>
              </div>
            </div>
          )}
          {showEsito && (valid ? (
            <div>
              <FieldLabel>Qual è stato l'esito?</FieldLabel>
              <div style={{ display: "flex", gap: 10 }}>
                <EsitoPill k="negativo" label="Negativo" dot="var(--teal-500)" />
                <EsitoPill k="positivo" label="Positivo" dot="var(--amber-500)" />
              </div>
              <button type="button" onClick={() => setEsito("non_ricordo")} style={{
                marginTop: 12, width: "100%", padding: 12, cursor: "pointer", borderRadius: "var(--radius-md)",
                border: esito === "non_ricordo" ? "1.5px solid var(--teal-500)" : "1.5px solid transparent",
                background: esito === "non_ricordo" ? "var(--teal-050)" : "transparent",
                fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600,
                color: esito === "non_ricordo" ? "var(--teal-700)" : "var(--ink-500)",
              }}>Non lo ricordo</button>
            </div>
          ) : (
            <div style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "14px 16px", borderRadius: "var(--radius-md)", background: "var(--teal-050)", border: "1px solid var(--teal-100)" }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--teal-700)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
              </svg>
              <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.45, color: "var(--teal-900)" }}>
                È passato il tempo consigliato dal tuo ultimo controllo: ti aiuteremo a programmarne uno nuovo.
              </p>
            </div>
          ))}
        </div>
      )}
    </QuestionFrame>
  );
}

function StepPsa({ onSetScreening, state, ...c }: Common & { onSetScreening: (id: string, patch: any) => void; state: any }) {
  const [sel, setSel] = useState<"si"|"no"|null>(state.fatto === true ? "si" : state.fatto === false ? "no" : null);
  const [month, setMonth] = useState<string>(state.ultimo_test_data?.split("-")[1] ? MONTHS[Number(state.ultimo_test_data.split("-")[1]) - 1] : "");
  const [year, setYear] = useState<string | number>(state.ultimo_test_data?.split("-")[0] ?? "");
  const [val, setVal] = useState<number>(state.ultimo_test_valore ?? 1.2);
  const [unknown, setUnknown] = useState(false);

  const cadence = 2;
  const dateSet = month !== "" && year !== "";
  const valid = dateSet && (2026 - Number(year)) <= cadence;
  const canContinue = sel === "no" || (sel === "si" && dateSet && (!valid || unknown || val >= 0));

  const handleNext = () => {
    if (sel === "no") onSetScreening("prostata", { fatto: false, ultimo_test_data: null, ultimo_test_valore: null });
    else {
      const monthIdx = MONTHS.indexOf(month) + 1;
      const dataStr = year && monthIdx > 0 ? `${year}-${String(monthIdx).padStart(2, "0")}` : null;
      onSetScreening("prostata", { fatto: true, ultimo_test_data: dataStr, ultimo_test_valore: unknown ? null : val });
    }
    c.onContinue();
  };

  return (
    <QuestionFrame {...c} onContinue={handleNext} question="Hai mai fatto il test del PSA?" canContinue={canContinue}>
      <p style={{ margin: "-18px 0 18px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>
        Il PSA è un esame del sangue usato per lo screening del tumore alla prostata.
      </p>
      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}><OptionButton selected={sel === "si"} onClick={() => setSel("si")}>Sì</OptionButton></div>
        <div style={{ flex: 1 }}><OptionButton selected={sel === "no"} onClick={() => setSel("no")}>No</OptionButton></div>
      </div>
      {sel === "si" && (
        <div style={{ marginTop: 20, paddingTop: 20, borderTop: "1px solid var(--line-100)", display: "flex", flexDirection: "column", gap: 20 }}>
          <div>
            <FieldLabel>Quando l'hai fatto?</FieldLabel>
            <div style={{ display: "flex", gap: 10 }}>
              <SoftSelect placeholder="Mese" value={month} onChange={(e) => setMonth(e.target.value)}>{MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}</SoftSelect>
              <SoftSelect placeholder="Anno" value={year} onChange={(e) => setYear(Number(e.target.value))}>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</SoftSelect>
            </div>
          </div>
          {dateSet && valid && (
            <div>
              <FieldLabel>Qual è stato il valore? (ng/mL)</FieldLabel>
              <div style={{ opacity: unknown ? 0.4 : 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontFamily: "var(--font-display)", fontSize: 48, fontWeight: "var(--fw-display)" as any, color: "var(--teal-900)" }}>{val.toFixed(1)}</span>
                </div>
                <input type="range" min={0} max={6} step={0.1} value={val}
                  onChange={(e) => { setVal(parseFloat(e.target.value)); setUnknown(false); }}
                  style={{ width: "100%" }} />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 600, color: "var(--ink-400)" }}>
                  <span>0</span><span>1</span><span>3</span><span>6</span>
                </div>
              </div>
              <button type="button" onClick={() => setUnknown((u) => !u)} style={{
                marginTop: 12, width: "100%", padding: 12, cursor: "pointer", borderRadius: "var(--radius-md)",
                border: unknown ? "1.5px solid var(--teal-500)" : "1.5px solid transparent",
                background: unknown ? "var(--teal-050)" : "transparent",
                fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600,
                color: unknown ? "var(--teal-700)" : "var(--ink-500)",
              }}>Non lo ricordo</button>
            </div>
          )}
        </div>
      )}
    </QuestionFrame>
  );
}
