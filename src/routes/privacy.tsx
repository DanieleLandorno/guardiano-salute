import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider } from "@/lib/checkit/store";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [{ title: "CheckIt — Privacy e consenso" }] }),
  component: PrivacyRoute,
});

function PrivacyRoute() {
  const [c1, setC1] = useState(false);
  const navigate = useNavigate();
  return (
    <ProfileProvider>
      <PhoneFrame>
        <TopBar to="/" />
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: "20px 24px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
          <span style={{ width: 56, height: 56, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--teal-050)", color: "var(--teal-700)" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
            </svg>
          </span>
          <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)", fontSize: 30, lineHeight: 1.2, fontWeight: "var(--fw-display)" as any, color: "var(--teal-900)", letterSpacing: "-0.01em" }}>
            I tuoi dati, <span style={{ fontStyle: "italic", color: "var(--teal-500)" }}>al sicuro</span>
          </h1>
          <p style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: 17, lineHeight: 1.5, color: "var(--ink-700)" }}>
            CheckIt tratta i tuoi dati sanitari in conformità al GDPR (art. 6 e 9).
          </p>
          <ReassurePoint>Crittografati e conservati su server sicuri in Europa</ReassurePoint>
          <ReassurePoint>Non condividiamo i tuoi dati con terze parti per finalità commerciali</ReassurePoint>
          <ReassurePoint>Puoi esportarli o cancellarli in qualsiasi momento</ReassurePoint>

          <Consent checked={c1} onClick={() => setC1((x) => !x)}>
            Accetto il trattamento dei miei dati sanitari per ricevere raccomandazioni personalizzate di prevenzione.
          </Consent>
        </div>
        <div style={{ padding: "14px 24px 26px", borderTop: "1px solid var(--line-100)" }}>
          <button type="button" disabled={!c1} onClick={() => navigate({ to: "/come-funziona" })}
            className="ci-btn ci-btn--primary ci-btn--lg ci-btn--block">Continua</button>
        </div>
      </PhoneFrame>
    </ProfileProvider>
  );
}

function TopBar({ to }: { to: string }) {
  return (
    <div style={{ padding: "4px 20px 0" }}>
      <Link to={to} aria-label="Indietro" style={{
        width: 44, height: 44, marginLeft: -10,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        border: "none", background: "none", cursor: "pointer", color: "var(--teal-900)",
      }}>
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
      </Link>
    </div>
  );
}

function ReassurePoint({ children }: { children: ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <span style={{ width: 40, height: 40, flexShrink: 0, borderRadius: 999, display: "inline-flex", alignItems: "center", justifyContent: "center", background: "var(--teal-050)", color: "var(--teal-700)" }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.4, color: "var(--ink-700)" }}>{children}</span>
    </div>
  );
}

function Consent({ checked, onClick, children }: { checked: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "flex-start", gap: 14,
      padding: "16px 18px", cursor: "pointer", textAlign: "left",
      borderRadius: "var(--radius-lg)",
      background: checked ? "var(--teal-050)" : "var(--surface-card)",
      border: checked ? "2px solid var(--teal-500)" : "1.5px solid var(--line-200)",
    }}>
      <span style={{
        width: 26, height: 26, flexShrink: 0, marginTop: 1, borderRadius: 8,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: checked ? "var(--teal-500)" : "transparent",
        border: checked ? "2px solid var(--teal-500)" : "2px solid var(--ink-300)",
      }}>
        {checked && <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>}
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--teal-700)" }}>Obbligatoria</span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 500, lineHeight: 1.4, color: "var(--ink-900)" }}>{children}</span>
      </span>
    </button>
  );
}
