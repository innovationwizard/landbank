"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
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
    pathname === path ? "text-forma-50" : "text-forma-300 hover:text-forma-100";

  return (
    <header className="border-b border-forma-700/50 bg-forma-900/80 backdrop-blur-sm sticky top-0 z-40 -mx-4 px-4 mb-8">
      <div className="max-w-3xl mx-auto py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
            <span className="font-display text-forma-950 text-sm font-bold">F</span>
          </div>
          <div>
            <h1 className="font-display text-lg text-forma-50 leading-none">Forma</h1>
            <p className="text-[11px] text-forma-400 tracking-widest uppercase mt-0.5">
              Evaluador
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-4">
          <Link href="/" className={`text-[11px] tracking-wider uppercase transition-colors ${isActive("/")}`}>
            Evaluar
          </Link>
          <Link
            href="/assessments"
            className={`text-[11px] tracking-wider uppercase transition-colors ${isActive("/assessments")}`}
          >
            Historial
          </Link>
          <Link
            href="/weights"
            className={`text-[11px] tracking-wider uppercase transition-colors ${isActive("/weights")}`}
          >
            Pesos
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            disabled={signingOut}
            className="text-[11px] tracking-wider uppercase text-forma-400 hover:text-forma-200 transition-colors"
            title={email ?? undefined}
          >
            {signingOut ? "Saliendo…" : "Salir"}
          </button>
        </nav>
      </div>
    </header>
  );
}
