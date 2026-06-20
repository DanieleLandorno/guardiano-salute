import type { ReactNode } from "react";

export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--surface-sunken, #F5F5F2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          width: 390,
          maxWidth: "100%",
          height: 844,
          background: "var(--surface-page)",
          borderRadius: 44,
          overflow: "hidden",
          boxShadow: "0 30px 70px rgba(4,52,44,0.18)",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 24px 2px",
            fontSize: 15,
            fontWeight: 600,
            color: "var(--teal-900)",
            flexShrink: 0,
          }}
        >
          <span>9:41</span>
          <span>●●● ▮</span>
        </div>
        {children}
      </div>
    </div>
  );
}
