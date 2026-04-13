"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setDone(true);
    setTimeout(() => {
      router.replace("/");
      router.refresh();
    }, 1500);
  }

  return (
    <div className="max-w-sm mx-auto space-y-8 pt-12">
      <div className="space-y-2 text-center">
        <h2 className="font-display text-2xl text-forma-950">Nueva contraseña</h2>
        <p className="text-forma-600 text-sm">Define una contraseña para tu cuenta.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-forma-900">Nueva contraseña</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-forma-200 border border-forma-300 rounded-lg px-3 py-2.5 text-sm text-forma-950 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-medium text-forma-900">Confirmar</span>
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="w-full bg-forma-200 border border-forma-300 rounded-lg px-3 py-2.5 text-sm text-forma-950 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
          />
        </label>

        {error && (
          <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        {done && (
          <p className="text-xs text-success bg-success/10 border border-success/20 rounded-lg px-3 py-2">
            Contraseña actualizada. Redirigiendo…
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !password || !confirm || done}
          className={`w-full py-3 rounded-lg text-sm font-medium tracking-wide uppercase transition-all ${
            loading || !password || !confirm || done
              ? "bg-forma-300 text-forma-600 cursor-not-allowed"
              : "bg-accent text-forma-50 hover:bg-accent-light active:scale-[0.99]"
          }`}
        >
          {loading ? "Actualizando…" : "Actualizar contraseña"}
        </button>
      </form>
    </div>
  );
}
