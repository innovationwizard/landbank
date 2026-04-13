"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Map } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function AppHeader({ email }: { email: string | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function handleLogout() {
    setSigningOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  const isActive = (path: string) =>
    pathname === path ? "text-forma-900" : "text-forma-600 hover:text-forma-900";

  return (
    <header className="border-b border-forma-300/60 bg-forma-50/85 backdrop-blur-sm sticky top-0 z-40 -mx-4 px-4 mb-10">
      <div className="max-w-3xl mx-auto py-5 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <Map
            className="w-6 h-6 text-forma-800 group-hover:text-accent transition-colors"
            strokeWidth={1.5}
            aria-hidden
          />
          <div>
            <h1 className="font-display text-xl text-forma-900 leading-none tracking-tight">
              Forma
            </h1>
            <p className="text-[10px] text-forma-500 tracking-[0.22em] uppercase mt-1">
              Evaluador
            </p>
          </div>
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            href="/"
            className={`text-[11px] tracking-[0.15em] uppercase transition-colors ${isActive("/")}`}
          >
            Evaluar
          </Link>
          <Link
            href="/assessments"
            className={`text-[11px] tracking-[0.15em] uppercase transition-colors ${isActive("/assessments")}`}
          >
            Historial
          </Link>
          <Link
            href="/weights"
            className={`text-[11px] tracking-[0.15em] uppercase transition-colors ${isActive("/weights")}`}
          >
            Pesos
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="text-[11px] tracking-[0.15em] uppercase text-forma-500 hover:text-forma-800 transition-colors"
            title={email ?? undefined}
          >
            {signingOut ? "Saliendo…" : "Salir"}
          </button>
        </nav>
      </div>
    </header>
  );
}
