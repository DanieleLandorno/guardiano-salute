import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider, useProfile } from "@/lib/checkit/store";
import { VisitsProvider, useVisits, freqLabel, type Visit } from "@/lib/checkit/visits";
import { computePlan, type MatchedScreening, type UserProfile } from "@/lib/checkit/rules";
import {
  nextDateFromYearMonth,
  nextDateFromIsoDate,
  pillState,
  pillLabels,
  freqToMonths,
} from "@/lib/checkit/schedule";
import {
  Home as HomeIcon,
  ClipboardCheck,
  Calendar as CalendarIcon,
  FileText,
  Plus,
  CheckCircle2,
  Shield,
  Target,
  Heart,
  Droplet,
  Sun,
  Eye,
  Stethoscope,
  Pencil,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

export const Route = createFileRoute("/app/piano")({
  head: () => ({ meta: [{ title: "CheckIt — Il tuo piano" }] }),
  component: AppPianoRoute,
});

function AppPianoRoute() {
  return (
    <ProfileProvider>
      <VisitsProvider>
        <PhoneFrame>
          <Inner />
        </PhoneFrame>
      </VisitsProvider>
    </ProfileProvider>
  );
}

const screeningIcon: Record<string, React.ReactNode> = {
  prostata: <Shield size={20} strokeWidth={2.2} />,
  colon_retto: <Target size={20} strokeWidth={2.2} />,
  cervice_uterina: <Shield size={20} strokeWidth={2.2} />,
  mammella: <Heart size={20} strokeWidth={2.2} />,
};

const organNames: Record<string, string> = {
  cervice_uterina: "Screening della cervice uterina",
  mammella: "Screening mammella",
  prostata: "Screening prostata",
  colon_retto: "Screening colon-retto",
};

const SLOT_PILL = 56;
const SLOT_EDIT = 40;

// Actions where a cadence-based pill does NOT apply
const NO_PILL_ACTIONS = new Set([
  "delega_medico",
  "richiedi_colonscopia",
  "fare_test",
  "primo_invito_futuro",
]);

function Inner() {
  const { profile, setScreening } = useProfile();
  const { visits } = useVisits();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ready = !!profile.sesso && !!profile.eta;
  const plan = ready ? computePlan(profile as UserProfile) : [];

  const diagnosed = (profile.diagnosi_oncologica ?? [])
    .filter((id) => id in organNames)
    .map((id) => ({ id, nome: organNames[id] }));

  const nazionali = plan.filter((p) => ["cervice_uterina", "mammella", "colon_retto"].includes(p.id));
  const regionali = plan.filter((p) => p.id === "prostata");
  const planSsn = [...nazionali, ...regionali];
  const diagnosedIds = new Set(diagnosed.map((d) => d.id));
  type SsnEntry = { key: string; id: string; nome: string; screening?: MatchedScreening; isDiagnosed: boolean };
  const ssnAll: SsnEntry[] = [
    ...planSsn.map<SsnEntry>((s) => ({ key: s.id, id: s.id, nome: s.nome, screening: s, isDiagnosed: diagnosedIds.has(s.id) })),
    ...diagnosed
      .filter((d) => !planSsn.some((s) => s.id === d.id))
      .map<SsnEntry>((d) => ({ key: d.id, id: d.id, nome: d.nome, isDiagnosed: true })),
  ];
  const diagnosedExtra = diagnosed.filter((d) => !planSsn.some((s) => s.id === d.id)).length;

  const racc: { id: string; nome: string; meta?: string; icon: React.ReactNode; bg: string; color: string }[] = [];
  if (
    profile.familiarita_cardio === "si" ||
    (profile.comorbidita ?? []).includes("ipertensione") ||
    (profile.comorbidita ?? []).includes("colesterolo")
  ) {
    racc.push({ id: "cardiovascolare", nome: "Cardiovascolare", meta: "Pressione e profilo lipidico", icon: <Heart size={20} strokeWidth={2.2} />, bg: "#E1F5EE", color: "#0F6E56" });
  } else {
    racc.push({ id: "cardiovascolare", nome: "Cardiovascolare", icon: <Heart size={20} strokeWidth={2.2} />, bg: "#E1F5EE", color: "#0F6E56" });
  }
  if (profile.familiarita_diabete === "si" || (profile.comorbidita ?? []).includes("diabete") || (profile.eta ?? 0) >= 45) {
    racc.push({ id: "diabete", nome: "Diabete", meta: "Glicemia o HbA1c", icon: <Droplet size={20} strokeWidth={2.2} />, bg: "#EAF3F0", color: "#0F6E56" });
  }

  const buone = [
    { id: "dermatologia", nome: "Dermatologia", meta: profile.pelle === "chiara" || profile.nei === "molti" ? "Consigliato controllo annuale" : undefined, icon: <Sun size={20} strokeWidth={2.2} />, bg: "#EAF3F0", color: "#0F6E56" },
    { id: "oculistica", nome: "Oculistica", icon: <Eye size={20} strokeWidth={2.2} />, bg: "#EAF3F0", color: "#0F6E56" },
    { id: "controlli_periodici", nome: "Controlli periodici", meta: "dal medico di base", icon: <Stethoscope size={20} strokeWidth={2.2} />, bg: "#EAF3F0", color: "#0F6E56" },
  ];

  const visitsByScreening = visits.reduce<Record<string, Visit[]>>((acc, v) => {
    if (v.screening_id) (acc[v.screening_id] ??= []).push(v);
    return acc;
  }, {});

  const standaloneVisits = visits.filter((v) => !v.screening_id);
  const totaleControlli = plan.length + diagnosedExtra + racc.length + buone.length;

  const scrollToVisit = (id: string) => {
    const el = scrollRef.current?.querySelector(`[data-visita-id="${id}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.animate(
        [
          { boxShadow: "0 0 0 0 rgba(29,158,117,0.0)" },
          { boxShadow: "0 0 0 6px rgba(29,158,117,0.30)" },
          { boxShadow: "0 0 0 0 rgba(29,158,117,0)" },
        ],
        { duration: 1200, easing: "ease-out" },
      );
    }
  };

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (hash.startsWith("visita-")) {
      const id = hash.slice("visita-".length);
      setTimeout(() => scrollToVisit(id), 120);
    }
  }, []);

  return (
    <>
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 18px 96px" }}>
        {/* Header */}
        <div style={{ padding: "8px 2px 14px" }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--teal-700)" }}>
            Prevenzione
          </div>
          <h1 style={{ margin: "4px 0 4px", fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)", fontWeight: "var(--fw-display)" as any, fontSize: 32, color: "var(--teal-900)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            Il tuo piano
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>
            In base alle linee guida ministeriali e regionali.
          </p>
          {ready && totaleControlli > 0 && (
            <div style={{ marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px", borderRadius: 999, background: "var(--teal-100)", color: "var(--teal-900)", fontFamily: "var(--font-sans)", fontSize: 14.5, fontWeight: 700 }}>
              <CheckCircle2 size={18} strokeWidth={2.2} color="var(--teal-700)" />
              {totaleControlli} controlli nel tuo piano
            </div>
          )}
        </div>

        {!ready && (
          <p style={{ padding: 16, color: "var(--ink-500)" }}>
            Completa prima il questionario per generare il tuo piano.
          </p>
        )}

        {ready && (
          <>
            <Card eyebrow="Programmi del SSN" subtitle="Previsti dal Servizio Sanitario Nazionale">
              {ssnAll.map((s) => (
                <ScreeningRow
                  key={s.key}
                  icon={screeningIcon[s.id] ?? <Shield size={20} strokeWidth={2.2} />}
                  iconBg="var(--teal-100)"
                  iconColor="var(--teal-700)"
                  title={s.nome}
                  meta={s.screening ? [s.screening.regione, s.screening.meta].filter(Boolean).join(" · ") : undefined}
                  badge={
                    !s.isDiagnosed && s.screening
                      ? s.id === "prostata"
                        ? { label: "Su adesione", kind: "novita" }
                        : { label: "Gratuito", kind: "free" }
                      : undefined
                  }
                  screening={!s.isDiagnosed ? s.screening : undefined}
                  profile={!s.isDiagnosed ? (profile as UserProfile) : undefined}
                  onSetUltimoTest={
                    !s.isDiagnosed && s.screening
                      ? (yyyymm) => setScreening(s.id, { ultimo_test_data: yyyymm })
                      : undefined
                  }
                  diagnosisBadge={s.isDiagnosed}
                  linkedVisits={visitsByScreening[s.id] ?? []}
                />
              ))}
              {ssnAll.length === 0 && (
                <div style={{ padding: "16px 4px", fontSize: 14.5, color: "var(--ink-500)" }}>
                  Nessun programma SSN attivo per il tuo profilo al momento.
                </div>
              )}
            </Card>

            <Card eyebrow="Linee guida nazionali" subtitle="Raccomandati — parlane col tuo medico">
              {racc.map((r) => (
                <ScreeningRow
                  key={r.id}
                  icon={r.icon}
                  iconBg={r.bg}
                  iconColor={r.color}
                  title={r.nome}
                  meta={r.meta}
                  linkedVisits={visitsByScreening[r.id] ?? []}
                />
              ))}
            </Card>

            <Card eyebrow="Buone pratiche" subtitle="Da concordare con il tuo medico">
              {buone.map((r) => (
                <ScreeningRow
                  key={r.id}
                  icon={r.icon}
                  iconBg={r.bg}
                  iconColor={r.color}
                  title={r.nome}
                  meta={r.meta}
                  linkedVisits={visitsByScreening[r.id] ?? []}
                />
              ))}
            </Card>

          </>
        )}

        {/* Le tue visite — solo standalone (senza screening_id); sempre visibile */}
        <section style={{ marginTop: 18, marginBottom: 6, background: "var(--teal-100)", borderRadius: 18, padding: "16px 14px", boxShadow: "0 2px 8px rgba(4,52,44,0.06)" }}>
          <div style={{ padding: "0 4px 10px" }}>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--teal-700)" }}>Le tue visite</div>
            <div style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--ink-700)", marginTop: 2 }}>Visite che hai aggiunto</div>
          </div>
          {standaloneVisits.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {standaloneVisits.map((v) => (
                <div key={v.id} data-visita-id={v.id} style={{ background: "#fff", borderRadius: 14, padding: "12px 12px 12px 14px" }}>
                  <VisitInlineRow v={v} />
                </div>
              ))}
            </div>
          ) : (
            <div style={{ background: "#fff", borderRadius: 14, padding: "16px 14px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-500)", lineHeight: 1.4 }}>
                Non hai ancora aggiunto visite personali
              </div>
              <Link
                to="/visita"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  alignSelf: "flex-start",
                  padding: "10px 16px",
                  borderRadius: 999,
                  background: "var(--teal-500)",
                  color: "#fff",
                  textDecoration: "none",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14.5,
                  fontWeight: 700,
                }}
              >
                <Plus size={16} strokeWidth={2.6} />
                Aggiungi una visita
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* FAB */}
      <Link
        to="/visita"
        aria-label="Aggiungi una visita"
        style={{
          position: "absolute",
          right: 18,
          bottom: 96,
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: "var(--teal-500)",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 12px 24px rgba(4,52,44,0.22)",
          zIndex: 20,
        }}
      >
        <Plus size={28} strokeWidth={2.6} />
      </Link>

      <BottomNav />
    </>
  );
}

function Card({ eyebrow, subtitle, children }: { eyebrow: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 14, background: "#fff", border: "1px solid var(--line-200)", borderRadius: 18, padding: "14px 14px 6px", boxShadow: "0 1px 2px rgba(4,52,44,0.04)" }}>
      <div style={{ padding: "2px 4px 8px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 18, height: 3, borderRadius: 999, background: "var(--teal-500)" }} />
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--teal-700)" }}>{eyebrow}</div>
      </div>
      {subtitle && (
        <div style={{ padding: "0 4px 6px", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--ink-700)" }}>{subtitle}</div>
      )}
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Pill: due-date chip (mese/anno)
// ---------------------------------------------------------------------------

function PillSlot({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ width: SLOT_PILL, flexShrink: 0, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
      {children}
    </div>
  );
}

function EditSlot({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ width: SLOT_EDIT, flexShrink: 0, display: "flex", justifyContent: "center", alignItems: "center" }}>
      {children}
    </div>
  );
}

function DuePill({ date }: { date: Date }) {
  const state = pillState(date);
  const { mese, anno } = pillLabels(date);
  const bg = state === "futura" ? "#E1F5EE" : "#FBF1DD";
  const fg = state === "futura" ? "#0F6E56" : "#97681A";
  return (
    <div
      aria-label={`Scadenza ${mese} ${anno} (${state})`}
      style={{
        width: 52,
        minHeight: 52,
        borderRadius: 12,
        background: bg,
        color: fg,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "6px 4px",
        fontFamily: "var(--font-sans)",
        lineHeight: 1.05,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.04em" }}>{mese}</div>
      <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{anno}</div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ScreeningRow
// ---------------------------------------------------------------------------

interface ScreeningRowProps {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  meta?: string;
  badge?: { label: string; kind: "free" | "novita" };
  screening?: MatchedScreening;
  profile?: UserProfile;
  onSetUltimoTest?: (yyyymm: string) => void;
  diagnosisBadge?: boolean;
  linkedVisits?: Visit[];
}

function ScreeningRow({
  icon, iconBg, iconColor, title, meta, badge,
  screening, profile, onSetUltimoTest,
  diagnosisBadge, linkedVisits = [],
}: ScreeningRowProps) {
  const [diagOpen, setDiagOpen] = useState(false);
  // Determine pill / missing-data state
  const screenState = screening && profile ? profile.screenings?.[screening.id] ?? {} : {};
  const cadenceApplies = !!screening
    && !diagnosisBadge
    && !!screening.cadenza_mesi
    && !NO_PILL_ACTIONS.has(screening.azione);

  const hasLastTestDate = !!screenState.ultimo_test_data && !screenState.data_da_completare;
  const dueDate = cadenceApplies && hasLastTestDate
    ? nextDateFromYearMonth(screenState.ultimo_test_data!, screening!.cadenza_mesi!)
    : null;

  const needsLastTest = cadenceApplies && !hasLastTestDate && !!onSetUltimoTest;

  return (
    <div style={{ padding: "12px 4px", borderTop: "1px solid var(--line-100)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
        <span style={{ flexShrink: 0, width: 36, height: 36, borderRadius: "50%", background: iconBg, color: iconColor, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "#04342C", letterSpacing: "-0.01em", lineHeight: 1.25, whiteSpace: "normal", wordBreak: "normal" }}>
            {title}
          </div>
          {(badge || meta) && (
            <div style={{ marginTop: 4, fontFamily: "var(--font-sans)", fontSize: 11.5, color: "#888780", lineHeight: 1.35 }}>
              {badge && (
                <span style={{ color: "#0F6E56", fontWeight: 600 }}>{badge.label}</span>
              )}
              {badge && meta ? " · " : ""}
              {meta}
            </div>
          )}

          {diagnosisBadge && <DiagnosisToggleButton open={diagOpen} onToggle={() => setDiagOpen((o) => !o)} />}

          {needsLastTest && (
            <MissingDataAlert onSubmit={(yyyymm) => onSetUltimoTest!(yyyymm)} />
          )}
        </div>

        {/* Reserved column — omitted entirely for diagnosis rows so expanded note can go full width */}
        {!diagnosisBadge && <PillSlot>{dueDate && <DuePill date={dueDate} />}</PillSlot>}
      </div>

      {/* Diagnosis expanded note — full width */}
      {diagnosisBadge && diagOpen && (
        <div style={{ marginTop: 8, marginLeft: 46, padding: "10px 12px", background: "#FBF1DD", borderLeft: "3px solid #D9A93E", borderRadius: 8, fontFamily: "var(--font-sans)", fontSize: 13, color: "#7A5310", lineHeight: 1.4 }}>
          Avendo una diagnosi in corso, non rientri nello screening preventivo: il percorso lo definisce il tuo specialista.
        </div>
      )}

      {/* Linked visits (inline "AGGIUNTE DA TE") */}
      {linkedVisits.length > 0 && (
        <div style={{ marginTop: 6, marginLeft: 50, borderLeft: "3px solid var(--teal-500)", paddingLeft: 12 }}>
          <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--teal-700)", marginBottom: 4 }}>
            AGGIUNTE DA TE:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {linkedVisits.map((v) => (
              <div key={v.id} data-visita-id={v.id} style={{ padding: "4px 2px" }}>
                <VisitInlineRow v={v} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Diagnosis badge (toggle)
// ---------------------------------------------------------------------------

function DiagnosisToggleButton({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  return (
    <div style={{ marginTop: 8 }}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 10px",
          borderRadius: 999,
          background: "#FBF1DD",
          color: "#97681A",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: 13,
          fontWeight: 700,
          whiteSpace: "nowrap",
          width: "fit-content",
          maxWidth: "100%",
        }}
      >
        <Stethoscope size={15} strokeWidth={2.2} />
        Seguito da specialista
        <ChevronDown
          size={15}
          strokeWidth={2.4}
          style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 180ms", flexShrink: 0 }}
        />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Missing-data alert + inline date entry
// ---------------------------------------------------------------------------

function MissingDataAlert({ onSubmit }: { onSubmit: (yyyymm: string) => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          marginTop: 8,
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "10px 12px",
          background: "#FBF1DD",
          borderLeft: "3px solid #D9A93E",
          borderRadius: 8,
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "var(--font-sans)",
          fontSize: 13.5,
          color: "#7A5310",
          fontWeight: 600,
        }}
      >
        <AlertCircle size={16} strokeWidth={2.2} />
        Completa le informazioni mancanti
      </button>
    );
  }
  return (
    <div style={{ marginTop: 8, padding: "10px 10px", background: "#FBF1DD", borderLeft: "3px solid #D9A93E", borderRadius: 8 }}>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: "#7A5310", marginBottom: 8, fontWeight: 600 }}>
        Quando hai fatto l'ultimo test?
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input
          type="month"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 8,
            border: "1.5px solid #D9A93E",
            background: "#fff",
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--teal-900)",
            outline: "none",
          }}
        />
        <button
          type="button"
          disabled={!value}
          onClick={() => {
            if (value) {
              onSubmit(value);
              setOpen(false);
            }
          }}
          style={{
            padding: "10px 14px",
            borderRadius: 8,
            border: "none",
            background: value ? "#97681A" : "#D9C293",
            color: "#fff",
            fontFamily: "var(--font-sans)",
            fontSize: 13.5,
            fontWeight: 700,
            cursor: value ? "pointer" : "not-allowed",
          }}
        >
          Salva
        </button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// VisitInlineRow — used both inline under a screening and in "Le tue visite"
// Layout: [contenuto][matita][pill]  — colonne riservate
// ---------------------------------------------------------------------------

function VisitInlineRow({ v }: { v: Visit }) {
  const navigate = useNavigate();
  const months = freqToMonths(v.frequenza_n, v.frequenza_u);
  const next = v.data ? nextDateFromIsoDate(v.data, months) : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: "var(--teal-900)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {v.nome}
        </div>
        <div style={{ marginTop: 2, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "var(--ink-500)" }}>
          {freqLabel(v.frequenza_n, v.frequenza_u)}
        </div>
      </div>
      <EditSlot>
        <button
          type="button"
          aria-label={`Modifica ${v.nome}`}
          onClick={() => navigate({ to: "/visita", search: { id: v.id } })}
          style={{
            width: 36, height: 36, display: "inline-flex", alignItems: "center", justifyContent: "center",
            borderRadius: 8, color: "var(--teal-700)", background: "transparent", border: "none", cursor: "pointer",
          }}
        >
          <Pencil size={17} strokeWidth={2.2} />
        </button>
      </EditSlot>
      <PillSlot>{next && <DuePill date={next} />}</PillSlot>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bottom nav
// ---------------------------------------------------------------------------

function BottomNav() {
  return (
    <nav
      style={{
        flexShrink: 0,
        background: "#fff",
        borderTop: "1px solid var(--line-200)",
        padding: "8px 8px 14px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 4,
      }}
    >
      <NavTab icon={<HomeIcon size={22} strokeWidth={1.9} />} label="Home" to="/app/home" />
      <NavTab icon={<ClipboardCheck size={22} strokeWidth={2.2} />} label="Piano" active />
      <NavTab icon={<CalendarIcon size={22} strokeWidth={1.9} />} label="Prenotazioni" to="/app/prenotazioni" />
      <NavTab icon={<FileText size={22} strokeWidth={1.9} />} label="Referti" />
    </nav>
  );
}

function NavTab({ icon, label, active, to }: { icon: React.ReactNode; label: string; active?: boolean; to?: string }) {
  const color = active ? "var(--teal-700)" : "var(--ink-400)";
  const style: React.CSSProperties = {
    background: "transparent",
    border: "none",
    padding: "6px 4px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 4,
    color,
    cursor: active ? "default" : "pointer",
    fontFamily: "var(--font-sans)",
    fontSize: 11.5,
    fontWeight: active ? 700 : 600,
    textDecoration: "none",
  };
  if (to && !active) {
    return (
      <Link to={to} style={style} aria-label={label}>
        {icon}
        <span>{label}</span>
      </Link>
    );
  }
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={label}
      style={style}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

