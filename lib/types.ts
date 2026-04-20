export type VoteRow = {
  eleccion_id: number;
  tipo_cargo: string;
  partido: string;
  bloque?: string | null;
  votos?: number | null;
  votos_total?: number | null;
  votos_nacional?: number | null;
  votos_exterior?: number | null;
  votos_penitenciario?: number | null;
  votos_emitidos?: number | null;
  votos_validos?: number | null;
  votos_nulos?: number | null;
  provincia_id?: string | null;
  provincia_nombre?: string | null;
  region?: string | null;
  municipio_id?: string | null;
  municipio_nombre?: string | null;
  circ_codigo?: number | null;
  circ_numero?: number | null;
};

export type PollRow = {
  id: number;
  fecha: string;
  firma: string;
  tipo: string;
  cobertura: string;
  provincia_id: string | null;
  n_muestra: number | null;
  calidad: string | null;
  prm_pct: number | null;
  fp_pct: number | null;
  pld_pct: number | null;
  prd_pct: number | null;
  pcr_pct: number | null;
  indecisos_pct: number | null;
  activa: boolean;
  nota?: string | null;
  created_at?: string;
};

export type ElectionRow = {
  id: number;
  anio: number;
  fecha: string;
  tipo: string;
  descripcion: string;
  activa: boolean;
};

export type PadronRow = {
  id: number;
  eleccion_id: number;
  nivel: string;
  provincia_id: string | null;
  circ_id: number | null;
  inscritos: number;
  votos_emitidos: number | null;
  participacion_pct: number | null;
  fuente: string | null;
};

export type ProvinceIntelRow = {
  provincia_id: string;
  provincia_nombre: string;
  fp_votos: number;
  prm_votos: number;
  pld_votos: number;
  votos_validos: number;
  votos_emitidos: number;
  fp_pct: number;
  prm_pct: number;
  pld_pct: number;
  brecha_pp: number;
  fp_alianza_35: number;
  fp_alianza_50: number;
  fp_alianza_60: number;
  brecha_alianza_35: number;
  brecha_alianza_60: number;
  valor_alianza_pld_pp: number;
  pld_pct_2020: number;
  fp_pct_2020: number;
  lealtad_pld: number;
  pld_remanente: number;
  swing_fp: number;
  alianza_pld_decisiva: boolean;
  alianza_60_decisiva: boolean;
  clasificacion: string;
  pen: number;
  rs: number;
  score_oportunidad: number;
};

export type RiskRow = {
  provincia_id: string;
  provincia_nombre: string;
  region: string;
  fp_pct_2024: number;
  momentum_pts: number;
  bloque_ganador: string;
  pct_ganador_2024: number;
  semaforo: string;
  clasificacion_estrategica: string;
  peso_nacional_pct: number;
  volatilidad: number;
  dominancia_adversaria: number;
  tier_riesgo: string;
  recomendacion: string;
};

export type TransferRow = {
  provincia_id: string;
  provincia_nombre: string;
  fp_votos_2024: number;
  pld_votos_2024: number;
  total_2024: number;
  fp_votos_2020: number;
  pld_votos_2020: number;
  fp_pct_2024: number;
  pld_perdido_2020_24: number;
  factor_afinidad: number;
  transferencia_estimada: number;
  clasificacion: string;
};

export type NewVotersRow = {
  provincia_id: string;
  provincia_nombre: string;
  padron_2024: number;
  padron_2028_proy: number;
  nuevos_inscritos: number;
  cagr_pct_anual: number;
  nuevos_fp_estimado: number;
  nuevos_fp_conservador: number;
  fp_pct_base: number;
  clasificacion: string;
  valor_estrategico: number;
};

export type AllianceRow = {
  id: number;
  eleccion_id?: number;
  nombre?: string;
  nombre_alianza?: string;
  candidato_base: string;
  partidos?: string[];
  tasa_retencion?: number;
  nivel: string;
  estado?: string;
  notas?: string | null;
  votos_aliados_2024?: number;
  votos_transferidos_esperados?: number;
  territorio_id?: string | null;
};

export type AlliancePartyRow = {
  alianza_id: number;
  partido: string;
};

export type AlertRow = {
  id: number;
  severidad: string;
  categoria: string;
  titulo: string;
  descripcion: string | null;
  meta: string | null;
  territorio_id: string | null;
  accion_sugerida: string | null;
  fuente: string | null;
  activa: boolean;
  creada_en: string;
  vigente_hasta: string | null;
  metadata: Record<string, unknown>;
};

export type PartyShare = Record<string, number>;

export type TerritoryRecommendation = {
  id: string;
  nombre: string;
  nivel: string;
  region?: string;
  baselineShare: number;
  currentShare: number;
  projectedShare: number;
  gapToLeader: number;
  turnoutPct: number;
  padronProjected: number;
  effectiveVotes: number;
  focusVotesProjected: number;
  score: number;
  investmentPriority: number;
  opportunityType: string;
  allianceLift: number;
  transferPotential: number;
  momentum: number;
  recommendation: string;
};

export type KPI = {
  label: string;
  value: string;
  delta?: string;
  tone?: "positive" | "warning" | "negative" | "neutral";
};

export type DashboardTable = {
  title: string;
  columns: string[];
  rows: Array<Record<string, string | number>>;
};

export type DashboardChart = {
  title: string;
  series: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
};

export type DashboardPayload = {
  generatedAt: string;
  title: string;
  subtitle: string;
  kpis: KPI[];
  highlights: Array<{
    title: string;
    description: string;
    tone?: "positive" | "warning" | "negative" | "neutral";
  }>;
  tables: DashboardTable[];
  charts: DashboardChart[];
  assumptions: string[];
};

export type SimulationInput = {
  allianceId?: number;
  turnoutShiftPct?: number;
  padronGrowthPct?: number;
  candidateBoosts?: Record<string, number>;
  investmentFocus?: string[];
};
