import type { SupabaseClient } from "@supabase/supabase-js";
import type { Rubric, ZoneBenchmark, EliminatoryCriterion, RubricCategory } from "./types";

export async function fetchRubric(supabase: SupabaseClient): Promise<Rubric> {
  const [zonesRes, criteriaRes, categoriesRes] = await Promise.all([
    supabase.from("zone_benchmarks").select("*").order("sort_order"),
    supabase.from("eliminatory_criteria").select("*").order("sort_order"),
    supabase.from("rubric_categories").select("*").order("sort_order"),
  ]);

  if (zonesRes.error) throw new Error(`zone_benchmarks: ${zonesRes.error.message}`);
  if (criteriaRes.error) throw new Error(`eliminatory_criteria: ${criteriaRes.error.message}`);
  if (categoriesRes.error) throw new Error(`rubric_categories: ${categoriesRes.error.message}`);

  return {
    zones: (zonesRes.data ?? []) as ZoneBenchmark[],
    criteria: (criteriaRes.data ?? []) as EliminatoryCriterion[],
    categories: (categoriesRes.data ?? []) as RubricCategory[],
  };
}

export function findZoneForLocation(
  zones: ZoneBenchmark[],
  location:
    | { type: "zona_capital"; zona: number }
    | { type: "ciudad_secundaria"; ciudad: string },
): ZoneBenchmark | null {
  if (location.type === "zona_capital") {
    return zones.find((z) => z.location_type === "zona_capital" && z.zona_number === location.zona) ?? null;
  }
  return (
    zones.find((z) => z.location_type === "ciudad_secundaria" && z.ciudad_key === location.ciudad) ?? null
  );
}
