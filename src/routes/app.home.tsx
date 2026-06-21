import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider, useProfile } from "@/lib/checkit/store";
import { VisitsProvider } from "@/lib/checkit/visits";
import { computePlan, type UserProfile } from "@/lib/checkit/rules";
import { nextDateFromYearMonth } from "@/lib/checkit/schedule";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  MapPin,
  CheckCircle2,
  Calendar,
  FilePlus2,
  ChevronRight,
  Home,
  ClipboardCheck,
  FileText,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/app/home")({
  head: () => ({ meta: [{ title: "CheckIt — Home" }] }),
  component: AppHomeRoute,
});

function AppHomeRoute() {
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

const SEZIONI_KEY = "checkit-sezioni-completate";

function useSezioniCompletate(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    try {
      const v = sessionStorage.getItem(SEZIONI_KEY);
      const num = v ? Number(v) : 0;
      setN(Number.isFinite(num) ? Math.max(0, Math.min(5, num)) : 0);
    } catch {
      setN(0);
    }
  }, []);
  return n;
}

function Inner() {
  const { profile } = useProfile();
  const sezioniCompletate = useSezioniCompletate();
  const profiloCompleto = sezioniCompletate === 5;
  const percentuale = Math.round((sezioniCompletate / 5) * 100);

  const ready = !!profile.sesso && !!profile.eta;
  const plan = ready ? computePlan(profile as UserProfile) : [];
  const next = plan[0];

  const screenState = next ? profile.screenings?.[next.id] ?? {} : {};
  const prenotato = !!(screenState as { prenotato?: boolean }).prenotato;
  const screeningDaPrenotare = !!next && !prenotato;

  // Date pill (mese/anno) when we have ultimo_test_data + cadenza
  let mese: string | null = null;
  let anno: string | null = null;
  if (next?.cadenza_mesi && screenState.ultimo_test_data && !screenState.data_da_completare) {
    const d = nextDateFromYearMonth(screenState.ultimo_test_data, next.cadenza_mesi);
    const lbl = pillLabels(d);
    mese = lbl.mese;
    anno = lbl.anno;
  }

  return (
    <>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 18px 24px" }}>
        {/* Header */}
        <header className="flex items-center justify-between pt-2 pb-4">
          <h1 className="font-serif text-[28px] leading-tight text-[#04342C]">
            Ciao <span className="italic text-[#0F6E56]">Marco</span>
          </h1>
          <div
            className="flex h-[46px] w-[46px] items-center justify-center rounded-full text-[#0F6E56] font-semibold"
            style={{ background: "#E1F5EE" }}
            aria-label="Avatar"
          >
            M
          </div>
        </header>

        <div className="space-y-5">
          {!profiloCompleto && (
            <QuestionarioCard
              sezioniCompletate={sezioniCompletate}
              percentuale={percentuale}
            />
          )}

          <HeroScreening
            stato={screeningDaPrenotare ? "A" : "B"}
            nome={next?.nome ?? null}
            mese={mese}
            anno={anno}
          />

          <RefertoCard />
        </div>
      </div>

      <BottomNav />
    </>
  );
}

function QuestionarioCard({
  sezioniCompletate,
  percentuale,
}: {
  sezioniCompletate: number;
  percentuale: number;
}) {
  return (
    <section
      className="rounded-3xl p-5"
      style={{ background: "#FCEBEB", border: "1.5px solid #E24B4A" }}
    >
      <div
        className="flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wider"
        style={{ color: "#A32D2D" }}
      >
        <Sparkles size={18} strokeWidth={2.2} />
        Completa il profilo
      </div>
      <h2
        className="mt-2 font-serif leading-snug"
        style={{ color: "#501313", fontSize: 22 }}
      >
        Il tuo piano può essere più preciso
      </h2>
      <p className="mt-1 text-[14px]" style={{ color: "#A32D2D" }}>
        {sezioniCompletate} sezioni su 5 completate.
      </p>

      <div className="mt-4 flex items-center gap-3">
        <Progress
          value={percentuale}
          className="h-2 flex-1 bg-[#F7C1C1] [&>div]:bg-[#E24B4A]"
        />
        <span className="text-[13px] font-bold" style={{ color: "#A32D2D" }}>
          {percentuale}%
        </span>
      </div>

      <Link
        to="/questionario"
        className="mt-5 flex w-full items-center justify-center rounded-2xl py-3 text-[15px] font-semibold text-white"
        style={{ background: "#E24B4A" }}
      >
        Riprendi da dove eri
      </Link>
    </section>
  );
}

function HeroScreening({
  stato,
  nome,
  mese,
  anno,
}: {
  stato: "A" | "B";
  nome: string | null;
  mese: string | null;
  anno: string | null;
}) {
  return (
    <section className="rounded-3xl p-6" style={{ background: "#04342C" }}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {stato === "A" ? (
            <Clock size={18} strokeWidth={2.2} color="#9FE1CB" />
          ) : (
            <CheckCircle2 size={18} strokeWidth={2.2} color="#9FE1CB" />
          )}
          <span
            className="text-[11.5px] font-bold uppercase tracking-wider"
            style={{ color: "#9FE1CB" }}
          >
            {stato === "A" ? "Prossimo screening" : "Sei in regola"}
          </span>
        </div>
        {stato === "A" && (
          <span className="flex items-center gap-1.5 rounded-full bg-white/20 px-2.5 py-1 text-[11.5px] font-semibold text-white">
            <span className="block h-1.5 w-1.5 rounded-full bg-white" />
            In scadenza
          </span>
        )}
      </div>

      {stato === "A" ? (
        <>
          <h2 className="mt-3 font-serif leading-tight text-white" style={{ fontSize: 30 }}>
            {nome ?? "Nessuno screening attivo"}
          </h2>
          <p className="mt-1 text-[14.5px]" style={{ color: "#9FE1CB" }}>
            {mese ? `Consigliata entro ${mese}` : "Consigliata a breve"}
          </p>
          <button
            type="button"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3 text-[15px] font-semibold"
            style={{ color: "#04342C" }}
          >
            <MapPin size={18} strokeWidth={2.2} />
            Trova un centro
          </button>
        </>
      ) : (
        <>
          <h2 className="mt-3 font-serif leading-tight text-white" style={{ fontSize: 26 }}>
            Nessuno screening da prenotare
          </h2>
          {nome && (
            <div className="mt-4 rounded-2xl bg-white/[0.08] p-4">
              <div className="flex items-center gap-2">
                <Calendar size={16} strokeWidth={2.2} color="#9FE1CB" />
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: "#9FE1CB" }}
                >
                  Prossimo in agenda
                </span>
              </div>
              <div className="mt-2 text-[15px] text-white">
                {nome}
                {mese && anno ? ` · ${mese} ${anno}` : ""}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function RefertoCard() {
  return (
    <Link
      to="/visita"
      className="flex items-center gap-4 rounded-3xl p-4"
      style={{ background: "#E1F5EE", textDecoration: "none" }}
    >
      <span
        className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-full bg-white"
        style={{ color: "#0F6E56" }}
      >
        <FilePlus2 size={20} strokeWidth={2.2} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[15px] font-semibold" style={{ color: "#04342C" }}>
          Registra un referto o una visita
        </div>
        <div className="text-[13px]" style={{ color: "#0F6E56" }}>
          Aggiungi un documento o un controllo fatto
        </div>
      </div>
      <ChevronRight size={20} strokeWidth={2.2} color="#0F6E56" />
    </Link>
  );
}

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
      <NavTab icon={<Home size={22} strokeWidth={2.2} />} label="Home" active />
      <NavTab
        icon={<ClipboardCheck size={22} strokeWidth={1.9} />}
        label="Piano"
        to="/app/piano"
      />
      <NavTab icon={<Calendar size={22} strokeWidth={1.9} />} label="Prenotazioni" />
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
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  to?: string;
}) {
  const color = active ? "#1D9E75" : "#888780";
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
