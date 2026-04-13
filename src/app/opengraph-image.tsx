import { ImageResponse } from "next/og";

// ============================================================================
// WhatsApp-compliant OG image.
//
// Hard constraints (researched April 2026):
//   - WhatsApp silently drops previews > ~300 KB. No error, no HTTP code.
//   - 1200 × 630 @ 1.91:1 required for large preview card.
//   - HTTPS + absolute URL (handled via metadataBase in layout.tsx).
//   - PNG acceptable; Satori (next/og) outputs PNG by default.
//
// Design: flat alabaster background, centered lucide `Map` icon, minimal
// typography. No custom fonts (Satori has no system font access at edge
// runtime; specifying fontFamily:"serif" silently falls back). Simpler
// layout = smaller PNG = reliable delivery.
// ============================================================================

export const runtime = "edge";
export const alt = "Forma — Evaluador de Terrenos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OG() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#FAF8F3",
        }}
      >
        <svg
          width="160"
          height="160"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1C1B18"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
          <path d="M15 5.764v15" />
          <path d="M9 3.236v15" />
        </svg>
        <div
          style={{
            marginTop: 56,
            fontSize: 92,
            color: "#12110F",
            letterSpacing: -1,
            lineHeight: 1,
          }}
        >
          Forma
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 26,
            color: "#6A6558",
            letterSpacing: 6,
            textTransform: "uppercase",
          }}
        >
          Evaluador de Terrenos
        </div>
      </div>
    ),
    { ...size },
  );
}
