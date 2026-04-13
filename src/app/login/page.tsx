"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (authError) {
      setError(authError.message);
      return;
    }
    router.replace(next);
    router.refresh();
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 pt-12">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-forma-50">Ingreso</h2>
        <p className="text-forma-400 text-sm">Acceso por invitación. Contacte al administrador.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-forma-100">Correo</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-forma-800 border border-forma-700 rounded-lg px-3 py-2.5 text-sm text-forma-50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-forma-100">Contraseña</span>
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-forma-800 border border-forma-700 rounded-lg px-3 py-2.5 text-sm text-forma-50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          />
        </label>

        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email || !password}
          className={`w-full py-3 rounded-lg text-sm font-medium tracking-wide uppercase transition-all ${
            loading || !email || !password
              ? "bg-forma-700 text-forma-400 cursor-not-allowed"
              : "bg-accent text-forma-950 hover:bg-accent-light active:scale-[0.99]"
          }`}
        >
          {loading ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-forma-400 pt-12">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
