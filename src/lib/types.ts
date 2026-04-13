// ============================================================================
// Domain types — input/output shapes for the land evaluator.
// No manual-derived data lives here. Labels, thresholds, and descriptors
// are fetched from Supabase at runtime (see src/lib/rubric/).
// ============================================================================

export type { Strategy } from "./rubric/types";
import type { Strategy } from "./rubric/types";

export type POTZone = "G0" | "G1" | "G2" | "G3" | "G4" | "G5" | "no_aplica" | "desconocido";
export type Topography = "plano" | "pendiente_leve" | "pendiente_fuerte" | "desconocido";
export type TerrainShape = "regular" | "irregular" | "desconocido";
export type RoadAccess = "via_primaria" | "via_secundaria" | "terraceria" | "sin_acceso" | "desconocido";
export type LegalStatus =
  | "limpio_un_dueno"
  | "limpio_varios_duenos"
  | "anotaciones_menores"
  | "litigio"
  | "desconocido";

export interface Services {
  agua: boolean | null;
  drenaje: boolean | null;
  electricidad: boolean | null;
}

export type LocationType = "zona_capital" | "ciudad_secundaria";

export interface LocationZona {
  type: "zona_capital";
  zona: number;
}
export interface LocationCiudad {
  type: "ciudad_secundaria";
  ciudad: string;
}
export type Location = LocationZona | LocationCiudad;

export interface EvaluationInput {
  location: Location;
  superficie: number;
  frente: number;
  pot: POTZone;
  topografia: Topography;
  forma: TerrainShape;
  servicios: Services;
  acceso_vial: RoadAccess;
  situacion_legal: LegalStatus;
  precio_vara2: number;
  contaminacion: boolean | null;
  servidumbres: boolean | null;
  socio_local: boolean | null;
  esquinero: boolean;
  unidades_estimadas: number | null;
}

export interface EliminatoryFailure {
  id: number;
  criterion: string;
  reason: string;
}

export interface EliminatoryResult {
  passed: boolean;
  failures: EliminatoryFailure[];
}

export interface CategoryScore {
  id: number;
  name: string;
  score: number;
  weight: number;
  reasoning: string;
}

export interface EvaluationResult {
  strategy: Strategy;
  eliminatory: EliminatoryResult;
  scores: CategoryScore[];
  finalScore: number;
  verdict: "excelente" | "bueno" | "aceptable" | "riesgoso" | "no_viable";
  recommendation: string;
}

export type WeightMap = Record<number, number>;
