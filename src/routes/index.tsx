import { createFileRoute, Link } from "@tanstack/react-router";
import { PhoneFrame } from "@/components/checkit/PhoneFrame";
import { ProfileProvider } from "@/lib/checkit/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CheckIt — La tua prevenzione, organizzata" },
      { name: "description", content: "CheckIt ti dice quali screening fare, quando farli e ti aiuta a non dimenticarli." },
    ],
  }),
  component: WelcomeRoute,
});

function WelcomeRoute() {
  return (
    <ProfileProvider>
      <PhoneFrame>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "0 28px 40px", minHeight: 0 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 22, textAlign: "center" }}>
            <Logo />
            <p style={{
              margin: 0, maxWidth: 280,
              fontFamily: "var(--font-display)", fontVariationSettings: "var(--font-display-settings)",
              fontSize: 26, lineHeight: 1.28, fontWeight: "var(--fw-display)" as any,
              color: "var(--teal-900)", letterSpacing: "-0.005em", textWrap: "balance" as any,
            }}>
              La tua prevenzione,{" "}
              <em style={{ fontStyle: "italic", fontWeight: "var(--fw-display)" as any, color: "var(--teal-500)" }}>organizzata</em>.
            </p>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>
            <Link to="/privacy" className="ci-btn ci-btn--primary ci-btn--lg ci-btn--block" style={{ textAlign: "center" }}>
              Inizia
            </Link>
            <button type="button" style={{
              border: "none", background: "none", cursor: "pointer",
              fontFamily: "var(--font-sans)", fontSize: 16, fontWeight: 600,
              color: "var(--teal-700)", padding: "6px 8px",
            }}>Ho già un account</button>
          </div>
        </div>
      </PhoneFrame>
    </ProfileProvider>
  );
}

function Logo() {
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <span style={{
        width: 46, height: 46, borderRadius: 14,
        background: "var(--teal-700)", color: "#fff",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontFamily: "var(--font-display)", fontWeight: "var(--fw-display)" as any, fontSize: 26,
      }}>C</span>
      <span style={{ fontFamily: "var(--font-display)", fontWeight: "var(--fw-display)" as any, fontSize: 28, color: "var(--teal-900)", letterSpacing: "-0.01em" }}>CheckIt</span>
    </div>
  );
}
