import type { Metadata } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const title = "Forma — Evaluador de Terrenos";
const description = "Evaluación rápida de oportunidades de terreno.";

// Explicit openGraph + twitter blocks so WhatsApp/Facebook/LinkedIn/X all get
// the required og:title, og:description, og:url, og:type tags alongside the
// og:image auto-emitted from app/opengraph-image.tsx (which Next.js wires up
// with og:image:width / og:image:height / og:image:type automatically).
export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  openGraph: {
    type: "website",
    url: siteUrl,
    locale: "es_GT",
    siteName: "Forma Evaluador",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="grain min-h-screen">
        <main className="max-w-3xl mx-auto px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
