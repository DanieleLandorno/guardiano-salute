import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider, useProfile } from "@/lib/checkit/store";
import { computePlan, type UserProfile } from "@/lib/checkit/rules";

export const Route = createFileRoute("/piano")({
  head: () => ({ meta: [{ title: "CheckIt — Il tuo piano" }] }),
  component: PianoRoute,
});

function PianoRoute() {
  return (
    <ProfileProvider>
      <PhoneFrame>
        <Inner />
      </PhoneFrame>
    </ProfileProvider>
  );
}

function Inner() {
  const { profile } = useProfile();
  const ready = !!profile.sesso && !!profile.eta;
  const plan = ready ? computePlan(profile as UserProfile) : [];

  // Band 1: SSN — cervice, mammella, colon → nazionali; prostata → "Su adesione" regionale
  const nazionali = plan.filter((p) => ["cervice_uterina", "mammella", "colon_retto"].includes(p.id));
  const regionali = plan.filter((p) => p.id === "prostata");

  const organNames: Record<string, string> = {
    cervice_uterina: "Screening della cervice uterina",
    mammella: "Screening mammella",
    prostata: "Screening prostata",
    colon_retto: "Screening colon-retto",
  };
  const diagnosed = (profile.diagnosi_oncologica ?? [])
    .filter((id) => id in organNames)
    .map((id) => ({ id, nome: organNames[id] }));

  // Band 2: raccomandati — cardiovascolare/diabete in base alle risposte
  const racc: { nome: string; meta?: string }[] = [];
  if (profile.familiarita_cardio === "si" || (profile.comorbidita ?? []).includes("ipertensione") || (profile.comorbidita ?? []).includes("colesterolo")) {
    racc.push({ nome: "Cardiovascolare", meta: "Pressione e profilo lipidico" });
  } else racc.push({ nome: "Cardiovascolare" });
  if (profile.familiarita_diabete === "si" || (profile.comorbidita ?? []).includes("diabete") || (profile.eta ?? 0) >= 45) {
    racc.push({ nome: "Diabete", meta: "Glicemia o HbA1c" });
  }

  // Band 3: buone pratiche
  const buone = [
    { nome: "Dermatologia", meta: profile.pelle === "chiara" || profile.nei === "molti" ? "Consigliato controllo annuale" : undefined },
    { nome: "Oculistica" },
    { nome: "Controlli periodici dal medico di base" },
  ];

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", padding: "2px 12px", flexShrink: 0 }}>
        <Link to="/questionario" aria-label="Indietro" style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", border: "none", background: "none", color: "var(--teal-900)" }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
        </Link>
      </div>
      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "0 16px 20px" }}>
        <div style={{ padding: "4px 6px 16px" }}>
          <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)", fontWeight: "var(--fw-display)" as any, fontSize: 32, color: "var(--teal-900)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
            Il tuo piano
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)", maxWidth: 320 }}>
            Personalizzato sulle linee guida ministeriali e regionali.
          </p>
        </div>

        {!ready && (
          <p style={{ padding: 16, color: "var(--ink-500)" }}>
            Completa prima il questionario per generare il tuo piano.
          </p>
        )}

        {ready && (
          <>
            <Band accent="#2C6E84" eyebrow="Programmi del SSN" title="Previsti dal Servizio Sanitario Nazionale">
              {nazionali.length > 0 && <SubLabel>Programmi nazionali</SubLabel>}
              {nazionali.map((s) => <Row key={s.id} name={s.nome} meta={s.meta} action={s.azione} accent="#2C6E84" badge={{ kind: "free", label: "Gratuito" }} />)}
              {regionali.length > 0 && <SubLabel>Nella tua regione</SubLabel>}
              {regionali.map((s) => (
                <Row key={s.id} name={`${s.nome}`} meta={`${profile.regione ?? ""} · ${s.meta ?? ""}`} action={s.azione} accent="#2C6E84"
                  badge={{ kind: "novita", label: "Su adesione" }} />
              ))}
              {diagnosed.map((d) => (
                <Row key={d.id} name={d.nome} note="Sei già seguito da uno specialista per questo — non rientra nello screening preventivo." accent="#2C6E84" />
              ))}
              {nazionali.length === 0 && regionali.length === 0 && diagnosed.length === 0 && <EmptyMsg>Nessun programma SSN attivo per il tuo profilo al momento.</EmptyMsg>}
            </Band>

            <Band accent="#5B4B86" eyebrow="Linee guida nazionali" title="Raccomandati per te">
              <Msg>Le linee guida nazionali suggeriscono di tenere d'occhio questi valori — parlane col tuo medico.</Msg>
              {racc.map((r) => <Row key={r.nome} name={r.nome} meta={r.meta} accent="#5B4B86" />)}
            </Band>

            <Band accent="#4A7236" eyebrow="Buone pratiche" title="Da concordare con il tuo medico">
              <Msg>Buone abitudini di prevenzione che valgono per molti adulti.</Msg>
              {buone.map((r) => <Row key={r.nome} name={r.nome} meta={r.meta} accent="#4A7236" />)}
            </Band>
          </>
        )}
      </div>

      <div style={{ flexShrink: 0, background: "#fff", borderTop: "1px solid var(--line-200)", padding: "13px 18px 18px", display: "flex", flexDirection: "column", alignItems: "center", gap: 9 }}>
        <button type="button" className="ci-btn ci-btn--primary ci-btn--lg ci-btn--block">Aggiungi alla mia lista</button>
        <p style={{ margin: 0, textAlign: "center", fontFamily: "var(--font-sans)", fontSize: 13, lineHeight: 1.45, color: "var(--ink-500)", maxWidth: 320 }}>
          Aggiungiamo i tuoi screening alla lista prenotazioni e i controlli da segnalare al medico.
        </p>
      </div>
    </>
  );
}

function Band({ accent, eyebrow, title, children }: { accent: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 22 }}>
      <header style={{ position: "sticky", top: 0, zIndex: 5, background: accent, padding: "13px 16px", borderRadius: "16px 16px 0 0", boxShadow: "0 6px 14px -8px rgba(4,52,44,0.35)" }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.82)" }}>{eyebrow}</div>
        <h2 style={{ margin: "4px 0 0", fontFamily: "var(--font-sans)", fontWeight: 700, fontSize: 20, lineHeight: 1.2, color: "#fff", letterSpacing: "-0.01em" }}>{title}</h2>
      </header>
      <div style={{ background: "var(--surface-page)", border: "1px solid var(--line-200)", borderTop: "none", borderRadius: "0 0 16px 16px", padding: "4px 14px 6px" }}>
        {children}
      </div>
    </section>
  );
}

function SubLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "var(--font-sans)", fontSize: 11.5, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", color: "var(--teal-700)", margin: "16px 4px 2px" }}>{children}</div>;
}
function Msg({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "12px 4px 4px", fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.5, color: "var(--ink-700)" }}>{children}</p>;
}
function EmptyMsg({ children }: { children: React.ReactNode }) {
  return <p style={{ margin: "16px 4px", fontFamily: "var(--font-sans)", fontSize: 14.5, color: "var(--ink-500)" }}>{children}</p>;
}

function Row({ name, meta, action, accent, badge }: { name: string; meta?: string; action?: string; accent: string; badge?: { kind: "free" | "novita"; label: string } }) {
  const isDelegaMedico = action === "delega_medico" || action === "richiedi_colonscopia";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 13, padding: "15px 4px", borderBottom: "1px solid var(--line-100)" }}>
      <span style={{ width: 4, height: 26, borderRadius: 999, background: accent, flexShrink: 0 }} />
      <span style={{ flex: 1, minWidth: 0, fontFamily: "var(--font-sans)", fontSize: 17, fontWeight: 700, color: "var(--teal-900)", letterSpacing: "-0.01em" }}>
        {name}
        {meta && <span style={{ fontWeight: 600, color: "var(--ink-400)" }}> · {meta}</span>}
        {isDelegaMedico && <span style={{ display: "block", marginTop: 3, fontSize: 13, fontWeight: 600, color: "var(--amber-500)" }}>Da gestire con il tuo medico</span>}
      </span>
      {badge && (
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 5,
          fontFamily: "var(--font-sans)", fontSize: 12.5, fontWeight: 700, padding: "4px 10px", borderRadius: 999, flexShrink: 0, whiteSpace: "nowrap",
          background: badge.kind === "free" ? "var(--teal-100)" : "#FBF1DD",
          color: badge.kind === "free" ? "var(--teal-700)" : "#97681A",
        }}>
          {badge.kind === "novita" && <span style={{ width: 7, height: 7, borderRadius: 999, background: "currentColor" }} />}
          {badge.label}
        </span>
      )}
    </div>
  );
}
