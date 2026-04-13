"use client";

import { useMemo, useState } from "react";
import type {
  EvaluationInput,
  Location,
  POTZone,
  Topography,
  TerrainShape,
  RoadAccess,
  LegalStatus,
  Services,
} from "@/lib/types";
import type { Rubric } from "@/lib/rubric/types";
import { findZoneForLocation } from "@/lib/rubric/fetch";

// ============================================================================
// Form primitives
// ============================================================================

function Label({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-forma-100">{children}</span>
      {hint && <span className="block text-xs text-forma-400">{hint}</span>}
    </label>
  );
}

function Input({
  value,
  onChange,
  placeholder,
  type = "number",
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  suffix?: string;
}) {
  return (
    <div className="relative">
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-forma-800 border border-forma-700 rounded-lg px-3 py-2.5 text-sm text-forma-50 placeholder:text-forma-500 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors"
      />
      {suffix && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-forma-400">
          {suffix}
        </span>
      )}
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-forma-800 border border-forma-700 rounded-lg px-3 py-2.5 text-sm text-forma-50 focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/30 transition-colors appearance-none cursor-pointer"
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

function RadioGroup({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; hint?: string }[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => {
        const selected = value === o.value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={`px-3 py-2 rounded-lg border text-sm transition-all ${
              selected
                ? "bg-accent/15 border-accent/50 text-accent-light"
                : "bg-forma-800 border-forma-700 text-forma-300 hover:border-forma-500"
            }`}
          >
            {o.label}
            {o.hint && <span className="block text-[10px] mt-0.5 opacity-70">{o.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}

function ToggleChip({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
}) {
  const states: { v: boolean | null; label: string }[] = [
    { v: true, label: "Sí" },
    { v: false, label: "No" },
    { v: null, label: "?" },
  ];
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-forma-200 min-w-[100px]">{label}</span>
      <div className="flex gap-1">
        {states.map((s) => {
          const active = value === s.v;
          return (
            <button
              key={String(s.v)}
              type="button"
              onClick={() => onChange(s.v)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-all ${
                active
                  ? s.v === true
                    ? "bg-success/20 text-green-400 border border-success/30"
                    : s.v === false
                      ? "bg-danger/20 text-red-400 border border-danger/30"
                      : "bg-forma-600/30 text-forma-300 border border-forma-500/30"
                  : "bg-forma-800 text-forma-400 border border-forma-700 hover:border-forma-500"
              }`}
            >
              {s.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <fieldset className="space-y-4">
      <legend className="text-xs font-medium text-accent tracking-widest uppercase">{title}</legend>
      <div className="space-y-4">{children}</div>
    </fieldset>
  );
}

// ============================================================================
// Main Form
// ============================================================================

interface Props {
  rubric: Rubric;
  onSubmit: (input: EvaluationInput) => void;
}

export function EvaluationForm({ rubric, onSubmit }: Props) {
  const capitalZones = useMemo(
    () =>
      rubric.zones
        .filter((z) => z.location_type === "zona_capital" && z.zona_number !== null)
        .sort((a, b) => (a.zona_number ?? 0) - (b.zona_number ?? 0)),
    [rubric.zones],
  );
  const secondaryCities = useMemo(
    () =>
      rubric.zones
        .filter((z) => z.location_type === "ciudad_secundaria" && z.ciudad_key)
        .sort((a, b) => a.sort_order - b.sort_order),
    [rubric.zones],
  );

  const [locationType, setLocationType] = useState<"zona_capital" | "ciudad_secundaria">("zona_capital");
  const [zona, setZona] = useState("");
  const [ciudad, setCiudad] = useState("");

  const [superficie, setSuperficie] = useState("");
  const [frente, setFrente] = useState("");
  const [pot, setPot] = useState<string>("");
  const [topografia, setTopografia] = useState<string>("");
  const [forma, setForma] = useState<string>("");
  const [esquinero, setEsquinero] = useState(false);

  const [agua, setAgua] = useState<boolean | null>(null);
  const [drenaje, setDrenaje] = useState<boolean | null>(null);
  const [electricidad, setElectricidad] = useState<boolean | null>(null);

  const [accesoVial, setAccesoVial] = useState<string>("");
  const [situacionLegal, setSituacionLegal] = useState<string>("");
  const [precioVara2, setPrecioVara2] = useState("");

  const [contaminacion, setContaminacion] = useState<boolean | null>(null);
  const [servidumbres, setServidumbres] = useState<boolean | null>(null);
  const [socioLocal, setSocioLocal] = useState<boolean | null>(null);

  const location: Location | null =
    locationType === "zona_capital" && zona
      ? { type: "zona_capital", zona: Number(zona) }
      : locationType === "ciudad_secundaria" && ciudad
        ? { type: "ciudad_secundaria", ciudad }
        : null;

  const detectedZone = location ? findZoneForLocation(rubric.zones, location) : null;

  const isValid =
    location !== null &&
    Number(superficie) > 0 &&
    Number(frente) > 0 &&
    pot !== "" &&
    accesoVial !== "" &&
    situacionLegal !== "" &&
    Number(precioVara2) > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!location || !isValid) return;
    const input: EvaluationInput = {
      location,
      superficie: Number(superficie),
      frente: Number(frente),
      pot: pot as POTZone,
      topografia: (topografia || "desconocido") as Topography,
      forma: (forma || "desconocido") as TerrainShape,
      servicios: { agua, drenaje, electricidad } as Services,
      acceso_vial: accesoVial as RoadAccess,
      situacion_legal: situacionLegal as LegalStatus,
      precio_vara2: Number(precioVara2),
      contaminacion,
      servidumbres,
      socio_local: socioLocal,
      esquinero,
      unidades_estimadas: null,
    };
    onSubmit(input);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <Section title="Ubicación">
        <div className="space-y-3">
          <RadioGroup
            value={locationType}
            onChange={(v) => setLocationType(v as "zona_capital" | "ciudad_secundaria")}
            options={[
              { value: "zona_capital", label: "Ciudad de Guatemala" },
              { value: "ciudad_secundaria", label: "Fuera de la capital" },
            ]}
          />

          {locationType === "zona_capital" ? (
            <Select
              value={zona}
              onChange={setZona}
              placeholder="Seleccione zona…"
              options={capitalZones.map((z) => ({
                value: String(z.zona_number),
                label: z.display_name,
              }))}
            />
          ) : (
            <Select
              value={ciudad}
              onChange={setCiudad}
              placeholder="Seleccione ciudad…"
              options={secondaryCities.map((c) => ({
                value: c.ciudad_key!,
                label: c.display_name,
              }))}
            />
          )}

          {detectedZone && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-forma-400">Estrategia detectada:</span>
              <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-medium">
                {detectedZone.strategy}
              </span>
            </div>
          )}
        </div>
      </Section>

      <Section title="Terreno">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label>Superficie</Label>
            <Input value={superficie} onChange={setSuperficie} placeholder="3500" suffix="v²" />
          </div>
          <div className="space-y-1.5">
            <Label>Frente</Label>
            <Input value={frente} onChange={setFrente} placeholder="30" suffix="m" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label hint="Consulte pot.muniguate.com por número de finca si no conoce la clasificación">
            Clasificación POT
          </Label>
          <Select
            value={pot}
            onChange={setPot}
            placeholder="Seleccione…"
            options={[
              { value: "G5", label: "G5" },
              { value: "G4", label: "G4" },
              { value: "G3", label: "G3" },
              { value: "G2", label: "G2" },
              { value: "G1", label: "G1" },
              { value: "G0", label: "G0" },
              { value: "no_aplica", label: "No aplica (fuera de capital)" },
              { value: "desconocido", label: "No sé" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Topografía</Label>
          <RadioGroup
            value={topografia}
            onChange={setTopografia}
            options={[
              { value: "plano", label: "Plano" },
              { value: "pendiente_leve", label: "Pendiente leve" },
              { value: "pendiente_fuerte", label: "Pendiente fuerte" },
              { value: "desconocido", label: "No sé" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Forma del terreno</Label>
          <RadioGroup
            value={forma}
            onChange={setForma}
            options={[
              { value: "regular", label: "Regular", hint: "Rectangular" },
              { value: "irregular", label: "Irregular" },
              { value: "desconocido", label: "No sé" },
            ]}
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="esquinero"
            checked={esquinero}
            onChange={(e) => setEsquinero(e.target.checked)}
            className="w-4 h-4 rounded border-forma-600 bg-forma-800 text-accent accent-accent"
          />
          <label htmlFor="esquinero" className="text-sm text-forma-200 cursor-pointer">
            Terreno esquinero (doble frente)
          </label>
        </div>
      </Section>

      <Section title="Servicios">
        <p className="text-xs text-forma-400 -mt-2">
          Marque si el servicio está disponible en el perímetro del terreno. Use &quot;?&quot; si no sabe.
        </p>
        <div className="space-y-2">
          <ToggleChip label="Agua" value={agua} onChange={setAgua} />
          <ToggleChip label="Drenaje" value={drenaje} onChange={setDrenaje} />
          <ToggleChip label="Electricidad" value={electricidad} onChange={setElectricidad} />
        </div>
      </Section>

      <Section title="Acceso y situación legal">
        <div className="space-y-1.5">
          <Label>Acceso vial</Label>
          <RadioGroup
            value={accesoVial}
            onChange={setAccesoVial}
            options={[
              { value: "via_primaria", label: "Vía asfaltada principal" },
              { value: "via_secundaria", label: "Vía asfaltada secundaria" },
              { value: "terraceria", label: "Terracería" },
              { value: "sin_acceso", label: "Sin acceso" },
              { value: "desconocido", label: "No sé" },
            ]}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Situación legal</Label>
          <RadioGroup
            value={situacionLegal}
            onChange={setSituacionLegal}
            options={[
              { value: "limpio_un_dueno", label: "Título limpio, un dueño" },
              { value: "limpio_varios_duenos", label: "Título limpio, varios dueños" },
              { value: "anotaciones_menores", label: "Anotaciones menores" },
              { value: "litigio", label: "En litigio / problemas" },
              { value: "desconocido", label: "No sé" },
            ]}
          />
        </div>
      </Section>

      <Section title="Precio">
        <div className="space-y-1.5">
          <Label hint="Si solo tiene precio total, divida entre la superficie en varas²">
            Precio por vara²
          </Label>
          <Input value={precioVara2} onChange={setPrecioVara2} placeholder="2000" suffix="Q/v²" />
        </div>
      </Section>

      <Section title="Banderas de riesgo">
        <div className="space-y-2">
          <ToggleChip label="Contaminación" value={contaminacion} onChange={setContaminacion} />
          <ToggleChip label="Servidumbres" value={servidumbres} onChange={setServidumbres} />
          {detectedZone?.strategy === "C" && (
            <ToggleChip label="Socio local" value={socioLocal} onChange={setSocioLocal} />
          )}
        </div>
      </Section>

      <button
        type="submit"
        disabled={!isValid}
        className={`w-full py-3 rounded-lg font-medium text-sm tracking-wide uppercase transition-all ${
          isValid
            ? "bg-accent text-forma-950 hover:bg-accent-light active:scale-[0.99]"
            : "bg-forma-700 text-forma-400 cursor-not-allowed"
        }`}
      >
        Evaluar terreno
      </button>
    </form>
  );
}
