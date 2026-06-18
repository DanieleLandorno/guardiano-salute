import type { ReactNode } from "react";

export function CheckGlyph({ size = 22, color = "var(--teal-700)" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke={color} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function Indicator({ multi, selected }: { multi?: boolean; selected?: boolean }) {
  if (multi) {
    return (
      <span style={{
        width: 24, height: 24, borderRadius: 7, flexShrink: 0,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        background: selected ? "var(--teal-500)" : "var(--surface-card)",
        border: selected ? "2px solid var(--teal-500)" : "2px solid var(--ink-300)",
      }}>
        {selected && <CheckGlyph size={17} color="#fff" />}
      </span>
    );
  }
  return (
    <span style={{
      width: 24, height: 24, borderRadius: 999, flexShrink: 0,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      background: "var(--surface-card)",
      border: selected ? "2px solid var(--teal-500)" : "2px solid var(--ink-300)",
    }}>
      {selected && <span style={{ width: 12, height: 12, borderRadius: 999, background: "var(--teal-500)" }} />}
    </span>
  );
}

export function OptionButton({
  children, sub, selected, onClick, compact, multi,
}: {
  children: ReactNode; sub?: ReactNode; selected?: boolean;
  onClick?: () => void; compact?: boolean; multi?: boolean;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
      gap: 12, minHeight: compact ? 54 : 66, padding: compact ? "12px 18px" : "16px 20px", cursor: "pointer",
      borderRadius: "var(--radius-lg)", textAlign: "left",
      background: selected ? "var(--teal-050)" : "var(--surface-card)",
      border: selected ? "2px solid var(--teal-500)" : "1.5px solid var(--line-200)",
      boxShadow: selected ? "none" : "var(--shadow-xs)",
      fontFamily: "var(--font-sans)",
      color: selected ? "var(--teal-900)" : "var(--ink-900)",
      transition: "background 220ms, border-color 220ms",
    }}>
      <span style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span style={{ fontSize: compact ? 17.5 : 19, fontWeight: selected ? 600 : 500 }}>{children}</span>
        {sub && <span style={{
          fontSize: 14, fontWeight: 500, lineHeight: 1.3,
          color: selected ? "var(--teal-700)" : "var(--ink-500)",
        }}>{sub}</span>}
      </span>
      <Indicator multi={multi} selected={selected} />
    </button>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label style={{
      display: "block", marginBottom: 8, fontFamily: "var(--font-sans)",
      fontSize: 16, fontWeight: 600, color: "var(--teal-900)",
    }}>{children}</label>
  );
}

export function SoftSelect({
  value, onChange, placeholder, children,
}: {
  value: string | number; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string; children: ReactNode;
}) {
  const isEmpty = value === "" || value == null;
  return (
    <div style={{ position: "relative", flex: 1 }}>
      <select value={value as any} onChange={onChange} style={{
        width: "100%", height: 56, padding: "0 40px 0 16px", cursor: "pointer",
        appearance: "none", WebkitAppearance: "none",
        border: "1.5px solid var(--line-200)", borderRadius: "var(--radius-md)",
        background: "var(--surface-card)", fontFamily: "var(--font-sans)",
        fontSize: 17, color: isEmpty ? "var(--ink-400)" : "var(--ink-900)",
      }}>
        {placeholder && <option value="" disabled hidden>{placeholder}</option>}
        {children}
      </select>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--ink-400)"
        strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
        style={{ position: "absolute", right: 14, top: 18, pointerEvents: "none" }}>
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

export function StepperField({
  label, value, unit, onDec, onInc,
}: { label: string; value: number; unit: string; onDec: () => void; onInc: () => void }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      padding: "14px 16px 14px 20px", background: "var(--surface-card)",
      border: "1.5px solid var(--line-200)", borderRadius: "var(--radius-lg)",
    }}>
      <span style={{ fontFamily: "var(--font-sans)", fontSize: 18, fontWeight: 600, color: "var(--teal-900)" }}>{label}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <StepperBtn dir={-1} onClick={onDec} />
        <div style={{ minWidth: 92, textAlign: "center" }}>
          <span style={{
            fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)",
            fontSize: 32, fontWeight: "var(--fw-display)" as any, color: "var(--teal-900)",
          }}>{value}</span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 15, fontWeight: 600, color: "var(--ink-500)", marginLeft: 5 }}>{unit}</span>
        </div>
        <StepperBtn dir={1} onClick={onInc} />
      </div>
    </div>
  );
}

function StepperBtn({ dir, onClick }: { dir: number; onClick: () => void }) {
  return (
    <button type="button" aria-label={dir < 0 ? "Diminuisci" : "Aumenta"} onClick={onClick} style={{
      width: 52, height: 52, flexShrink: 0, borderRadius: 999, cursor: "pointer",
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      border: "1.5px solid var(--teal-200)", background: "var(--teal-050)", color: "var(--teal-700)",
    }}>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2.4" strokeLinecap="round">
        <path d="M5 12h14" />{dir > 0 && <path d="M12 5v14" />}
      </svg>
    </button>
  );
}
