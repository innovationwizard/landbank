// ============================================================================
// Eliminatory predicates — pure logic keyed by predicate_key from the DB.
// All thresholds, justifications, and criterion names come from Supabase
// (eliminatory_criteria table). This file contains only the SHAPE of each
// check; no manual data is hardcoded.
// ============================================================================

import type {
  EvaluationInput,
  EliminatoryResult,
  EliminatoryFailure,
  Strategy,
} from "./types";
import type { EliminatoryCriterion, ZoneBenchmark } from "./rubric/types";
import { findZoneForLocation } from "./rubric/fetch";

type Predicate = (
  input: EvaluationInput,
  strategy: Strategy,
  threshold: Record<string, unknown>,
  zones: ZoneBenchmark[],
) => string | null; // null = pass; string = failure reason

function num(threshold: Record<string, unknown>, key: string): number | null {
  const v = threshold[key];
  return typeof v === "number" ? v : null;
}

function strArr(threshold: Record<string, unknown>, key: string): string[] {
  const v = threshold[key];
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

const PREDICATES: Record<string, Predicate> = {
  min_superficie: (input, _s, threshold) => {
    const min = num(threshold, "min");
    if (min === null) return null;
    if (input.superficie < min) {
      return `${input.superficie.toLocaleString()} v² está por debajo del mínimo de ${min.toLocaleString()} v².`;
    }
    return null;
  },

  pot_low_density: (input, strategy, threshold) => {
    if (strategy === "C") return null;
    const blocked = strArr(threshold, "blocked");
    if (blocked.includes(input.pot)) {
      return `Clasificación ${input.pot} — densidad insuficiente.`;
    }
    return null;
  },

  min_frente: (input, _s, threshold) => {
    const min = num(threshold, "min");
    if (min === null) return null;
    if (input.frente < min) {
      return `${input.frente}m de frente está por debajo del mínimo de ${min}m.`;
    }
    return null;
  },

  road_access: (input, _s, threshold) => {
    const blocked = strArr(threshold, "blocked");
    if (blocked.includes(input.acceso_vial)) {
      return `Acceso vial tipo '${input.acceso_vial}' no califica.`;
    }
    return null;
  },

  legal_status: (input, _s, threshold) => {
    const blocked = strArr(threshold, "blocked");
    if (blocked.includes(input.situacion_legal)) {
      return `Situación legal '${input.situacion_legal}' — riesgo inaceptable.`;
    }
    return null;
  },

  pot_natural: (input, strategy, threshold) => {
    if (strategy === "C") return null;
    const blocked = strArr(threshold, "blocked");
    if (blocked.includes(input.pot)) {
      return `Zona ${input.pot} — no edificable por regulación.`;
    }
    return null;
  },

  water_required: (input) => {
    if (input.servicios.agua === false) {
      return "Sin factibilidad de agua. Servicio crítico — elimina viabilidad.";
    }
    return null;
  },

  price_ceiling: (input, strategy, threshold, zones) => {
    const multiplier = num(threshold, "multiplier") ?? 1.25;
    let limit: number | null = null;
    if (strategy === "A") limit = num(threshold, "A");
    else if (strategy === "B") limit = num(threshold, "B");
    else {
      const zone = findZoneForLocation(zones, input.location);
      limit = zone ? zone.benchmark_max : null;
    }
    if (limit !== null && input.precio_vara2 > limit * multiplier) {
      return `Q${input.precio_vara2.toLocaleString()}/v² excede el techo aplicable (~Q${limit.toLocaleString()}/v²).`;
    }
    return null;
  },

  contamination: (input) => {
    if (input.contaminacion === true) {
      return "Contaminación ambiental conocida.";
    }
    return null;
  },

  easements: (input) => {
    if (input.servidumbres === true) {
      return "Servidumbres o líneas de alta tensión reducen el área efectiva de forma significativa.";
    }
    return null;
  },

  local_partner: (input, strategy) => {
    if (strategy !== "C") return null;
    if (input.socio_local === false) {
      return "Estrategia C requiere aliado local identificado.";
    }
    return null;
  },
};

export function runEliminatoryChecks(
  input: EvaluationInput,
  strategy: Strategy,
  criteria: EliminatoryCriterion[],
  zones: ZoneBenchmark[],
): EliminatoryResult {
  const failures: EliminatoryFailure[] = [];

  for (const criterion of [...criteria].sort((a, b) => a.sort_order - b.sort_order)) {
    if (criterion.strategy_scope && criterion.strategy_scope !== strategy) continue;
    const predicate = PREDICATES[criterion.predicate_key];
    if (!predicate) continue;
    const reason = predicate(input, strategy, criterion.threshold, zones);
    if (reason) {
      failures.push({
        id: criterion.id,
        criterion: criterion.name,
        reason: `${reason} ${criterion.justification}`.trim(),
      });
    }
  }

  return { passed: failures.length === 0, failures };
}
