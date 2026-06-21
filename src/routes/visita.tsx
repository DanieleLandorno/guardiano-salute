import { useMemo, useState } from "react";
import { createFileRoute, useNavigate, useSearch, Link } from "@tanstack/react-router";
import { z } from "zod";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider, useProfile } from "@/lib/checkit/store";
import { VisitsProvider, useVisits, TIPOLOGIE, type VisitTipologia, type Visit } from "@/lib/checkit/visits";
import { computePlan, type UserProfile } from "@/lib/checkit/rules";

export const Route = createFileRoute("/visita")({
  head: () => ({ meta: [{ title: "CheckIt — Aggiungi visita" }] }),
  validateSearch: z.object({ id: z.string().optional() }),
  component: VisitaRoute,
});

function VisitaRoute() {
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

const inputBase: React.CSSProperties = {
  width: "100%",
  fontFamily: "var(--font-sans)",
  fontSize: 16,
  padding: "14px 14px",
  borderRadius: 12,
  border: "1.5px solid var(--line-200)",
  background: "#fff",
  color: "var(--teal-900)",
  outline: "none",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--font-sans)",
  fontSize: 14,
  fontWeight: 600,
  color: "var(--teal-900)",
  marginBottom: 8,
};

const microStyle: React.CSSProperties = {
  fontFamily: "var(--font-sans)",
  fontSize: 13,
  color: "var(--ink-500)",
  marginTop: 6,
};

function Inner() {
  const navigate = useNavigate();
  const { id } = useSearch({ from: "/visita" });
  const { profile } = useProfile();
  const { visits, add, update, remove } = useVisits();

  const editing = useMemo(() => visits.find((v) => v.id === id), [visits, id]);
  const isEdit = !!editing;

  const [tipologia, setTipologia] = useState<VisitTipologia | "">(editing?.tipologia ?? "");
  const [tipologiaAltro, setTipologiaAltro] = useState(editing?.tipologia_altro ?? "");
  const [collegata, setCollegata] = useState<"no" | "si">(editing?.screening_id ? "si" : "no");
  const [screeningId, setScreeningId] = useState<string>(editing?.screening_id ?? "");
  const [nome, setNome] = useState(editing?.nome ?? "");
  const [freqN, setFreqN] = useState<number>(editing?.frequenza_n ?? 12);
  const [freqU, setFreqU] = useState<"mesi" | "anni">(editing?.frequenza_u ?? "mesi");
  const [data, setData] = useState<string>(editing?.data ?? "");
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Available screenings, grouped for the selector
  const planGroups = useMemo(() => {
    const ready = !!profile.sesso && !!profile.eta;
    const plan = ready ? computePlan(profile as UserProfile) : [];

    const nazionali = plan.filter((p) => ["cervice_uterina", "mammella", "colon_retto"].includes(p.id));
    const regionali = plan.filter((p) => p.id === "prostata");
    const ssn = [...nazionali, ...regionali].map((p) => ({ id: p.id, nome: p.nome }));

    const organNames: Record<string, string> = {
      cervice_uterina: "Screening della cervice uterina",
      mammella: "Screening mammella",
      prostata: "Screening prostata",
      colon_retto: "Screening colon-retto",
    };
    const diagnosed = (profile.diagnosi_oncologica ?? [])
      .filter((id) => id in organNames)
      .map((id) => ({ id, nome: organNames[id] }));

    const racc: { id: string; nome: string }[] = [];
    if (
      profile.familiarita_cardio === "si" ||
      (profile.comorbidita ?? []).includes("ipertensione") ||
      (profile.comorbidita ?? []).includes("colesterolo")
    ) {
      racc.push({ id: "cardiovascolare", nome: "Cardiovascolare" });
    } else {
      racc.push({ id: "cardiovascolare", nome: "Cardiovascolare" });
    }
    if (profile.familiarita_diabete === "si" || (profile.comorbidita ?? []).includes("diabete") || (profile.eta ?? 0) >= 45) {
      racc.push({ id: "diabete", nome: "Diabete" });
    }

    const buone = [
      { id: "dermatologia", nome: "Dermatologia" },
      { id: "oculistica", nome: "Oculistica" },
      { id: "controlli_periodici", nome: "Controlli periodici" },
    ];

    return { ssn, racc, buone, diagnosed };
  }, [profile]);

  const hasAnyScreening =
    planGroups.ssn.length + planGroups.racc.length + planGroups.buone.length + planGroups.diagnosed.length > 0;

  const valid =
    !!tipologia &&
    (tipologia !== "altro" || tipologiaAltro.trim().length > 0) &&
    (collegata === "no" || (collegata === "si" && !!screeningId)) &&
    nome.trim().length > 0 &&
    freqN > 0 &&
    !!data;

  const onSubmit = () => {
    if (!valid) return;
    const payload: Omit<Visit, "id"> = {
      tipologia: tipologia as VisitTipologia,
      tipologia_altro: tipologia === "altro" ? tipologiaAltro.trim() : undefined,
      nome: nome.trim(),
      frequenza_n: freqN,
      frequenza_u: freqU,
      data,
      screening_id: collegata === "si" ? screeningId : null,
    };
    if (isEdit && editing) {
      update(editing.id, payload);
    } else {
      const v = add(payload);
      // scroll target hash via search not needed; piano scroll uses id
      navigate({ to: "/app/piano", hash: `visita-${v.id}` });
      return;
    }
    navigate({ to: "/app/piano", hash: `visita-${editing!.id}` });
  };

  const onDelete = () => {
    if (!editing) return;
    remove(editing.id);
    navigate({ to: "/app/piano" });
  };

  return (
    <>
      {/* Top bar with X */}
      <div style={{ display: "flex", alignItems: "center", padding: "2px 12px", flexShrink: 0 }}>
        <Link
          to="/app/piano"
          aria-label="Chiudi"
          style={{ width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--teal-900)" }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </Link>
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "4px 20px 20px" }}>
        <h1 style={{ margin: "0 0 6px", fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)", fontWeight: "var(--fw-display)" as any, fontSize: 30, color: "var(--teal-900)", letterSpacing: "-0.01em", lineHeight: 1.1 }}>
          {isEdit ? "Modifica visita" : "Aggiungi una visita"}
        </h1>
        <p style={{ margin: "0 0 22px", fontFamily: "var(--font-sans)", fontSize: 15, lineHeight: 1.45, color: "var(--ink-500)" }}>
          {isEdit ? "Aggiorna i dati della tua visita." : "Registra una visita ricorrente che già fai."}
        </p>

        {/* Nome personalizzato (primo campo) */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle} htmlFor="nome">Nome personalizzato</label>
          <input
            id="nome"
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="es. Visita oncologica colon-retto"
            style={inputBase}
          />
          <div style={microStyle}>Come vuoi chiamarla nel piano.</div>
        </div>

        {/* Tipologia */}
        <div style={{ marginBottom: 18 }}>
          <label style={labelStyle} htmlFor="tipologia">Tipologia di visita</label>
          <select
            id="tipologia"
            value={tipologia}
            onChange={(e) => setTipologia(e.target.value as VisitTipologia)}
            style={{ ...inputBase, color: tipologia ? "var(--teal-900)" : "var(--ink-400)", appearance: "none", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2304342C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", paddingRight: 40 }}
          >
            <option value="" disabled>Seleziona…</option>
            {TIPOLOGIE.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {tipologia === "altro" && (
            <input
              type="text"
              value={tipologiaAltro}
              onChange={(e) => setTipologiaAltro(e.target.value)}
              placeholder="Specifica la tipologia"
              style={{ ...inputBase, marginTop: 10 }}
            />
          )}
        </div>

        {/* Collegata a screening */}
        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle as React.CSSProperties}>Questa visita riguarda uno dei tuoi screening?</span>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <RadioRow checked={collegata === "no"} onChange={() => { setCollegata("no"); setScreeningId(""); }} label="No, è una visita a sé" />
            <RadioRow checked={collegata === "si"} onChange={() => setCollegata("si")} label="Sì, è collegata a uno screening" />
          </div>
          {collegata === "si" && (
            <select
              value={screeningId}
              onChange={(e) => setScreeningId(e.target.value)}
              style={{ ...inputBase, marginTop: 10, color: screeningId ? "var(--teal-900)" : "var(--ink-400)", appearance: "none", backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='14' height='14' viewBox='0 0 24 24' fill='none' stroke='%2304342C' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><path d='m6 9 6 6 6-6'/></svg>\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 16px center", paddingRight: 40 }}
            >
              <option value="" disabled>Seleziona uno screening…</option>
              {planGroups.ssn.length > 0 && (
                <optgroup label="Programmi del SSN">
                  {planGroups.ssn.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </optgroup>
              )}
              {planGroups.racc.length > 0 && (
                <optgroup label="Linee guida nazionali">
                  {planGroups.racc.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </optgroup>
              )}
              {planGroups.buone.length > 0 && (
                <optgroup label="Buone pratiche">
                  {planGroups.buone.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </optgroup>
              )}
              {planGroups.diagnosed.length > 0 && (
                <optgroup label="Sei seguito da uno specialista">
                  {planGroups.diagnosed.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </optgroup>
              )}
              {!hasAnyScreening && <option value="" disabled>Nessuno screening disponibile</option>}
            </select>
          )}
        </div>


        {/* Frequenza */}
        <div style={{ marginBottom: 18 }}>
          <span style={labelStyle as React.CSSProperties}>Frequenza</span>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ display: "flex", alignItems: "center", border: "1.5px solid var(--line-200)", borderRadius: 12, background: "#fff", overflow: "hidden", flex: "0 0 auto" }}>
              <button type="button" aria-label="Diminuisci" onClick={() => setFreqN((n) => Math.max(1, n - 1))} style={stepperBtn}>−</button>
              <input
                type="number"
                inputMode="numeric"
                min={1}
                value={freqN}
                onChange={(e) => setFreqN(Math.max(1, parseInt(e.target.value || "1", 10)))}
                style={{ width: 64, textAlign: "center", border: "none", outline: "none", fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, color: "var(--teal-900)", background: "transparent", padding: "12px 0" }}
              />
              <button type="button" aria-label="Aumenta" onClick={() => setFreqN((n) => n + 1)} style={stepperBtn}>+</button>
            </div>
            <div style={{ display: "inline-flex", border: "1.5px solid var(--line-200)", borderRadius: 12, padding: 4, background: "#fff", gap: 4 }}>
              <SegBtn active={freqU === "mesi"} onClick={() => setFreqU("mesi")}>Mesi</SegBtn>
              <SegBtn active={freqU === "anni"} onClick={() => setFreqU("anni")}>Anni</SegBtn>
            </div>
          </div>
        </div>

        {/* Data */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle} htmlFor="data">Data ultima o prossima visita</label>
          <input
            id="data"
            type="date"
            value={data}
            onChange={(e) => setData(e.target.value)}
            style={{ ...inputBase, color: data ? "var(--teal-900)" : "var(--ink-400)", fontWeight: data ? 600 : 400 }}
          />
          <div style={microStyle}>Capiamo noi se è già passata o in arrivo.</div>
        </div>

        {/* Delete (edit only) */}
        {isEdit && (
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "none", background: "transparent", color: "#E24B4A", fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 700, cursor: "pointer" }}
          >
            Elimina visita
          </button>
        )}
      </div>

      {/* Bottom CTA */}
      <div style={{ flexShrink: 0, background: "#fff", borderTop: "1px solid var(--line-200)", padding: "13px 18px 18px" }}>
        <button
          type="button"
          disabled={!valid}
          onClick={onSubmit}
          style={{
            width: "100%",
            padding: "16px 22px",
            borderRadius: 999,
            background: valid ? "var(--teal-500)" : "var(--teal-300)",
            color: "#fff",
            fontFamily: "var(--font-sans)",
            fontSize: 17,
            fontWeight: 700,
            border: "none",
            cursor: valid ? "pointer" : "not-allowed",
            transition: "background 200ms ease",
          }}
        >
          {isEdit ? "Salva modifiche" : "Aggiungi al piano"}
        </button>
      </div>

      {confirmDelete && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(4,52,44,0.55)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 18, padding: 22, maxWidth: 320, width: "100%", boxShadow: "0 20px 50px rgba(0,0,0,0.25)" }}>
            <h3 style={{ margin: "0 0 8px", fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 700, color: "var(--teal-900)" }}>Eliminare la visita?</h3>
            <p style={{ margin: "0 0 18px", fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.45, color: "var(--ink-700)" }}>
              Vuoi eliminare questa visita? L'azione non è reversibile.
            </p>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" onClick={() => setConfirmDelete(false)} style={{ flex: 1, padding: "12px 16px", borderRadius: 999, border: "1.5px solid var(--line-200)", background: "#fff", color: "var(--teal-900)", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Annulla</button>
              <button type="button" onClick={onDelete} style={{ flex: 1, padding: "12px 16px", borderRadius: 999, border: "none", background: "#E24B4A", color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer", fontFamily: "var(--font-sans)" }}>Elimina</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const stepperBtn: React.CSSProperties = {
  width: 44, height: 48, border: "none", background: "transparent", color: "var(--teal-900)",
  fontSize: 22, fontWeight: 700, cursor: "pointer", fontFamily: "var(--font-sans)",
};

function SegBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "10px 18px",
        borderRadius: 8,
        border: "none",
        background: active ? "var(--teal-500)" : "transparent",
        color: active ? "#fff" : "var(--ink-700)",
        fontFamily: "var(--font-sans)",
        fontSize: 15,
        fontWeight: 700,
        cursor: "pointer",
        transition: "background 150ms ease",
      }}
    >
      {children}
    </button>
  );
}

function RadioRow({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onChange}
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "14px 14px", borderRadius: 12,
        border: checked ? "2px solid var(--teal-500)" : "1.5px solid var(--line-200)",
        background: checked ? "var(--teal-050)" : "#fff",
        cursor: "pointer",
        fontFamily: "var(--font-sans)",
        textAlign: "left",
        width: "100%",
      }}
    >
      <span style={{ width: 22, height: 22, borderRadius: "50%", border: checked ? "2px solid var(--teal-500)" : "2px solid var(--ink-300)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {checked && <span style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--teal-500)" }} />}
      </span>
      <span style={{ fontSize: 15.5, color: "var(--teal-900)", fontWeight: 600 }}>{label}</span>
    </button>
  );
}
