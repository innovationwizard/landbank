"use client";

import { useEffect, useState } from "react";
import { EvaluationForm } from "@/components/EvaluationForm";
import { ResultsPanel } from "@/components/ResultsPanel";
import { useRubric } from "@/lib/rubric/context";
import { createClient } from "@/lib/supabase/client";
import { runEliminatoryChecks } from "@/lib/eliminatory";
import { evaluate, detectStrategy } from "@/lib/scoring";
import { loadUserWeights } from "@/lib/weights";
import type { EvaluationInput, EvaluationResult, WeightMap } from "@/lib/types";

export default function Home() {
  const { rubric, loading: rubricLoading, error: rubricError } = useRubric();
  const [userId, setUserId] = useState<string | null>(null);
  const [weights, setWeights] = useState<WeightMap | null>(null);
  const [result, setResult] = useState<EvaluationResult | null>(null);
  const [lastInput, setLastInput] = useState<EvaluationInput | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);

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
        console.error(e);
      }
    }
    void init();
  }, [rubric]);

  function handleEvaluate(input: EvaluationInput) {
    if (!rubric || !weights) return;
    const strategy = detectStrategy(input.location, rubric.zones);
    const eliminatory = runEliminatoryChecks(input, strategy, rubric.criteria, rubric.zones);
    const evaluation = evaluate(input, eliminatory, rubric.categories, rubric.zones, weights);
    setResult(evaluation);
    setLastInput(input);
    setSaveStatus("idle");
    setSaveError(null);
  }

  function handleReset() {
    setResult(null);
    setLastInput(null);
    setSaveStatus("idle");
    setSaveError(null);
  }

  async function handleSave(label: string | null) {
    if (!result || !lastInput || !userId || !weights) return;
    setSaveStatus("saving");
    setSaveError(null);
    const supabase = createClient();
    const { error } = await supabase.from("assessments").insert({
      user_id: userId,
      label,
      input: lastInput,
      eliminatory: result.eliminatory,
      scores: result.scores,
      final_score: result.finalScore,
      verdict: result.verdict,
      recommendation: result.recommendation,
      strategy: result.strategy,
      weights_snapshot: weights,
    });
    if (error) {
      setSaveStatus("error");
      setSaveError(error.message);
    } else {
      setSaveStatus("saved");
    }
  }

  if (rubricLoading) {
    return <p className="text-center text-forma-400 py-16">Cargando rúbrica…</p>;
  }

  if (rubricError || !rubric) {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center py-16">
        <h2 className="font-display text-xl text-red-400">Error cargando rúbrica</h2>
        <p className="text-sm text-forma-400">{rubricError}</p>
        <p className="text-xs text-forma-500">
          Verifique que las migraciones y el seed SQL se hayan ejecutado en Supabase.
        </p>
      </div>
    );
  }

  if (!weights) {
    return <p className="text-center text-forma-400 py-16">Cargando pesos del usuario…</p>;
  }

  return (
    <div className="space-y-8">
      {!result ? (
        <>
          <div className="space-y-2">
            <h2 className="font-display text-2xl text-forma-50">Evaluación rápida de terreno</h2>
            <p className="text-forma-400 text-sm leading-relaxed max-w-xl">
              Ingrese los datos básicos del terreno. La evaluación detectará automáticamente la
              estrategia aplicable y generará un puntaje por categoría.
            </p>
          </div>
          <EvaluationForm rubric={rubric} onSubmit={handleEvaluate} />
        </>
      ) : (
        <ResultsPanel
          result={result}
          onReset={handleReset}
          onSave={handleSave}
          saveStatus={saveStatus}
          saveError={saveError}
        />
      )}
    </div>
  );
}
