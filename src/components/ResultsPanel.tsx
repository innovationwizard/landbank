"use client";

import { useState } from "react";
import type { EvaluationResult, CategoryScore } from "@/lib/types";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-success" : score >= 60 ? "bg-accent" : score >= 40 ? "bg-warning" : "bg-danger";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-forma-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full score-bar-fill ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="font-mono text-sm text-forma-800 w-10 text-right tabular-nums">{score}</span>
    </div>
  );
}

function CategoryRow({ category }: { category: CategoryScore }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-forma-900">{category.name}</span>
          {category.weight !== 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
              ×{category.weight}
            </span>
          )}
        </div>
      </div>
      <ScoreBar score={category.score} />
      <p className="text-xs text-forma-600 leading-relaxed">{category.reasoning}</p>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: EvaluationResult["verdict"] }) {
  const config: Record<EvaluationResult["verdict"], { label: string; bg: string; text: string }> = {
    excelente: { label: "Excelente", bg: "bg-success/15", text: "text-success" },
    bueno: { label: "Bueno", bg: "bg-accent/15", text: "text-accent-dark" },
    aceptable: { label: "Aceptable", bg: "bg-warning/15", text: "text-warning" },
    riesgoso: { label: "Riesgoso", bg: "bg-warning/15", text: "text-warning" },
    no_viable: { label: "No viable", bg: "bg-danger/15", text: "text-danger" },
  };
  const c = config[verdict];
  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

function ScoreRing({ score }: { score: number }) {
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 80 ? "#4A5D3F" : score >= 60 ? "#8B5A3C" : score >= 40 ? "#B8935A" : "#8C3A2E";
  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#E6E1D3" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r="54"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-3xl font-bold text-forma-950 tabular-nums">{score}</span>
        <span className="text-[10px] text-forma-600 tracking-wider uppercase">/ 100</span>
      </div>
    </div>
  );
}

function EliminatoryFailures({ result }: { result: EvaluationResult }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-danger/10 border border-danger/20">
          <svg className="w-8 h-8 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="font-display text-xl text-forma-950">No pasa filtro eliminatorio</h3>
        <p className="text-sm text-forma-600 max-w-md mx-auto">
          Este terreno presenta criterios eliminatorios que lo descartan automáticamente.
        </p>
      </div>

      <div className="space-y-3">
        {result.eliminatory.failures.map((f) => (
          <div
            key={f.id}
            className="bg-danger/5 border border-danger/15 rounded-lg px-4 py-3 space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-danger">#{f.id}</span>
              <span className="text-sm font-medium text-danger">{f.criterion}</span>
            </div>
            <p className="text-xs text-forma-600">{f.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

interface Props {
  result: EvaluationResult;
  onReset: () => void;
  onSave?: (label: string | null) => Promise<void> | void;
  saveStatus?: "idle" | "saving" | "saved" | "error";
  saveError?: string | null;
}

export function ResultsPanel({ result, onReset, onSave, saveStatus = "idle", saveError }: Props) {
  const passedEliminatory = result.eliminatory.passed;
  const [label, setLabel] = useState("");

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl text-forma-950">Resultado</h2>
          <p className="text-xs text-forma-600 mt-1">
            Estrategia: <span className="text-accent">{result.strategy}</span>
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg border border-forma-400 text-sm text-forma-700 hover:border-forma-600 hover:text-forma-900 transition-colors"
        >
          Nueva evaluación
        </button>
      </div>

      {!passedEliminatory ? (
        <EliminatoryFailures result={result} />
      ) : (
        <>
          <div className="bg-forma-100 border border-forma-300/50 rounded-xl p-6">
            <div className="flex items-center gap-8">
              <ScoreRing score={result.finalScore} />
              <div className="flex-1 space-y-3">
                <VerdictBadge verdict={result.verdict} />
                <p className="text-sm text-forma-800 leading-relaxed">{result.recommendation}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-xs font-medium text-accent tracking-widest uppercase">
              Desglose por categoría
            </h3>
            <div className="space-y-5">
              {result.scores.map((cat) => (
                <CategoryRow key={cat.id} category={cat} />
              ))}
            </div>
          </div>
        </>
      )}

      {onSave && (
        <div className="bg-forma-100 border border-forma-300/50 rounded-xl p-4 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-accent tracking-widest uppercase">
              Guardar en historial
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Etiqueta para identificar esta evaluación (opcional)"
              className="w-full bg-forma-200 border border-forma-300 rounded-lg px-3 py-2 text-sm text-forma-950 placeholder:text-forma-500 focus:outline-none focus:border-accent/60"
            />
          </label>
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs">
              {saveStatus === "saving" && <span className="text-forma-600">Guardando…</span>}
              {saveStatus === "saved" && <span className="text-success">Guardado en historial.</span>}
              {saveStatus === "error" && saveError && (
                <span className="text-danger">{saveError}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSave(label.trim() || null)}
              disabled={saveStatus === "saving" || saveStatus === "saved"}
              className={`px-4 py-2 rounded-lg text-xs font-medium tracking-wide uppercase transition-all ${
                saveStatus === "saving" || saveStatus === "saved"
                  ? "bg-forma-300 text-forma-600 cursor-not-allowed"
                  : "bg-accent text-forma-50 hover:bg-accent-light"
              }`}
            >
              {saveStatus === "saved" ? "Guardado" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-3 rounded-lg bg-forma-200 border border-forma-300 text-sm text-forma-700 hover:border-accent/40 hover:text-forma-900 transition-colors"
      >
        Evaluar otro terreno
      </button>
    </div>
  );
}
