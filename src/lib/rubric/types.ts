// ============================================================================
// Rubric types — shape of data fetched from Supabase public tables
// All manual-derived content lives in the DB, not in source.
// ============================================================================

export type Strategy = "A" | "B" | "C";
export type Priority = "alta" | "media" | "baja";
export type LocationType = "zona_capital" | "ciudad_secundaria";

export interface ZoneBenchmark {
  id: string;
  location_type: LocationType;
  zona_number: number | null;
  ciudad_key: string | null;
  display_name: string;
  strategy: Strategy;
  priority: Priority;
  benchmark_min: number;
  benchmark_max: number;
  description: string;
  sort_order: number;
}

export interface EliminatoryCriterion {
  id: number;
  name: string;
  justification: string;
  strategy_scope: Strategy | null;
  predicate_key: string;
  threshold: Record<string, unknown>;
  sort_order: number;
}

export interface RubricCategory {
  id: number;
  name: string;
  manual_section: string;
  scorer_key: string;
  descriptor_1: string;
  descriptor_3: string;
  descriptor_5: string;
  default_weight: number;
  sort_order: number;
}

export interface Rubric {
  zones: ZoneBenchmark[];
  criteria: EliminatoryCriterion[];
  categories: RubricCategory[];
}
