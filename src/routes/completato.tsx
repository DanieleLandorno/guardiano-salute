import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider, useProfile } from "@/lib/checkit/store";
import { computePlan, type UserProfile } from "@/lib/checkit/rules";

export const Route = createFileRoute("/completato")({
  head: () => ({ meta: [{ title: "CheckIt — Tutto fatto" }] }),
  component: CompletatoRoute,
});

function CompletatoRoute() {
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
  const navigate = useNavigate();
  const ready = !!profile.sesso && !!profile.eta;
  const plan = ready ? computePlan(profile as UserProfile) : [];
  const count = plan.length;

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        background: "var(--teal-900, #04342C)",
        margin: "-2px -0px 0",
        display: "flex",
        flexDirection: "column",
        color: "#fff",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 28px", textAlign: "center" }}>
        {/* Check icon with concentric rings */}
        <div style={{ position: "relative", width: 220, height: 220, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 28 }}>
          <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: "rgba(255,255,255,0.04)" }} />
          <div style={{ position: "absolute", inset: 28, borderRadius: "50%", background: "rgba(255,255,255,0.06)" }} />
          <div style={{ position: "relative", width: 120, height: 120, borderRadius: "50%", background: "#4FA47A", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 14px 30px rgba(0,0,0,0.25)" }}>
            <svg width="58" height="58" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          </div>
        </div>

        <h1
          style={{
            margin: "0 0 10px",
            fontFamily: "var(--font-display)",
            fontVariationSettings: "var(--font-display-settings)",
            fontWeight: "var(--fw-display)" as any,
            fontSize: 40,
            letterSpacing: "-0.01em",
            lineHeight: 1.05,
            color: "#fff",
          }}
        >
          Tutto fatto!
        </h1>
        <p style={{ margin: "0 0 22px", fontFamily: "var(--font-sans)", fontSize: 16, lineHeight: 1.45, color: "rgba(255,255,255,0.78)", maxWidth: 280 }}>
          Il tuo piano di prevenzione è pronto.
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "12px 18px 12px 12px",
            borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.10)",
            maxWidth: 320,
          }}
        >
          <span style={{ flexShrink: 0, width: 38, height: 38, borderRadius: "50%", background: "#4FA47A", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 14.5, lineHeight: 1.4, color: "rgba(255,255,255,0.92)", textAlign: "left" }}>
            Abbiamo individuato <strong style={{ color: "#fff" }}>{count} screening</strong> consigliati per te.
          </span>
        </div>
      </div>

      <div style={{ flexShrink: 0, padding: "13px 18px 22px" }}>
        <button
          type="button"
          onClick={() => navigate({ to: "/piano" })}
          style={{
            width: "100%",
            padding: "16px 22px",
            borderRadius: 999,
            background: "#fff",
            color: "var(--teal-900, #04342C)",
            fontFamily: "var(--font-sans)",
            fontSize: 17,
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
          }}
        >
          Vedi il mio piano
        </button>
      </div>
    </div>
  );
}
