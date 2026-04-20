import { SYSTEM_ASSUMPTIONS } from "@/lib/config/assumptions";
import type {
  AlliancePartyRow,
  AllianceRow,
  DashboardPayload,
  DashboardTable,
  KPI,
  PartyShare,
  SimulationInput,
  TerritoryRecommendation
} from "@/lib/types";
import { compact, int, pct, round } from "@/lib/utils/format";

export function allocateBudget(
  territories: TerritoryRecommendation[],
  budget = SYSTEM_ASSUMPTIONS.normalizedBudget
) {
  const ranked = [...territories].sort((a, b) => b.investmentPriority - a.investmentPriority).slice(0, 12);
  const total = ranked.reduce((sum, row) => sum + row.investmentPriority, 0) || 1;

  return ranked.map((territory) => ({
    ...territory,
    allocation: round((territory.investmentPriority / total) * budget, 2)
  }));
}

export function buildAllianceBook(
  alliances: AllianceRow[],
  allianceParties: AlliancePartyRow[],
  pollState: PartyShare
) {
  const membership = allianceParties.reduce<Record<number, string[]>>((acc, row) => {
    acc[row.alianza_id] = [...(acc[row.alianza_id] ?? []), row.partido];
    return acc;
  }, {});

  return alliances.map((row) => ({
    id: row.id,
    nombre: row.nombre ?? row.nombre_alianza ?? `Alianza ${row.id}`,
    nivel: row.nivel,
    candidatoBase: row.candidato_base,
    miembros: row.partidos ?? membership[row.id] ?? [row.candidato_base],
    retention: row.tasa_retencion ?? 1,
    transferVotes: row.votos_transferidos_esperados ?? 0,
    strategicValue: round((pollState[row.candidato_base] ?? 0) + (row.votos_transferidos_esperados ?? 0) / 1000, 2),
    notes: row.notas ?? ""
  }));
}

export function bestAllianceLeader(pollState: PartyShare) {
  return Object.entries(pollState).sort((a, b) => b[1] - a[1])[0] ?? ["FP", 0];
}

export function seatRecoverySummary(
  territories: TerritoryRecommendation[],
  senateRows: Array<Record<string, unknown>>,
  diputadosRows: Array<Record<string, unknown>>
) {
  const recoverableSenate = territories
    .filter((row) => row.nivel === "provincia" && row.gapToLeader <= 8)
    .slice(0, 8)
    .map((row) => ({
      territorio: row.nombre,
      gap_pp: row.gapToLeader,
      score: row.score,
      via: row.opportunityType
    }));

  const recoverableDipSeats = diputadosRows
    .filter((row) => typeof row.partido === "string" && typeof row.pct_votos === "number")
    .filter((row) => (row.partido as string) === SYSTEM_ASSUMPTIONS.focusParty || (row.partido as string) === "PLD")
    .slice(0, 8)
    .map((row) => ({
      circunscripcion: String(row.circ_label ?? row.circ_id),
      partido: String(row.partido),
      pct: Number(row.pct_votos),
      escanos: Number(row.escanos_ganados ?? 0)
    }));

  return {
    recoverableSenate,
    recoverableDipSeats,
    senateSourceCount: senateRows.length
  };
}

export function applyScenario(
  territories: TerritoryRecommendation[],
  simulations: SimulationInput,
  alliances: ReturnType<typeof buildAllianceBook>
) {
  const alliance = simulations.allianceId
    ? alliances.find((row) => row.id === simulations.allianceId)
    : undefined;
  const turnoutShift = simulations.turnoutShiftPct ?? 0;
  const padronShift = simulations.padronGrowthPct ?? 0;
  const candidateBoost = simulations.candidateBoosts?.[SYSTEM_ASSUMPTIONS.focusParty] ?? 0;
  const focusSet = new Set(simulations.investmentFocus ?? []);

  const projected = territories.map((row) => {
    const allianceBonus = alliance?.candidatoBase === SYSTEM_ASSUMPTIONS.focusParty ? alliance.retention * 8 : 0;
    const investmentBonus = focusSet.has(row.id) ? 2.4 : 0;
    const projectedShare = round(
      Math.min(95, row.projectedShare + candidateBoost + turnoutShift * 0.1 + allianceBonus + investmentBonus),
      2
    );
    const turnoutPct = round(Math.min(85, row.turnoutPct + turnoutShift), 2);
    const padronProjected = round(row.padronProjected * (1 + padronShift / 100), 0);
    const effectiveVotes = round(padronProjected * (turnoutPct / 100), 0);
    return {
      ...row,
      projectedShare,
      turnoutPct,
      padronProjected,
      effectiveVotes,
      focusVotesProjected: round(effectiveVotes * (projectedShare / 100), 0)
    };
  });

  return projected.sort((a, b) => b.score - a.score);
}

export function buildDashboardPayload(params: {
  title: string;
  subtitle: string;
  kpis: KPI[];
  highlights: DashboardPayload["highlights"];
  tables: DashboardTable[];
  charts: DashboardPayload["charts"];
  assumptions: string[];
}): DashboardPayload {
  return {
    generatedAt: new Date().toISOString(),
    ...params
  };
}

export function territoryTableRows(territories: TerritoryRecommendation[], limit = 10) {
  return territories.slice(0, limit).map((row) => ({
    territorio: row.nombre,
    nivel: row.nivel,
    actual_fp: pct(row.currentShare),
    proyectado_fp: pct(row.projectedShare),
    brecha: pct(row.gapToLeader),
    inversion: round(row.investmentPriority, 1),
    accion: row.recommendation
  }));
}

export function buildOverviewKpis(territories: TerritoryRecommendation[], pollState: PartyShare) {
  const top = territories[0];
  const pickups = territories.filter((row) => row.opportunityType === "pickup").length;
  const alliance = territories.filter((row) => row.opportunityType === "alianza").length;

  return [
    {
      label: "Polling FP ponderado",
      value: pct(pollState.FP ?? 0),
      delta: `PRM ${pct(pollState.PRM ?? 0)}`,
      tone: "positive"
    },
    {
      label: "Pickups inmediatos",
      value: String(pickups),
      delta: "territorios a <= 4 pp",
      tone: pickups > 0 ? "warning" : "neutral"
    },
    {
      label: "Oportunidades de alianza",
      value: String(alliance),
      delta: "territorios donde la alianza puede cerrar brecha",
      tone: "warning"
    },
    {
      label: "Mejor territorio ofensivo",
      value: top ? top.nombre : "Sin datos",
      delta: top ? `${pct(top.projectedShare)} proyectado` : undefined,
      tone: "positive"
    }
  ] satisfies KPI[];
}

export function buildOptimizationNarrative(
  budget: ReturnType<typeof allocateBudget>,
  bestAlliance: ReturnType<typeof buildAllianceBook>[number] | undefined
) {
  const top3 = budget.slice(0, 3).map((row) => `${row.nombre} (${round(row.allocation, 1)})`);
  return [
    {
      title: "Distribucion sugerida",
      description: `Asignar el presupuesto abstracto normalizado en ${top3.join(", ")} para maximizar cierre de brecha y captura de turnout.`,
      tone: "positive" as const
    },
    {
      title: "Combinacion de alianza recomendada",
      description: bestAlliance
        ? `${bestAlliance.nombre} liderada por ${bestAlliance.candidatoBase}, priorizada por potencial de transferencia y polling del lider.`
        : "Sin alianza prioritaria identificada.",
      tone: "warning" as const
    }
  ];
}

export function chartFromPartyShare(title: string, share: PartyShare) {
  return {
    title,
    series: Object.entries(share)
      .sort((a, b) => b[1] - a[1])
      .map(([label, value]) => ({ label, value: round(value, 2) }))
  };
}

export function budgetTableRows(items: ReturnType<typeof allocateBudget>) {
  return items.map((row) => ({
    territorio: row.nombre,
    nivel: row.nivel,
    score: round(row.score, 1),
    asignacion: round(row.allocation, 2),
    votos_fp: compact(row.focusVotesProjected)
  }));
}

export function assumptionNotes(extra: string[] = []) {
  return [
    SYSTEM_ASSUMPTIONS.currentStatePolicy,
    "Las encuestas nacionales dominan el estado actual; las subnacionales futuras entraran cuando esten disponibles.",
    "El presupuesto se optimiza en una unidad abstracta de 100 puntos, no monetaria.",
    ...extra
  ];
}
