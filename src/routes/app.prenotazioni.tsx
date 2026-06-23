import { useState, type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider, useProfile } from "@/lib/checkit/store";
import { VisitsProvider } from "@/lib/checkit/visits";
import { type MatchedScreening, type UserProfile } from "@/lib/checkit/rules";
import { usePrenotazioni, type StatoPrenotazione } from "@/lib/checkit/prenotazioni";
import {
  bookableSsnScreenings,
  contaDaPrenotare,
  promemoriaMedicoScreenings,
} from "@/lib/checkit/schedule";
import {
  Home as HomeIcon,
  ClipboardCheck,
  Calendar as CalendarIcon,
  FileText,
  MapPin,
  CheckCircle2,
  CalendarCheck,
  ClipboardList,
  X,
  Stethoscope,
  Plus,
} from "lucide-react";

export const Route = createFileRoute("/app/prenotazioni")({
  head: () => ({ meta: [{ title: "CheckIt — Le mie prenotazioni" }] }),
  component: AppPrenotazioniRoute,
});

function AppPrenotazioniRoute() {
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

// ---------------------------------------------------------------------------
// Colors (no red — red is reserved for the questionario)
// ---------------------------------------------------------------------------
const TEAL = "#1D9E75";
const TEAL_DARK = "#0F6E56";
const TEAL_900 = "#04342C";
const TEAL_LIGHT = "#E1F5EE";
const LINE = "#E8E8E8";
const NEUTRAL_BG = "#F5F5F5";
const INK_500 = "#5A5A55";
const INK_700 = "#2E2E2A";

// ---------------------------------------------------------------------------
// Inner
// ---------------------------------------------------------------------------

function Inner() {
  const { profile } = useProfile();
  const { prenotazioni, getPrenotazione, setPrenotazione } = usePrenotazioni();

  const ready = !!profile.sesso && !!profile.eta;

  // Source of truth: lo stesso helper usato dalla Home, basato su computePlan.
  const ssn = ready ? bookableSsnScreenings(profile as UserProfile) : [];
  const promemoria = ready ? promemoriaMedicoScreenings(profile as UserProfile) : [];

  // Order: in_agenda → da_prenotare → eseguito
  type Entry = { s: MatchedScreening; state: StatoPrenotazione };
  const entries: Entry[] = ssn.map((s) => ({ s, state: getPrenotazione(s.id) }));
  const order = (e: Entry) =>
    e.state.stato === "in_agenda" ? 0 : e.state.stato === "da_prenotare" ? 1 : 2;
  entries.sort((a, b) => order(a) - order(b));

  const countDaPrenotare = ready ? contaDaPrenotare(profile as UserProfile, prenotazioni) : 0;
  const eseguiti = entries.filter((e) => e.state.stato === "eseguito");
  const nonEseguiti = entries.filter((e) => e.state.stato !== "eseguito");

  // Modal state
  const [modal, setModal] = useState<
    | { kind: "appuntamento"; screening: MatchedScreening }
    | { kind: "gia_fatto"; screening: MatchedScreening }
    | null
  >(null);

  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 18px 96px", background: "#fff" }}>
        {/* Title */}
        <header style={{ padding: "8px 2px 14px" }}>
          <h1
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontVariationSettings: "var(--font-display-settings)",
              fontWeight: 600,
              fontSize: 30,
              color: TEAL_900,
              letterSpacing: "-0.01em",
              lineHeight: 1.1,
            }}
          >
            Le mie prenotazioni
          </h1>
        </header>

        {/* Sezione: Da prenotare */}
        <section style={{ marginTop: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: 18,
                fontWeight: 700,
                color: TEAL_900,
                letterSpacing: "-0.01em",
              }}
            >
              Da prenotare
            </h2>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 24,
                height: 24,
                padding: "0 8px",
                borderRadius: 999,
                background: TEAL_LIGHT,
                color: TEAL_DARK,
                fontFamily: "var(--font-sans)",
                fontSize: 12.5,
                fontWeight: 800,
              }}
            >
              {countDaPrenotare}
            </span>
          </div>
          <p style={{ margin: "4px 0 14px", fontFamily: "var(--font-sans)", fontSize: 14, color: INK_500, lineHeight: 1.45 }}>
            Screening del Servizio Sanitario Nazionale che puoi prenotare ora.
          </p>

          {ssn.length === 0 ? (
            <EmptyState />
          ) : countDaPrenotare === 0 && nonEseguiti.length === 0 ? (
            <EmptyState />
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {nonEseguiti.map(({ s, state }) =>
                state.stato === "in_agenda" ? (
                  <CardInAgenda key={s.id} screening={s} state={state} />
                ) : (
                  <CardDaPrenotare
                    key={s.id}
                    screening={s}
                    onAppuntamento={() => setModal({ kind: "appuntamento", screening: s })}
                    onGiaFatto={() => setModal({ kind: "gia_fatto", screening: s })}
                  />
                ),
              )}
            </div>
          )}

          {eseguiti.length > 0 && (
            <>
              <h3
                style={{
                  margin: "22px 0 10px",
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: INK_500,
                }}
              >
                Già fatti
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {eseguiti.map(({ s, state }) =>
                  state.stato === "eseguito" ? (
                    <CardEseguito key={s.id} screening={s} state={state} />
                  ) : null,
                )}
              </div>
            </>
          )}
        </section>

        {/* Sezione: Promemoria dal medico */}
        <section style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: TEAL_LIGHT,
                color: TEAL_DARK,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ClipboardList size={18} strokeWidth={2.2} />
            </span>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--font-sans)",
                fontSize: 18,
                fontWeight: 700,
                color: TEAL_900,
                letterSpacing: "-0.01em",
              }}
            >
              Promemoria dal medico
            </h2>
          </div>
          <p style={{ margin: "6px 0 14px", fontFamily: "var(--font-sans)", fontSize: 14, color: INK_500, lineHeight: 1.45 }}>
            Controlli da concordare con il tuo medico di base. Non si prenotano qui.
          </p>

          <div
            style={{
              background: "#fff",
              border: `1px solid ${LINE}`,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            {promemoria.map((p, i) => (
              <div
                key={p.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 12px 12px 0",
                  borderTop: i === 0 ? "none" : `1px solid ${LINE}`,
                  borderLeft: `3px solid ${TEAL}`,
                  paddingLeft: 12,
                }}
              >
                <span
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: p.bg,
                    color: p.color,
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {p.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 700, color: TEAL_900, lineHeight: 1.25 }}>
                    {p.nome}
                  </div>
                  <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: INK_500, marginTop: 2 }}>
                    Parlane alla prossima visita
                  </div>
                </div>
                <button
                  type="button"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 12px",
                    borderRadius: 999,
                    background: "#fff",
                    color: TEAL_DARK,
                    border: `1.5px solid ${TEAL}`,
                    cursor: "pointer",
                    fontFamily: "var(--font-sans)",
                    fontSize: 13,
                    fontWeight: 700,
                    flexShrink: 0,
                  }}
                >
                  <Bookmark size={14} strokeWidth={2.4} />
                  Salva
                </button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />

      {modal?.kind === "appuntamento" && (
        <FormSheet title="Ho già un appuntamento" onClose={() => setModal(null)}>
          <AppuntamentoForm
            onSave={(data, ora, centro) => {
              setPrenotazione(modal.screening.id, { stato: "in_agenda", data, ora, centro });
              setModal(null);
            }}
          />
        </FormSheet>
      )}

      {modal?.kind === "gia_fatto" && (
        <FormSheet title="L'ho già fatto" onClose={() => setModal(null)}>
          <GiaFattoForm
            onSave={(data, refertoId) => {
              setPrenotazione(modal.screening.id, { stato: "eseguito", data, refertoId });
              setModal(null);
            }}
          />
        </FormSheet>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

function CardShell({
  accent,
  bg,
  border,
  children,
}: {
  accent: string;
  bg: string;
  border?: string;
  children: ReactNode;
}) {
  return (
    <div
      style={{
        background: bg,
        border: border ? `1px solid ${border}` : "none",
        borderLeft: `4px solid ${accent}`,
        borderRadius: 14,
        padding: "14px 14px 14px 14px",
      }}
    >
      {children}
    </div>
  );
}

function Badge({ bg, color, children }: { bg: string; color: string; children: ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "3px 9px",
        borderRadius: 999,
        background: bg,
        color,
        fontFamily: "var(--font-sans)",
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      {children}
    </span>
  );
}

function TitleRow({ title, badge }: { title: string; badge?: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div
        style={{
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          fontWeight: 700,
          color: TEAL_900,
          letterSpacing: "-0.01em",
          lineHeight: 1.25,
        }}
      >
        {title}
      </div>
      {badge}
    </div>
  );
}

function CardDaPrenotare({
  screening,
  onAppuntamento,
  onGiaFatto,
}: {
  screening: MatchedScreening;
  onAppuntamento: () => void;
  onGiaFatto: () => void;
}) {
  const cadenza = screening.cadenza_mesi ? cadenzaLabel(screening.cadenza_mesi) : "";
  return (
    <CardShell accent={TEAL} bg="#fff" border={LINE}>
      <TitleRow
        title={screening.nome}
        badge={<Badge bg={TEAL_LIGHT} color={TEAL_DARK}>Gratuito</Badge>}
      />
      <div style={{ marginTop: 4, fontFamily: "var(--font-sans)", fontSize: 13, color: INK_500 }}>
        Programma SSN{cadenza ? ` · ${cadenza}` : ""}
      </div>
      <button
        type="button"
        style={{
          marginTop: 12,
          width: "100%",
          padding: "12px 14px",
          borderRadius: 12,
          background: TEAL,
          color: "#fff",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
          fontSize: 15,
          fontWeight: 700,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <MapPin size={18} strokeWidth={2.4} />
        Trova un centro
      </button>
      <div
        style={{
          marginTop: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          flexWrap: "wrap",
        }}
      >
        <button type="button" onClick={onAppuntamento} style={textLinkStyle}>
          Ho già un appuntamento
        </button>
        <span style={{ color: INK_500, fontFamily: "var(--font-sans)", fontSize: 14 }}>·</span>
        <button type="button" onClick={onGiaFatto} style={textLinkStyle}>
          L'ho già fatto
        </button>
      </div>
    </CardShell>
  );
}

const textLinkStyle: React.CSSProperties = {
  background: "transparent",
  border: "none",
  padding: "4px 2px",
  cursor: "pointer",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 500,
  color: TEAL_DARK,
  textDecoration: "underline",
  textUnderlineOffset: "2px",
};

function CardInAgenda({
  screening,
  state,
}: {
  screening: MatchedScreening;
  state: Extract<StatoPrenotazione, { stato: "in_agenda" }>;
}) {
  return (
    <CardShell accent={TEAL} bg={TEAL_LIGHT}>
      <TitleRow
        title={screening.nome}
        badge={
          <Badge bg="#fff" color={TEAL_DARK}>
            <CheckCircle2 size={12} strokeWidth={2.6} />
            In agenda
          </Badge>
        }
      />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 14, color: TEAL_900 }}>
        <CalendarIcon size={16} strokeWidth={2.2} color={TEAL_DARK} />
        {formatDateOra(state.data, state.ora)}
      </div>
      <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 14, color: TEAL_900 }}>
        <MapPin size={16} strokeWidth={2.2} color={TEAL_DARK} />
        {state.centro}
      </div>
      <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <button type="button" style={textLinkStyle}>Aggiungi al calendario</button>
        <span style={{ color: INK_500, fontFamily: "var(--font-sans)", fontSize: 14 }}>·</span>
        <button type="button" style={textLinkStyle}>Dettagli</button>
      </div>
    </CardShell>
  );
}

function CardEseguito({
  screening,
  state,
}: {
  screening: MatchedScreening;
  state: Extract<StatoPrenotazione, { stato: "eseguito" }>;
}) {
  return (
    <CardShell accent="#B5B5B0" bg={NEUTRAL_BG} border={LINE}>
      <TitleRow
        title={screening.nome}
        badge={<Badge bg="#E8E8E8" color={INK_700}>Eseguito</Badge>}
      />
      <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 14, color: INK_700 }}>
        <CalendarIcon size={16} strokeWidth={2.2} color={INK_500} />
        Eseguito il {formatDate(state.data)}
      </div>
      <div style={{ marginTop: 10 }}>
        <button type="button" style={textLinkStyle}>
          {state.refertoId ? "Vedi referto" : "Carica referto"}
        </button>
      </div>
    </CardShell>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        border: `1.5px dashed ${LINE}`,
        borderRadius: 16,
        padding: "22px 18px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          margin: "0 auto 10px",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: TEAL_LIGHT,
          color: TEAL_DARK,
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <CalendarCheck size={24} strokeWidth={2.2} />
      </div>
      <div style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, color: TEAL_900 }}>
        Nessuna prenotazione in sospeso
      </div>
      <p style={{ margin: "6px 0 0", fontFamily: "var(--font-sans)", fontSize: 14, color: INK_500, lineHeight: 1.45 }}>
        Sei in regola con gli screening. Ti avviseremo quando ci sarà qualcosa da prenotare.
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Modal / form sheet (bottom sheet — large touch targets for 50+)
// ---------------------------------------------------------------------------

function FormSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(4,52,44,0.5)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 50,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          width: "100%",
          borderTopLeftRadius: 22,
          borderTopRightRadius: 22,
          padding: "18px 18px 22px",
          boxShadow: "0 -8px 28px rgba(0,0,0,0.18)",
          maxHeight: "90%",
          overflowY: "auto",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--font-display)",
              fontVariationSettings: "var(--font-display-settings)",
              fontWeight: 600,
              fontSize: 22,
              color: TEAL_900,
            }}
          >
            {title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Chiudi"
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: NEUTRAL_BG,
              border: "none",
              cursor: "pointer",
              color: INK_700,
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} strokeWidth={2.2} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const fieldLabel: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 700,
  color: TEAL_900,
  marginBottom: 6,
  display: "block",
};

const fieldInput: React.CSSProperties = {
  width: "100%",
  padding: "14px 14px",
  borderRadius: 12,
  border: `1.5px solid ${LINE}`,
  background: "#fff",
  fontFamily: "var(--font-sans)",
  fontSize: 16,
  color: TEAL_900,
  outline: "none",
  boxSizing: "border-box",
};

function AppuntamentoForm({
  onSave,
}: {
  onSave: (data: string, ora: string, centro: string) => void;
}) {
  const [data, setData] = useState("");
  const [ora, setOra] = useState("");
  const [centro, setCentro] = useState("");
  const valid = data && ora && centro.trim();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={fieldLabel}>Data appuntamento</label>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={fieldInput} />
      </div>
      <div>
        <label style={fieldLabel}>Ora</label>
        <input type="time" value={ora} onChange={(e) => setOra(e.target.value)} style={fieldInput} />
      </div>
      <div>
        <label style={fieldLabel}>Centro o struttura</label>
        <input
          type="text"
          value={centro}
          onChange={(e) => setCentro(e.target.value)}
          placeholder="Es. ASL Roma 1 — Poliambulatorio"
          style={fieldInput}
        />
      </div>
      <button
        type="button"
        disabled={!valid}
        onClick={() => valid && onSave(data, ora, centro.trim())}
        style={{
          marginTop: 4,
          padding: "14px 16px",
          borderRadius: 12,
          background: valid ? TEAL : "#B7DECF",
          color: "#fff",
          border: "none",
          cursor: valid ? "pointer" : "not-allowed",
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        Salva
      </button>
    </div>
  );
}

function GiaFattoForm({ onSave }: { onSave: (data: string, refertoId?: string) => void }) {
  const [data, setData] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const valid = !!data;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={fieldLabel}>Data esecuzione</label>
        <input type="date" value={data} onChange={(e) => setData(e.target.value)} style={fieldInput} />
      </div>
      <div>
        <label style={fieldLabel}>Carica referto (opzionale)</label>
        <label
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px",
            borderRadius: 12,
            border: `1.5px dashed ${LINE}`,
            background: "#fff",
            cursor: "pointer",
            color: TEAL_DARK,
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            fontWeight: 600,
          }}
        >
          <FileText size={18} strokeWidth={2.2} />
          {fileName ?? "Scegli un file"}
          <input
            type="file"
            accept="image/*,application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) setFileName(f.name);
            }}
          />
        </label>
      </div>
      <button
        type="button"
        disabled={!valid}
        onClick={() => valid && onSave(data, fileName ?? undefined)}
        style={{
          marginTop: 4,
          padding: "14px 16px",
          borderRadius: 12,
          background: valid ? TEAL : "#B7DECF",
          color: "#fff",
          border: "none",
          cursor: valid ? "pointer" : "not-allowed",
          fontFamily: "var(--font-sans)",
          fontSize: 16,
          fontWeight: 700,
        }}
      >
        Salva
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function cadenzaLabel(mesi: number) {
  if (mesi % 12 === 0) {
    const y = mesi / 12;
    return y === 1 ? "ogni anno" : `ogni ${y} anni`;
  }
  return `ogni ${mesi} mesi`;
}

function formatDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("it-IT", { weekday: "short", day: "numeric", month: "short" });
}

function formatDateOra(iso: string, ora: string) {
  const d = formatDate(iso);
  return ora ? `${capitalize(d)} · ${ora}` : capitalize(d);
}

function capitalize(s: string) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
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
        borderTop: `1px solid ${LINE}`,
        padding: "8px 8px 14px",
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 4,
      }}
    >
      <NavTab icon={<HomeIcon size={22} strokeWidth={1.9} />} label="Home" to="/app/home" />
      <NavTab icon={<ClipboardCheck size={22} strokeWidth={1.9} />} label="Piano" to="/app/piano" />
      <NavTab icon={<CalendarIcon size={22} strokeWidth={2.2} />} label="Prenotazioni" active />
      <NavTab icon={<FileText size={22} strokeWidth={1.9} />} label="Referti" />
    </nav>
  );
}

function NavTab({
  icon,
  label,
  active,
  to,
}: {
  icon: ReactNode;
  label: string;
  active?: boolean;
  to?: string;
}) {
  const color = active ? TEAL : "#888780";
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
    <button type="button" aria-current={active ? "page" : undefined} aria-label={label} style={style}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
