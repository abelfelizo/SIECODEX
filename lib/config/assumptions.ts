export const SYSTEM_ASSUMPTIONS = {
  focusParty: "FP",
  baselineYears: [2020, 2024],
  currentStatePolicy: "El estado actual se deriva de encuestas ponderadas por calidad y recencia; 2024 se usa solo como baseline.",
  pollingWeighting: {
    quality: {
      A: 1,
      B: 0.8,
      C: 0.65
    },
    recencyHalfLifeDays: 45
  },
  normalizedBudget: 100,
  readOnlySupabase: true,
  missingDataStrategy: "Cuando un nivel o fuente no esta expuesto directamente, el sistema usa vistas agregadas confirmadas y deja el supuesto documentado para ser reemplazado luego."
} as const;

export const CARGO_PRIORITY = {
  nacional: ["presidente", "senador"],
  provincia: ["presidente", "senador"],
  municipio: ["alcalde", "presidente"],
  circunscripcion: ["diputado_ter", "diputado_nac", "diputado_ext"]
} as const;

export const PARTY_COLORS: Record<string, string> = {
  FP: "#1f8c4d",
  PLD: "#5d1d8b",
  PRM: "#1a6ae0",
  PRD: "#ffd54d",
  BIS: "#d81b60",
  PRSC: "#ef6c00"
};
