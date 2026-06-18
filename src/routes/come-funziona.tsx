import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider } from "@/lib/checkit/store";

export const Route = createFileRoute("/come-funziona")({
  head: () => ({ meta: [{ title: "CheckIt — Come funziona" }] }),
  component: HowRoute,
});

function HowRoute() {
  const navigate = useNavigate();
  return (
    <ProfileProvider>
      <PhoneFrame>
        <div style={{ padding: "4px 20px 0" }}>
          <Link to="/privacy" aria-label="Indietro" style={{
            width: 44, height: 44, marginLeft: -10,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            border: "none", background: "none", cursor: "pointer", color: "var(--teal-900)",
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
          </Link>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ width: 56, height: 56, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--teal-050)", color: "var(--teal-700)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          </span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)", fontSize: 30, lineHeight: 1.2, fontWeight: "var(--fw-display)" as any, color: "var(--teal-900)", letterSpacing: "-0.01em" }}>
            Qualche domanda <span style={{ fontStyle: "italic", color: "var(--teal-500)" }}>su di te</span>
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.5, color: "var(--ink-700)" }}>
            Servono a costruire il tuo piano di prevenzione su misura.
          </p>
          <Point>Solo poche domande sono obbligatorie (come età e sesso): servono per le raccomandazioni di base.</Point>
          <Point>Per tutte le altre puoi rispondere “Non lo so” o saltarle quando vuoi.</Point>
          <Point highlight>Più rispondi, più il tuo piano sarà accurato.</Point>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--ink-500)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            Bastano pochi minuti.
          </span>
        </div>
        <div style={{ padding: "14px 24px 26px", borderTop: "1px solid var(--line-100)" }}>
          <button type="button" onClick={() => navigate({ to: "/questionario" })}
            className="ci-btn ci-btn--primary ci-btn--lg ci-btn--block">Iniziamo</button>
        </div>
      </PhoneFrame>
    </ProfileProvider>
  );
}

function Point({ highlight, children }: { highlight?: boolean; children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--teal-050)", color: "var(--teal-700)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
        </svg>
      </span>
      <span style={{
        fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.4,
        fontWeight: highlight ? 600 : 400,
        color: highlight ? "var(--teal-900)" : "var(--ink-700)",
      }}>{children}</span>
    </div>
  );
}
