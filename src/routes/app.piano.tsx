import { useEffect, useRef } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider, useProfile } from "@/lib/checkit/store";
import { VisitsProvider, useVisits, formatDateIT, visitStatus, freqLabel, TIPOLOGIE, type Visit } from "@/lib/checkit/visits";
import { computePlan, type UserProfile } from "@/lib/checkit/rules";
import { Home as HomeIcon, ClipboardCheck, Calendar as CalendarIcon, FileText, Plus, CheckCircle2, Shield, Target, Heart, Droplet, Sun, Eye, Stethoscope, Link2, Pencil } from "lucide-react";

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

function Inner() {
  const { profile } = useProfile();
  const { visits } = useVisits();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const ready = !!profile.sesso && !!profile.eta;
  const plan = ready ? computePlan(profile as UserProfile) : [];

  const organNames: Record<string, string> = {
    cervice_uterina: "Screening della cervice uterina",
    mammella: "Screening mammella",
    prostata: "Screening prostata",
    colon_retto: "Screening colon-retto",
  };
  const diagnosed = (profile.diagnosi_oncologica ?? [])
    .filter((id) => id in organNames)
    .map((id) => ({ id, nome: organNames[id] }));

  const nazionali = plan.filter((p) => ["cervice_uterina", "mammella", "colon_retto"].includes(p.id));
  const regionali = plan.filter((p) => p.id === "prostata");
  const ssnAll = [...nazionali, ...regionali];

  const racc: { nome: string; meta?: string; icon: React.ReactNode; bg: string; color: string }[] = [];
  if (profile.familiarita_cardio === "si" || (profile.comorbidita ?? []).includes("ipertensione") || (profile.comorbidita ?? []).includes("colesterolo")) {
    racc.push({ nome: "Cardiovascolare", meta: "Pressione e profilo lipidico", icon: <Heart size={20} strokeWidth={2.2} />, bg: "#FBE6E6", color: "#C0392B" });
  } else {
    racc.push({ nome: "Cardiovascolare", icon: <Heart size={20} strokeWidth={2.2} />, bg: "#FBE6E6", color: "#C0392B" });
  }
  if (profile.familiarita_diabete === "si" || (profile.comorbidita ?? []).includes("diabete") || (profile.eta ?? 0) >= 45) {
    racc.push({ nome: "Diabete", meta: "Glicemia o HbA1c", icon: <Droplet size={20} strokeWidth={2.2} />, bg: "#E6EEFB", color: "#2C6E84" });
  }

  const buone = [
    { nome: "Dermatologia", meta: profile.pelle === "chiara" || profile.nei === "molti" ? "Consigliato controllo annuale" : undefined, icon: <Sun size={20} strokeWidth={2.2} />, bg: "#FBF1DD", color: "#97681A" },
    { nome: "Oculistica", icon: <Eye size={20} strokeWidth={2.2} />, bg: "#E6F4F0", color: "var(--teal-700)" },
    { nome: "Controlli periodici", meta: "dal medico di base", icon: <Stethoscope size={20} strokeWidth={2.2} />, bg: "#EEF0EC", color: "var(--ink-700)" },
  ];

  const visitsByScreening = visits.reduce<Record<string, Visit[]>>((acc, v) => {
    if (v.screening_id) (acc[v.screening_id] ??= []).push(v);
    return acc;
  }, {});

  const totaleControlli = plan.length + racc.length;

  const scrollToVisit = (id: string) => {
    const el = scrollRef.current?.querySelector(`[data-visita-id="${id}"]`) as HTMLElement | null;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.animate(
        [{ boxShadow: "0 0 0 0 rgba(29,158,117,0.0)" }, { boxShadow: "0 0 0 6px rgba(29,158,117,0.30)" }, { boxShadow: "0 0 0 0 rgba(29,158,117,0)" }],
        { duration: 1200, easing: "ease-out" }
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
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "8px 18px 200px" }}>
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
                  key={s.id}
                  icon={screeningIcon[s.id] ?? <Shield size={20} strokeWidth={2.2} />}
                  iconBg="var(--teal-100)"
                  iconColor="var(--teal-700)"
                  title={s.nome}
                  meta={[s.regione, s.meta].filter(Boolean).join(" · ")}
                  badge={s.id === "prostata" ? { label: "Su adesione", kind: "novita" } : { label: "Gratuito", kind: "free" }}
                  linked={visitsByScreening[s.id]}
                  onLinked={scrollToVisit}
                />
              ))}
              {diagnosed.map((d) => (
                <ScreeningRow
                  key={d.id}
                  icon={screeningIcon[d.id] ?? <Shield size={20} strokeWidth={2.2} />}
                  iconBg="var(--teal-100)"
                  iconColor="var(--teal-700)"
                  title={d.nome}
                  callout="Sei già seguito da uno specialista, non rientra nello screening preventivo."
                  linked={visitsByScreening[d.id]}
                  onLinked={scrollToVisit}
                />
              ))}
              {ssnAll.length === 0 && diagnosed.length === 0 && (
                <div style={{ padding: "16px 4px", fontSize: 14.5, color: "var(--ink-500)" }}>
                  Nessun programma SSN attivo per il tuo profilo al momento.
                </div>
              )}
            </Card>

            <Card eyebrow="Linee guida nazionali" subtitle="Raccomandati — parlane col tuo medico">
              {racc.map((r) => (
                <ScreeningRow key={r.nome} icon={r.icon} iconBg={r.bg} iconColor={r.color} title={r.nome} meta={r.meta} />
              ))}
            </Card>

            <Card eyebrow="Buone pratiche" subtitle="Da concordare con il tuo medico">
              {buone.map((r) => (
                <ScreeningRow key={r.nome} icon={r.icon} iconBg={r.bg} iconColor={r.color} title={r.nome} meta={r.meta} />
              ))}
            </Card>

            {/* Le tue visite */}
            <section style={{ marginTop: 18, marginBottom: 6, background: "var(--teal-100)", borderRadius: 18, padding: "16px 14px", boxShadow: "0 2px 8px rgba(4,52,44,0.06)" }}>
              <div style={{ padding: "0 4px 10px" }}>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--teal-700)" }}>Le tue visite</div>
                <div style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--ink-700)", marginTop: 2 }}>Visite che hai aggiunto</div>
              </div>
              {visits.length === 0 ? (
                <div style={{ background: "#fff", borderRadius: 14, padding: 16, fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--ink-500)", textAlign: "center" }}>
                  Non hai ancora aggiunto visite. Tocca il "+" per iniziare.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {visits.map((v) => <VisitCard key={v.id} v={v} screeningName={v.screening_id ? organNames[v.screening_id] ?? null : null} />)}
                </div>
              )}
            </section>
          </>
        )}
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

      {/* Bottom nav */}
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

function ScreeningRow({ icon, iconBg, iconColor, title, meta, badge, callout, linked, onLinked }: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  title: string;
  meta?: string;
  badge?: { label: string; kind: "free" | "novita" };
  callout?: string;
  linked?: Visit[];
  onLinked?: (id: string) => void;
}) {
  return (
    <div style={{ padding: "12px 4px", borderTop: "1px solid var(--line-100)", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", background: iconBg, color: iconColor, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, color: "var(--teal-900)", letterSpacing: "-0.01em", lineHeight: 1.25 }}>
              {title}
            </div>
            {badge && (
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, flexShrink: 0, whiteSpace: "nowrap",
                background: badge.kind === "free" ? "var(--teal-100)" : "#FBF1DD",
                color: badge.kind === "free" ? "var(--teal-700)" : "#97681A",
              }}>
                {badge.label}
              </span>
            )}
          </div>
          {meta && (
            <div style={{ marginTop: 2, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-500)" }}>{meta}</div>
          )}
        </div>
      </div>

      {callout && (
        <div style={{ marginLeft: 50, padding: "10px 12px", background: "#FBF1DD", borderLeft: "3px solid #D4942A", borderRadius: 8, fontFamily: "var(--font-sans)", fontSize: 13.5, color: "#7A5310", lineHeight: 1.4 }}>
          {callout}
        </div>
      )}

      {linked && linked.length > 0 && (
        <button
          type="button"
          onClick={() => onLinked?.(linked[0].id)}
          style={{ marginLeft: 50, alignSelf: "flex-start", display: "inline-flex", alignItems: "center", gap: 6, padding: 0, background: "transparent", border: "none", color: "var(--teal-700)", fontFamily: "var(--font-sans)", fontSize: 13.5, fontWeight: 700, cursor: "pointer" }}
        >
          <Link2 size={15} strokeWidth={2.2} />
          Hai una visita collegata · Vedi sotto
        </button>
      )}
    </div>
  );
}

function VisitCard({ v, screeningName }: { v: Visit; screeningName: string | null }) {
  const status = visitStatus(v.data);
  const dateLabel = formatDateIT(v.data);
  const tipologia = v.tipologia === "altro"
    ? (v.tipologia_altro ?? "Altro")
    : TIPOLOGIE.find((t) => t.value === v.tipologia)?.label ?? v.tipologia;

  return (
    <div data-visita-id={v.id} style={{ background: "#fff", borderRadius: 14, padding: "14px 14px 14px 16px", display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--teal-700)", marginBottom: 4 }}>
          {tipologia}
        </div>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, color: "var(--teal-900)", lineHeight: 1.25, letterSpacing: "-0.01em" }}>
          {v.nome}
        </div>
        <div style={{ marginTop: 6, fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--ink-700)" }}>
          {freqLabel(v.frequenza_n, v.frequenza_u)} · {status === "futura" ? "Prossima" : "Ultima"}: <strong style={{ color: "var(--teal-900)", fontWeight: 700 }}>{dateLabel}</strong>
        </div>
        {screeningName && (
          <div style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 6, fontFamily: "var(--font-sans)", fontSize: 13, color: "var(--teal-700)", fontWeight: 600 }}>
            <Link2 size={14} strokeWidth={2.2} />
            Collegata a {screeningName}
          </div>
        )}
      </div>
      <Link
        to="/visita"
        search={{ id: v.id }}
        aria-label={`Modifica ${v.nome}`}
        style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10, color: "var(--teal-700)", flexShrink: 0 }}
      >
        <Pencil size={18} strokeWidth={2.2} />
      </Link>
    </div>
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
      <NavTab icon={<HomeIcon size={22} strokeWidth={1.9} />} label="Home" />
      <NavTab icon={<ClipboardCheck size={22} strokeWidth={2.2} />} label="Piano" active />
      <NavTab icon={<CalendarIcon size={22} strokeWidth={1.9} />} label="Prenotazioni" />
      <NavTab icon={<FileText size={22} strokeWidth={1.9} />} label="Referti" />
    </nav>
  );
}

function NavTab({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  const color = active ? "var(--teal-700)" : "var(--ink-400)";
  return (
    <button
      type="button"
      aria-current={active ? "page" : undefined}
      aria-label={label}
      style={{
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
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
