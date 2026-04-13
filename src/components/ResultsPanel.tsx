"use client";

import { useState } from "react";
import type { EvaluationResult, CategoryScore } from "@/lib/types";

function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 80 ? "bg-green-500" : score >= 60 ? "bg-accent" : score >= 40 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-forma-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full score-bar-fill ${color}`}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className="font-mono text-sm text-forma-200 w-10 text-right tabular-nums">{score}</span>
    </div>
  );
}

function CategoryRow({ category }: { category: CategoryScore }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-forma-100">{category.name}</span>
          {category.weight !== 1 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent font-medium">
              ×{category.weight}
            </span>
          )}
        </div>
      </div>
      <ScoreBar score={category.score} />
      <p className="text-xs text-forma-400 leading-relaxed">{category.reasoning}</p>
    </div>
  );
}

function VerdictBadge({ verdict }: { verdict: EvaluationResult["verdict"] }) {
  const config: Record<EvaluationResult["verdict"], { label: string; bg: string; text: string }> = {
    excelente: { label: "Excelente", bg: "bg-green-500/15", text: "text-green-400" },
    bueno: { label: "Bueno", bg: "bg-accent/15", text: "text-accent-light" },
    aceptable: { label: "Aceptable", bg: "bg-yellow-500/15", text: "text-yellow-400" },
    riesgoso: { label: "Riesgoso", bg: "bg-orange-500/15", text: "text-orange-400" },
    no_viable: { label: "No viable", bg: "bg-red-500/15", text: "text-red-400" },
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
    score >= 80 ? "#16a34a" : score >= 60 ? "#c8a456" : score >= 40 ? "#eab308" : "#dc2626";
  return (
    <div className="relative w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="54" fill="none" stroke="#1a2332" strokeWidth="8" />
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
        <span className="font-mono text-3xl font-bold text-forma-50 tabular-nums">{score}</span>
        <span className="text-[10px] text-forma-400 tracking-wider uppercase">/ 100</span>
      </div>
    </div>
  );
}

function EliminatoryFailures({ result }: { result: EvaluationResult }) {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <h3 className="font-display text-xl text-forma-50">No pasa filtro eliminatorio</h3>
        <p className="text-sm text-forma-400 max-w-md mx-auto">
          Este terreno presenta criterios eliminatorios que lo descartan automáticamente.
        </p>
      </div>

      <div className="space-y-3">
        {result.eliminatory.failures.map((f) => (
          <div
            key={f.id}
            className="bg-red-500/5 border border-red-500/15 rounded-lg px-4 py-3 space-y-1"
          >
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs text-red-400">#{f.id}</span>
              <span className="text-sm font-medium text-red-300">{f.criterion}</span>
            </div>
            <p className="text-xs text-forma-400">{f.reason}</p>
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
          <h2 className="font-display text-2xl text-forma-50">Resultado</h2>
          <p className="text-xs text-forma-400 mt-1">
            Estrategia: <span className="text-accent">{result.strategy}</span>
          </p>
        </div>
        <button
          onClick={onReset}
          className="px-4 py-2 rounded-lg border border-forma-600 text-sm text-forma-300 hover:border-forma-400 hover:text-forma-100 transition-colors"
        >
          Nueva evaluación
        </button>
      </div>

      {!passedEliminatory ? (
        <EliminatoryFailures result={result} />
      ) : (
        <>
          <div className="bg-forma-900 border border-forma-700/50 rounded-xl p-6">
            <div className="flex items-center gap-8">
              <ScoreRing score={result.finalScore} />
              <div className="flex-1 space-y-3">
                <VerdictBadge verdict={result.verdict} />
                <p className="text-sm text-forma-200 leading-relaxed">{result.recommendation}</p>
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
        <div className="bg-forma-900 border border-forma-700/50 rounded-xl p-4 space-y-3">
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-accent tracking-widest uppercase">
              Guardar en historial
            </span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Etiqueta para identificar esta evaluación (opcional)"
              className="w-full bg-forma-800 border border-forma-700 rounded-lg px-3 py-2 text-sm text-forma-50 placeholder:text-forma-500 focus:outline-none focus:border-accent/60"
            />
          </label>
          <div className="flex items-center justify-between gap-4">
            <div className="text-xs">
              {saveStatus === "saving" && <span className="text-forma-400">Guardando…</span>}
              {saveStatus === "saved" && <span className="text-success">Guardado en historial.</span>}
              {saveStatus === "error" && saveError && (
                <span className="text-red-400">{saveError}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => onSave(label.trim() || null)}
              disabled={saveStatus === "saving" || saveStatus === "saved"}
              className={`px-4 py-2 rounded-lg text-xs font-medium tracking-wide uppercase transition-all ${
                saveStatus === "saving" || saveStatus === "saved"
                  ? "bg-forma-700 text-forma-400 cursor-not-allowed"
                  : "bg-accent text-forma-950 hover:bg-accent-light"
              }`}
            >
              {saveStatus === "saved" ? "Guardado" : "Guardar"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-3 rounded-lg bg-forma-800 border border-forma-700 text-sm text-forma-300 hover:border-accent/40 hover:text-forma-100 transition-colors"
      >
        Evaluar otro terreno
      </button>
    </div>
  );
}
