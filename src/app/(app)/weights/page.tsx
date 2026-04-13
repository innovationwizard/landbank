"use client";

import { useEffect, useState } from "react";
import { useRubric } from "@/lib/rubric/context";
import { createClient } from "@/lib/supabase/client";
import {
  defaultWeightsFromCategories,
  loadUserWeights,
  saveUserWeights,
  resetUserWeights,
} from "@/lib/weights";
import type { WeightMap } from "@/lib/types";

const MIN = 0;
const MAX = 10;
const STEP = 0.5;

export default function WeightsPage() {
  const { rubric, loading: rubricLoading, error: rubricError } = useRubric();
  const [userId, setUserId] = useState<string | null>(null);
  const [weights, setWeights] = useState<WeightMap>({});
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      if (!rubric) return;
      const supabase = createClient();
      const { data } = await supabase.auth.getUser();
      if (!data.user) return;
      setUserId(data.user.id);
      try {
        const w = await loadUserWeights(supabase, data.user.id, rubric.categories);
        setWeights(w);
      } catch (e) {
        setStatus("error");
        setStatusMsg(e instanceof Error ? e.message : "Error cargando pesos");
      } finally {
        setLoading(false);
      }
    }
    void init();
  }, [rubric]);

  function update(id: number, value: number) {
    const clamped = Math.max(MIN, Math.min(MAX, Math.round(value / STEP) * STEP));
    setWeights((prev) => ({ ...prev, [id]: clamped }));
    setDirty(true);
    setStatus("idle");
  }

  async function handleSave() {
    if (!userId) return;
    setStatus("saving");
    setStatusMsg(null);
    try {
      await saveUserWeights(createClient(), userId, weights);
      setDirty(false);
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setStatusMsg(e instanceof Error ? e.message : "Error guardando pesos");
    }
  }

  async function handleReset() {
    if (!userId || !rubric) return;
    setStatus("saving");
    try {
      await resetUserWeights(createClient(), userId);
      const d = defaultWeightsFromCategories(rubric.categories);
      setWeights(d);
      setDirty(false);
      setStatus("saved");
    } catch (e) {
      setStatus("error");
      setStatusMsg(e instanceof Error ? e.message : "Error reiniciando pesos");
    }
  }

  if (rubricLoading || loading) {
    return <p className="text-center text-forma-600 py-16">Cargando…</p>;
  }
  if (rubricError || !rubric) {
    return <p className="text-center text-danger py-16">Error: {rubricError}</p>;
  }

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const defaults = defaultWeightsFromCategories(rubric.categories);

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="font-display text-2xl text-forma-950">Pesos del scorecard</h2>
        <p className="text-forma-600 text-sm leading-relaxed max-w-xl">
          Ajuste la influencia de cada categoría en el puntaje final ponderado. Los valores por
          defecto provienen de la rúbrica central. Los cambios se guardan en su cuenta.
        </p>
      </div>

      <div className="bg-forma-200/50 border border-forma-300/30 rounded-lg px-4 py-3">
        <p className="text-xs text-forma-600 leading-relaxed">
          Las categorías son fijas. Puede modificar cada peso o fijarlo en{" "}
          <span className="font-mono text-forma-700">0</span> para excluirla del promedio
          ponderado.
        </p>
      </div>

      <div className="space-y-4">
        {[...rubric.categories]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((cat) => {
            const value = weights[cat.id] ?? cat.default_weight;
            const changed = value !== defaults[cat.id];
            const share = totalWeight > 0 ? (value / totalWeight) * 100 : 0;
            return (
              <div
                key={cat.id}
                className="bg-forma-100 border border-forma-300/50 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-forma-500">#{cat.id}</span>
                      <span className="text-sm font-medium text-forma-900">{cat.name}</span>
                      {changed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/15 text-accent-dark font-medium">
                          modificado
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-forma-500">{cat.manual_section}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => update(cat.id, value - STEP)}
                      disabled={value <= MIN}
                      className="w-7 h-7 rounded-md border border-forma-300 text-forma-700 hover:border-forma-500 disabled:opacity-30 transition-colors"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min={MIN}
                      max={MAX}
                      step={STEP}
                      value={value}
                      onChange={(e) => update(cat.id, Number(e.target.value))}
                      className="w-16 bg-forma-200 border border-forma-300 rounded-md px-2 py-1 text-sm text-forma-950 text-center focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30"
                    />
                    <button
                      type="button"
                      onClick={() => update(cat.id, value + STEP)}
                      disabled={value >= MAX}
                      className="w-7 h-7 rounded-md border border-forma-300 text-forma-700 hover:border-forma-500 disabled:opacity-30 transition-colors"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 bg-forma-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        value === 0 ? "bg-forma-300" : "bg-accent"
                      }`}
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-forma-500 tabular-nums">
                    {value === 0 ? "Excluida del promedio" : `${share.toFixed(1)}% del peso total`}
                  </p>
                </div>
              </div>
            );
          })}
      </div>

      <div className="sticky bottom-4 bg-forma-100/95 backdrop-blur border border-forma-300/50 rounded-xl p-4 flex items-center justify-between gap-4">
        <div className="text-xs space-y-0.5">
          <p className="text-forma-600">
            Peso total:{" "}
            <span className="font-mono text-forma-900 tabular-nums">{totalWeight.toFixed(1)}</span>
          </p>
          {totalWeight === 0 && (
            <p className="text-danger">Al menos una categoría debe tener peso &gt; 0.</p>
          )}
          {status === "saved" && !dirty && <p className="text-success">Guardado.</p>}
          {dirty && <p className="text-warning">Cambios sin guardar.</p>}
          {status === "error" && statusMsg && <p className="text-danger">{statusMsg}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            disabled={status === "saving"}
            className="px-3 py-2 rounded-lg border border-forma-400 text-xs text-forma-700 hover:border-forma-600 hover:text-forma-900 transition-colors"
          >
            Restaurar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!dirty || totalWeight === 0 || status === "saving"}
            className={`px-4 py-2 rounded-lg text-xs font-medium tracking-wide uppercase transition-all ${
              dirty && totalWeight > 0 && status !== "saving"
                ? "bg-accent text-forma-50 hover:bg-accent-light"
                : "bg-forma-300 text-forma-600 cursor-not-allowed"
            }`}
          >
            {status === "saving" ? "Guardando…" : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
