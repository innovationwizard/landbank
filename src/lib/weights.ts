// ============================================================================
// Per-user scorecard weights — persisted in Supabase (user_weights table).
// Defaults come from rubric_categories.default_weight, also in the DB.
// Nothing manual-derived lives here.
// ============================================================================

import type { SupabaseClient } from "@supabase/supabase-js";
import type { RubricCategory } from "./rubric/types";
import type { WeightMap } from "./types";

export function defaultWeightsFromCategories(categories: RubricCategory[]): WeightMap {
  return Object.fromEntries(categories.map((c) => [c.id, c.default_weight]));
}

export async function loadUserWeights(
  supabase: SupabaseClient,
  userId: string,
  categories: RubricCategory[],
): Promise<WeightMap> {
  const defaults = defaultWeightsFromCategories(categories);
  const { data, error } = await supabase
    .from("user_weights")
    .select("category_id, weight")
    .eq("user_id", userId);

  if (error) throw new Error(`user_weights: ${error.message}`);

  const merged: WeightMap = { ...defaults };
  for (const row of data ?? []) {
    const cid = (row as { category_id: number; weight: number }).category_id;
    const w = (row as { category_id: number; weight: number }).weight;
    if (typeof cid === "number" && typeof w === "number") merged[cid] = w;
  }
  return merged;
}

export async function saveUserWeights(
  supabase: SupabaseClient,
  userId: string,
  weights: WeightMap,
): Promise<void> {
  const rows = Object.entries(weights).map(([category_id, weight]) => ({
    user_id: userId,
    category_id: Number(category_id),
    weight,
  }));
  const { error } = await supabase
    .from("user_weights")
    .upsert(rows, { onConflict: "user_id,category_id" });
  if (error) throw new Error(`user_weights upsert: ${error.message}`);
}

export async function resetUserWeights(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const { error } = await supabase.from("user_weights").delete().eq("user_id", userId);
  if (error) throw new Error(`user_weights delete: ${error.message}`);
}
