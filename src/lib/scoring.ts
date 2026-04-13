// ============================================================================
// Scoring interpreter — pure logic keyed by scorer_key from the DB.
// All category names, descriptors, and weights come from Supabase
// (rubric_categories + user_weights). This file contains only the raw
// scoring functions (1/3/5) and weighted-average math.
// ============================================================================

import type {
  EvaluationInput,
  CategoryScore,
  EvaluationResult,
  Strategy,
  EliminatoryResult,
  WeightMap,
} from "./types";
import type { RubricCategory, ZoneBenchmark } from "./rubric/types";
import { findZoneForLocation } from "./rubric/fetch";

interface RawScore {
  bucket: 1 | 2 | 3 | 4 | 5;
  context: string;
}

type Scorer = (
  input: EvaluationInput,
  strategy: Strategy,
  zones: ZoneBenchmark[],
) => RawScore;

const SCORERS: Record<string, Scorer> = {
  ubicacion: (input, _s, zones) => {
    const zone = findZoneForLocation(zones, input.location);
    if (!zone) return { bucket: 2, context: "Ubicación fuera del mapa de rúbrica." };
    const bucket = zone.priority === "alta" ? 5 : zone.priority === "media" ? 3 : 2;
    return {
      bucket,
      context: `${zone.display_name} — prioridad ${zone.priority}: ${zone.description}`,
    };
  },

  pot: (input, strategy) => {
    if (strategy === "C") {
      return {
        bucket: 3,
        context: "Fuera de la capital — POT de Guatemala no aplica. Verificar zonificación municipal.",
      };
    }
    if (input.pot === "G5") return { bucket: 5, context: "G5" };
    if (input.pot === "G4") return { bucket: 3, context: "G4" };
    if (input.pot === "desconocido")
      return { bucket: 2, context: "POT desconocido — verificar en pot.muniguate.com" };
    return { bucket: 1, context: `${input.pot} — no apto para modelo de alta densidad.` };
  },

  superficie: (input, strategy) => {
    const v = input.superficie;
    const isRegular = input.forma === "regular";
    const isCorner = input.esquinero;
    if (strategy === "C") {
      if (v >= 5000 && isRegular) return { bucket: 5, context: `${v.toLocaleString()} v² regular` };
      if (v >= 3000) return { bucket: 3, context: `${v.toLocaleString()} v²` };
      return { bucket: 1, context: `${v.toLocaleString()} v² — limitada para expansión` };
    }
    if (v >= 4000 && isRegular && isCorner)
      return { bucket: 5, context: `${v.toLocaleString()} v² regular, esquina` };
    if (v >= 4000 && isRegular) return { bucket: 5, context: `${v.toLocaleString()} v² regular` };
    if (v >= 2500 && isRegular) return { bucket: 3, context: `${v.toLocaleString()} v² regular` };
    if (!isRegular) return { bucket: 2, context: `${v.toLocaleString()} v² irregular` };
    return { bucket: 1, context: `${v.toLocaleString()} v²` };
  },

  frente: (input) => {
    const f = input.frente;
    const isCorner = input.esquinero;
    if (f >= 33 || (f >= 28 && isCorner))
      return { bucket: 5, context: `${f}m${isCorner ? " + esquina" : ""}` };
    if (f >= 28) return { bucket: 3, context: `${f}m` };
    return { bucket: 1, context: `${f}m` };
  },

  precio: (input, _s, zones) => {
    const zone = findZoneForLocation(zones, input.location);
    if (!zone) return { bucket: 3, context: `Q${input.precio_vara2.toLocaleString()}/v²` };
    const { benchmark_min: lo, benchmark_max: hi } = zone;
    const p = input.precio_vara2;
    const ctx = `Q${p.toLocaleString()}/v² vs benchmark Q${lo.toLocaleString()}-Q${hi.toLocaleString()}`;
    if (p < lo) return { bucket: 5, context: ctx };
    if (p <= (lo + hi) / 2) return { bucket: 4, context: ctx };
    if (p <= hi) return { bucket: 3, context: ctx };
    if (p <= hi * 1.15) return { bucket: 2, context: ctx };
    return { bucket: 1, context: ctx };
  },

  legal: (input) => {
    switch (input.situacion_legal) {
      case "limpio_un_dueno":
        return { bucket: 5, context: "título limpio, un dueño" };
      case "limpio_varios_duenos":
        return { bucket: 3, context: "título limpio, varios dueños" };
      case "anotaciones_menores":
        return { bucket: 1, context: "anotaciones menores" };
      case "desconocido":
        return { bucket: 2, context: "situación legal no confirmada" };
      case "litigio":
        return { bucket: 1, context: "litigio" };
    }
  },

  servicios: (input) => {
    const values = [input.servicios.agua, input.servicios.drenaje, input.servicios.electricidad];
    const available = values.filter((s) => s === true).length;
    const unknown = values.filter((s) => s === null).length;
    if (available === 3) return { bucket: 5, context: "agua, drenaje y electricidad" };
    if (available === 2 && unknown <= 1)
      return { bucket: 3, context: `${available} de 3 servicios` };
    if (available === 1) return { bucket: 2, context: "solo un servicio confirmado" };
    if (unknown === 3) return { bucket: 2, context: "servicios sin verificar" };
    return { bucket: 1, context: "servicios limitados o ausentes" };
  },

  cabida: (input, strategy) => {
    if (input.unidades_estimadas !== null) {
      const u = input.unidades_estimadas;
      if (u >= 150) return { bucket: 5, context: `${u} unidades estimadas` };
      if (u >= 80) return { bucket: 3, context: `${u} unidades estimadas` };
      return { bucket: 1, context: `${u} unidades estimadas` };
    }
    if (strategy === "C")
      return { bucket: 3, context: "cabida depende de regulación municipal (Etapa 3 del funnel)" };
    const v = input.superficie;
    if (input.pot === "G5" && v >= 4000) return { bucket: 5, context: `G5 sobre ${v.toLocaleString()} v²` };
    if (input.pot === "G5" && v >= 2500) return { bucket: 3, context: `G5 sobre ${v.toLocaleString()} v²` };
    if (input.pot === "G4" && v >= 4000) return { bucket: 3, context: `G4 sobre ${v.toLocaleString()} v²` };
    if (input.pot === "G4" && v >= 2500) return { bucket: 3, context: `G4 sobre ${v.toLocaleString()} v²` };
    if (input.pot === "G4") return { bucket: 1, context: `G4 sobre ${v.toLocaleString()} v²` };
    if (input.pot === "desconocido") return { bucket: 2, context: "POT desconocido" };
    return { bucket: 1, context: `${input.pot} sobre ${v.toLocaleString()} v²` };
  },
};

function descriptorFor(category: RubricCategory, bucket: 1 | 2 | 3 | 4 | 5): string {
  if (bucket >= 5) return category.descriptor_5;
  if (bucket >= 3) return category.descriptor_3;
  return category.descriptor_1;
}

function buildReasoning(category: RubricCategory, raw: RawScore): string {
  return `${descriptorFor(category, raw.bucket)} — ${raw.context}`;
}

export function detectStrategy(
  location: EvaluationInput["location"],
  zones: ZoneBenchmark[],
): Strategy {
  const zone = findZoneForLocation(zones, location);
  if (zone) return zone.strategy;
  return location.type === "ciudad_secundaria" ? "C" : "A";
}

function normalizeToHundred(bucket: number): number {
  return Math.round((bucket / 5) * 100);
}

function weightedAverage(scores: CategoryScore[]): number {
  const total = scores.reduce((s, c) => s + c.weight, 0);
  if (total <= 0) return 0;
  const sum = scores.reduce((s, c) => s + c.score * c.weight, 0);
  return Math.round(sum / total);
}

function determineVerdict(final: number): EvaluationResult["verdict"] {
  if (final >= 85) return "excelente";
  if (final >= 70) return "bueno";
  if (final >= 56) return "aceptable";
  if (final >= 40) return "riesgoso";
  return "no_viable";
}

function buildRecommendation(
  scores: CategoryScore[],
  final: number,
  verdict: EvaluationResult["verdict"],
): string {
  if (verdict === "excelente") {
    const top = scores.reduce((a, b) => (a.score > b.score ? a : b));
    return `Oportunidad excelente (${final}/100): destaca en ${top.name.toLowerCase()} — recomendable avanzar a factibilidad.`;
  }
  if (verdict === "bueno") {
    const weak = scores.reduce((a, b) => (a.score < b.score ? a : b));
    return `Buena oportunidad (${final}/100), aunque ${weak.name.toLowerCase()} requiere atención — vale la pena profundizar.`;
  }
  if (verdict === "aceptable") {
    const w = scores.filter((s) => s.score < 60).map((s) => s.name.toLowerCase());
    return `Oportunidad aceptable (${final}/100) con riesgos en ${w.join(" y ") || "varias categorías"} — requiere análisis detallado.`;
  }
  if (verdict === "riesgoso") {
    const c = scores.filter((s) => s.score <= 40).map((s) => s.name.toLowerCase());
    return `Oportunidad riesgosa (${final}/100): ${c.join(", ") || "varias categorías"} con puntuación baja — no recomendable sin mejoras significativas.`;
  }
  return `No viable (${final}/100) — la combinación de factores no justifica inversión de tiempo adicional.`;
}

export function evaluate(
  input: EvaluationInput,
  eliminatory: EliminatoryResult,
  categories: RubricCategory[],
  zones: ZoneBenchmark[],
  weights: WeightMap,
): EvaluationResult {
  const strategy = detectStrategy(input.location, zones);

  if (!eliminatory.passed) {
    return {
      strategy,
      eliminatory,
      scores: [],
      finalScore: 0,
      verdict: "no_viable",
      recommendation: `Descartado: ${eliminatory.failures[0]?.reason ?? "criterio eliminatorio"}.`,
    };
  }

  const scores: CategoryScore[] = [...categories]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((cat) => {
      const scorer = SCORERS[cat.scorer_key];
      const raw: RawScore = scorer
        ? scorer(input, strategy, zones)
        : { bucket: 3, context: "sin evaluador asociado" };
      return {
        id: cat.id,
        name: cat.name,
        score: normalizeToHundred(raw.bucket),
        weight: weights[cat.id] ?? cat.default_weight,
        reasoning: buildReasoning(cat, raw),
      };
    });

  const finalScore = weightedAverage(scores);
  const verdict = determineVerdict(finalScore);
  const recommendation = buildRecommendation(scores, finalScore, verdict);

  return { strategy, eliminatory, scores, finalScore, verdict, recommendation };
}
