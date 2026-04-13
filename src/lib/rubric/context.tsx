"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchRubric } from "./fetch";
import type { Rubric } from "./types";

interface RubricState {
  rubric: Rubric | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

const Ctx = createContext<RubricState | null>(null);

export function RubricProvider({ children }: { children: ReactNode }) {
  const [rubric, setRubric] = useState<Rubric | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const supabase = createClient();
      const data = await fetchRubric(supabase);
      if (data.zones.length === 0 || data.categories.length === 0 || data.criteria.length === 0) {
        setError(
          "Rúbrica incompleta. Verifique que el seed SQL se haya ejecutado en Supabase.",
        );
        setRubric(null);
      } else {
        setRubric(data);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido cargando rúbrica");
      setRubric(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Ctx.Provider value={{ rubric, loading, error, reload: load }}>{children}</Ctx.Provider>
  );
}

export function useRubric(): RubricState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useRubric must be used inside <RubricProvider>");
  return v;
}
