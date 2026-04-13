"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "reset";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/";
  const urlError = params.get("error");

  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
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

  async function handleReset(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    if (!email) {
      setError("Ingrese su correo.");
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setInfo("Si su correo existe, recibirá un enlace para restablecer la contraseña.");
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 pt-12">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-forma-950">
          {mode === "signin" ? "Ingreso" : "Restablecer contraseña"}
        </h2>
        <p className="text-forma-600 text-sm">
          {mode === "signin"
            ? "Acceso por invitación. Contacte al administrador."
            : "Enviaremos un enlace al correo de su cuenta."}
        </p>
      </div>

      <form onSubmit={mode === "signin" ? handleSignIn : handleReset} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-forma-900">Correo</span>
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-forma-200 border border-forma-300 rounded-lg px-3 py-2.5 text-sm text-forma-950 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          />
        </label>

        {mode === "signin" && (
          <label className="block space-y-1.5">
            <span className="text-sm font-medium text-forma-900">Contraseña</span>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-forma-200 border border-forma-300 rounded-lg px-3 py-2.5 text-sm text-forma-950 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
            />
          </label>
        )}

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {info && (
          <p className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !email || (mode === "signin" && !password)}
          className={`w-full py-3 rounded-lg text-sm font-medium tracking-wide uppercase transition-all ${
            loading || !email || (mode === "signin" && !password)
              ? "bg-forma-300 text-forma-600 cursor-not-allowed"
              : "bg-accent text-forma-50 hover:bg-accent-light active:scale-[0.99]"
          }`}
        >
          {loading
            ? mode === "signin"
              ? "Ingresando…"
              : "Enviando…"
            : mode === "signin"
              ? "Ingresar"
              : "Enviar enlace"}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setMode(mode === "signin" ? "reset" : "signin");
              setError(null);
              setInfo(null);
            }}
            className="text-[11px] text-forma-500 hover:text-forma-800 tracking-wider uppercase transition-colors"
          >
            {mode === "signin" ? "¿Olvidó su contraseña?" : "← Volver a ingreso"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center text-forma-600 pt-12">Cargando…</div>}>
      <LoginForm />
    </Suspense>
  );
}
