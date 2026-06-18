import type { ReactNode } from "react";

const SECTION_LABELS = ["SU DI TE", "LA TUA SALUTE", "LA TUA FAMIGLIA", "STILI DI VITA", "I TUOI CONTROLLI"];

function ProgressHeader({
  section, seg5Progress, onBack,
}: { section: number; seg5Progress?: number; onBack?: () => void }) {
  return (
    <div style={{ padding: "4px 20px 0", display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button type="button" aria-label="Indietro" onClick={onBack} style={{
          width: 44, height: 44, marginLeft: -10, flexShrink: 0,
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          border: "none", background: "none", cursor: onBack ? "pointer" : "default", color: "var(--teal-900)",
          opacity: onBack ? 1 : 0.35,
        }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <div style={{ flex: 1, display: "flex", gap: 4 }}>
          {SECTION_LABELS.map((_, i) => {
            const seg = i + 1;
            const isCompleted = seg < section;
            const isCurrent = seg === section;
            if (isCurrent && seg === 5 && seg5Progress != null) {
              const pct = Math.min(1, Math.max(0, seg5Progress)) * 100;
              return (
                <div key={i} style={{ flex: 1, height: 8, borderRadius: 999, background: "#E1F5EE", overflow: "hidden" }}>
                  <div style={{ width: pct + "%", height: "100%", borderRadius: 999, background: "#1D9E75", transition: "width 320ms ease" }} />
                </div>
              );
            }
            return (
              <div key={i} style={{
                flex: 1, height: 8, borderRadius: 999,
                background: isCompleted ? "#0F6E56" : isCurrent ? "#1D9E75" : "#E1F5EE",
                transition: "background 320ms ease",
              }} />
            );
          })}
        </div>
      </div>
      <span style={{
        fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700,
        letterSpacing: "0.06em", textTransform: "uppercase", color: "#0F6E56",
      }}>{SECTION_LABELS[(section || 1) - 1]}</span>
    </div>
  );
}

export function QuestionFrame({
  section, seg5Progress, question, children, canContinue = true,
  cta = "Continua", ctaVariant = "primary", aboveTitle, onBack, onContinue,
}: {
  section: number; seg5Progress?: number;
  question: ReactNode; children: ReactNode; canContinue?: boolean;
  cta?: string; ctaVariant?: "primary" | "soft";
  aboveTitle?: ReactNode; onBack?: () => void; onContinue?: () => void;
}) {
  return (
    <>
      <ProgressHeader section={section} seg5Progress={seg5Progress} onBack={onBack} />
      <div style={{
        flex: 1, minHeight: 0, overflowY: "auto",
        padding: "26px 20px 16px", display: "flex", flexDirection: "column",
      }}>
        {aboveTitle}
        <h1 style={{
          margin: "0 0 28px", fontFamily: "var(--font-display)",
          fontOpticalSizing: "auto", fontVariationSettings: "var(--font-display-settings)",
          fontSize: 27, lineHeight: 1.24, fontWeight: "var(--fw-display)" as any,
          color: "var(--teal-900)", letterSpacing: "-0.005em", textWrap: "balance" as any,
        }}>{question}</h1>
        {children}
      </div>
      <div style={{ padding: "14px 20px 30px", borderTop: "1px solid var(--line-100)" }}>
        <button
          type="button"
          disabled={!canContinue}
          onClick={onContinue}
          className={`ci-btn ci-btn--lg ci-btn--block ${ctaVariant === "soft" ? "ci-btn--secondary" : "ci-btn--primary"}`}
        >
          {cta}
        </button>
      </div>
    </>
  );
}
