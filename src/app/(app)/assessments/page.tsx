"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AssessmentRow {
  id: string;
  label: string | null;
  strategy: string;
  final_score: number;
  verdict: string;
  recommendation: string;
  notes: string | null;
  created_at: string;
}

const VERDICT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  excelente:  { bg: "bg-success/15",  text: "text-success",  label: "Excelente" },
  bueno:      { bg: "bg-accent/15",     text: "text-accent-dark", label: "Bueno" },
  aceptable:  { bg: "bg-warning/15", text: "text-warning",  label: "Aceptable" },
  riesgoso:   { bg: "bg-warning/15", text: "text-warning",  label: "Riesgoso" },
  no_viable:  { bg: "bg-danger/15",    text: "text-danger",     label: "No viable" },
};

export default function AssessmentsPage() {
  const [rows, setRows] = useState<AssessmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("assessments")
      .select("id, label, strategy, final_score, verdict, recommendation, notes, created_at")
      .order("created_at", { ascending: false });
    if (error) setError(error.message);
    else setRows((data ?? []) as AssessmentRow[]);
    setLoading(false);
  }

  useEffect(() => {
    void load();
  }, []);

  async function saveNotes(id: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("assessments")
      .update({ notes: draftNotes || null })
      .eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setEditingId(null);
    setDraftNotes("");
    await load();
  }

  async function deleteOne(id: string) {
    if (!confirm("¿Eliminar esta evaluación? No se puede deshacer.")) return;
    const supabase = createClient();
    const { error } = await supabase.from("assessments").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    await load();
  }

  if (loading) return <p className="text-center text-forma-600 py-16">Cargando…</p>;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="font-display text-2xl text-forma-950">Historial de evaluaciones</h2>
        <p className="text-forma-600 text-sm">
          {rows.length === 0 ? "No hay evaluaciones guardadas todavía." : `${rows.length} evaluación(es) guardadas.`}
        </p>
      </div>

      {error && (
        <p className="text-xs text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="space-y-3">
        {rows.map((r) => {
          const v = VERDICT_STYLE[r.verdict] ?? VERDICT_STYLE.aceptable;
          const date = new Date(r.created_at).toLocaleString("es-GT", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          return (
            <div
              key={r.id}
              className="bg-forma-100 border border-forma-300/50 rounded-xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-forma-900 truncate">
                      {r.label ?? "Sin etiqueta"}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${v.bg} ${v.text}`}>
                      {v.label}
                    </span>
                    <span className="text-[10px] text-forma-500 uppercase tracking-wider">
                      Estrategia {r.strategy}
                    </span>
                  </div>
                  <p className="text-xs text-forma-500 tabular-nums">{date}</p>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-mono text-xl text-forma-950 tabular-nums">{r.final_score}</div>
                  <div className="text-[10px] text-forma-500 uppercase tracking-wider">/ 100</div>
                </div>
              </div>

              <p className="text-xs text-forma-700 leading-relaxed">{r.recommendation}</p>

              {editingId === r.id ? (
                <div className="space-y-2">
                  <textarea
                    value={draftNotes}
                    onChange={(e) => setDraftNotes(e.target.value)}
                    rows={3}
                    placeholder="Notas…"
                    className="w-full bg-forma-200 border border-forma-300 rounded-lg px-3 py-2 text-xs text-forma-950 focus:outline-none focus:border-accent/60"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => saveNotes(r.id)}
                      className="px-3 py-1.5 rounded-md bg-accent text-forma-50 text-[11px] font-medium uppercase tracking-wider hover:bg-accent-light"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setDraftNotes("");
                      }}
                      className="px-3 py-1.5 rounded-md border border-forma-400 text-[11px] text-forma-700 hover:border-forma-600"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {r.notes && (
                    <p className="text-xs text-forma-600 bg-forma-200/50 border border-forma-300/30 rounded px-3 py-2 leading-relaxed whitespace-pre-wrap">
                      {r.notes}
                    </p>
                  )}
                  <div className="flex gap-3 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(r.id);
                        setDraftNotes(r.notes ?? "");
                      }}
                      className="text-forma-700 hover:text-forma-900 transition-colors"
                    >
                      {r.notes ? "Editar notas" : "Agregar notas"}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteOne(r.id)}
                      className="text-danger hover:text-danger/80 transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
