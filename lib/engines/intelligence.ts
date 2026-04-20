import { computeBaseline } from "@/lib/engines/baseline";
import { computePollingState } from "@/lib/engines/polling";
import { projectTerritories } from "@/lib/engines/projection";
import {
  allocateBudget,
  applyScenario,
  assumptionNotes,
  bestAllianceLeader,
  buildAllianceBook,
  buildDashboardPayload,
  buildOptimizationNarrative,
  buildOverviewKpis,
  budgetTableRows,
  chartFromPartyShare,
  seatRecoverySummary,
  territoryTableRows
} from "@/lib/engines/strategy";
import { fetchElectoralDataset } from "@/lib/supabase/queries";
import type { DashboardPayload, SimulationInput } from "@/lib/types";
import { int, pct, round } from "@/lib/utils/format";

export async function getIntelligenceSnapshot() {
  const dataset = await fetchElectoralDataset();
  const baseline = computeBaseline(
    dataset.elections,
    dataset.nationalVotes,
    dataset.provinceVotes,
    dataset.municipalityVotes,
    dataset.circVotes
  );
  const polling = computePollingState(dataset.polls);
  const provinceTerritories = projectTerritories({
    baselines: baseline.provinces,
    blendedPoll: polling.blended,
    nationalBaseline: baseline.national2024,
    velocity: polling.velocity,
    padron: dataset.padron,
    newVoters: dataset.newVoters,
    provinceIntel: dataset.provinceIntel,
    transfers: dataset.transfers,
    level: "provincia"
  }).sort((a, b) => b.score - a.score);

  const municipalityTerritories = projectTerritories({
    baselines: baseline.municipalities,
    blendedPoll: polling.blended,
    nationalBaseline: baseline.national2024,
    velocity: polling.velocity,
    padron: dataset.padron,
    newVoters: dataset.newVoters,
    provinceIntel: dataset.provinceIntel,
    transfers: dataset.transfers,
    level: "municipio"
  }).sort((a, b) => b.score - a.score);

  const circTerritories = projectTerritories({
    baselines: baseline.circunscriptions,
    blendedPoll: polling.blended,
    nationalBaseline: baseline.national2024,
    velocity: polling.velocity,
    padron: dataset.padron,
    newVoters: dataset.newVoters,
    provinceIntel: dataset.provinceIntel,
    transfers: dataset.transfers,
    level: "circunscripcion"
  }).sort((a, b) => b.score - a.score);

  const territoryUniverse = [...provinceTerritories, ...municipalityTerritories, ...circTerritories].sort(
    (a, b) => b.score - a.score
  );

  const allianceBook = buildAllianceBook(
    dataset.activeAllianceScenarios.length ? dataset.activeAllianceScenarios : dataset.alliances,
    dataset.allianceParties,
    polling.blended
  ).sort((a, b) => b.strategicValue - a.strategicValue);

  const budget = allocateBudget(territoryUniverse);
  const leader = bestAllianceLeader(polling.blended);
  const seats = seatRecoverySummary(territoryUniverse, dataset.senateView, dataset.diputadosCirc);

  return {
    dataset,
    baseline,
    polling,
    provinceTerritories,
    municipalityTerritories,
    circTerritories,
    territoryUniverse,
    allianceBook,
    budget,
    leader,
    seats
  };
}

export async function buildOverviewDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();

  return buildDashboardPayload({
    title: "Overview",
    subtitle: "Pulso estrategico nacional derivado de encuestas ponderadas y baseline territorial 2020-2024.",
    kpis: buildOverviewKpis(snapshot.territoryUniverse, snapshot.polling.blended),
    highlights: [
      {
        title: "Lider de alianza por polling",
        description: `${snapshot.leader[0]} encabeza el polling ponderado con ${pct(snapshot.leader[1])}.`,
        tone: "warning"
      },
      {
        title: "Motor de inversion",
        description: `Las ${snapshot.budget.length} primeras asignaciones consumen el presupuesto abstracto normalizado y priorizan cierre de brecha + turnout.`,
        tone: "positive"
      },
      {
        title: "Base actual",
        description: `${snapshot.polling.usablePolls.length} encuestas nacionales activas alimentan el estado actual; la tendencia mensual FP es ${pct(snapshot.polling.velocity.FP)}.`,
        tone: snapshot.polling.velocity.FP >= 0 ? "positive" : "negative"
      }
    ],
    tables: [
      {
        title: "Top territorios ofensivos",
        columns: ["territorio", "nivel", "actual_fp", "proyectado_fp", "brecha", "inversion", "accion"],
        rows: territoryTableRows(snapshot.territoryUniverse, 12)
      },
      {
        title: "Asignacion de presupuesto abstracto",
        columns: ["territorio", "nivel", "score", "asignacion", "votos_fp"],
        rows: budgetTableRows(snapshot.budget)
      }
    ],
    charts: [
      chartFromPartyShare("Polling ponderado nacional", snapshot.polling.blended),
      chartFromPartyShare("Baseline nacional 2024", snapshot.baseline.national2024)
    ],
    assumptions: assumptionNotes(snapshot.baseline.assumptions)
  });
}

export async function buildStrategicMapDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();

  return buildDashboardPayload({
    title: "Strategic Map",
    subtitle: "Mapa por capas: provincias, municipios y circunscripciones ordenados por score estrategico.",
    kpis: [
      {
        label: "Provincias analizadas",
        value: String(snapshot.provinceTerritories.length),
        tone: "neutral"
      },
      {
        label: "Municipios analizados",
        value: String(snapshot.municipalityTerritories.length),
        tone: "neutral"
      },
      {
        label: "Circunscripciones analizadas",
        value: String(snapshot.circTerritories.length),
        tone: "neutral"
      },
      {
        label: "Alertas activas",
        value: String(snapshot.dataset.alerts.filter((row) => row.activa).length),
        tone: "warning"
      }
    ],
    highlights: [
      {
        title: "Capa provincial",
        description: "La priorizacion provincial se apoya en v_inteligencia_provincial, riesgo territorial, padron y transferencia PLD -> FP.",
        tone: "positive"
      },
      {
        title: "Capa municipal",
        description: "Los municipios se recalculan con mv_votos_municipio para detectar splits entre alcalde y presidencial.",
        tone: "warning"
      }
    ],
    tables: [
      {
        title: "Top provincias",
        columns: ["territorio", "nivel", "actual_fp", "proyectado_fp", "brecha", "inversion", "accion"],
        rows: territoryTableRows(snapshot.provinceTerritories, 10)
      },
      {
        title: "Top municipios",
        columns: ["territorio", "nivel", "actual_fp", "proyectado_fp", "brecha", "inversion", "accion"],
        rows: territoryTableRows(snapshot.municipalityTerritories, 10)
      },
      {
        title: "Top circunscripciones",
        columns: ["territorio", "nivel", "actual_fp", "proyectado_fp", "brecha", "inversion", "accion"],
        rows: territoryTableRows(snapshot.circTerritories, 10)
      }
    ],
    charts: [
      {
        title: "Top 8 scores provinciales",
        series: snapshot.provinceTerritories.slice(0, 8).map((row) => ({ label: row.nombre, value: row.score }))
      }
    ],
    assumptions: assumptionNotes([
      "El mapa se renderiza como inteligencia territorial por capas, no como geografia SVG, para no depender de shape files no presentes."
    ])
  });
}

export async function buildTerritoryDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();

  const splitRows = snapshot.municipalityTerritories.slice(0, 12).map((row) => ({
    territorio: row.nombre,
    baseline_2024: pct(row.baselineShare),
    actual: pct(row.currentShare),
    proyectado: pct(row.projectedShare),
    brecha: pct(row.gapToLeader),
    turnout: pct(row.turnoutPct),
    votes_fp: int(row.focusVotesProjected)
  }));

  return buildDashboardPayload({
    title: "Territory Analysis",
    subtitle: "Analisis por territorio con foco en split entre niveles, turnout y votos efectivos.",
    kpis: [
      {
        label: "Top score territorial",
        value: snapshot.territoryUniverse[0]?.nombre ?? "N/D",
        delta: snapshot.territoryUniverse[0] ? pct(snapshot.territoryUniverse[0].score) : undefined,
        tone: "positive"
      },
      {
        label: "Votes FP proyectados",
        value: int(snapshot.territoryUniverse.reduce((sum, row) => sum + row.focusVotesProjected, 0)),
        tone: "neutral"
      },
      {
        label: "Turnout promedio modelado",
        value: pct(
          snapshot.territoryUniverse.reduce((sum, row) => sum + row.turnoutPct, 0) /
            Math.max(1, snapshot.territoryUniverse.length)
        ),
        tone: "warning"
      },
      {
        label: "Territorios en persuasion",
        value: String(snapshot.territoryUniverse.filter((row) => row.opportunityType === "persuasion").length),
        tone: "warning"
      }
    ],
    highlights: [
      {
        title: "Split territorial",
        description: "El sistema usa las vistas mv_votos_* para comparar desempeno entre niveles y detectar territorios que votan distinto segun el cargo.",
        tone: "positive"
      }
    ],
    tables: [
      {
        title: "Lectura priorizada de territorios",
        columns: ["territorio", "baseline_2024", "actual", "proyectado", "brecha", "turnout", "votes_fp"],
        rows: splitRows
      }
    ],
    charts: [
      {
        title: "Top 10 votos FP proyectados",
        series: snapshot.territoryUniverse
          .slice(0, 10)
          .map((row) => ({ label: row.nombre, value: round(row.focusVotesProjected, 0) }))
      }
    ],
    assumptions: assumptionNotes()
  });
}

export async function buildOpportunitiesDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();
  const pickups = snapshot.territoryUniverse.filter((row) => row.opportunityType === "pickup");
  const alliances = snapshot.territoryUniverse.filter((row) => row.opportunityType === "alianza");

  return buildDashboardPayload({
    title: "Opportunities",
    subtitle: "Donde se puede ganar, recuperar o apalancar una alianza para cerrar la brecha.",
    kpis: [
      {
        label: "Pickups",
        value: String(pickups.length),
        tone: "positive"
      },
      {
        label: "Recoverable seats",
        value: String(snapshot.seats.recoverableSenate.length + snapshot.seats.recoverableDipSeats.length),
        tone: "warning"
      },
      {
        label: "Territorios de alianza",
        value: String(alliances.length),
        tone: "warning"
      },
      {
        label: "Mejor score ofensivo",
        value: snapshot.territoryUniverse[0]?.nombre ?? "N/D",
        tone: "positive"
      }
    ],
    highlights: [
      {
        title: "Recuperacion de curules",
        description: `${snapshot.seats.recoverableDipSeats.length} circunscripciones muestran una combinacion util para recuperacion o consolidacion de curules.`,
        tone: "warning"
      },
      {
        title: "Provincias para cierre",
        description: `${pickups.slice(0, 3).map((row) => row.nombre).join(", ")} encabezan la ofensiva inmediata por brecha corta.`,
        tone: "positive"
      }
    ],
    tables: [
      {
        title: "Pickups prioritarios",
        columns: ["territorio", "nivel", "actual_fp", "proyectado_fp", "brecha", "inversion", "accion"],
        rows: territoryTableRows(pickups, 10)
      },
      {
        title: "Curules recuperables",
        columns: ["territorio", "gap_pp", "score", "via"],
        rows: snapshot.seats.recoverableSenate
      }
    ],
    charts: [
      {
        title: "Top oportunidad score",
        series: snapshot.territoryUniverse.slice(0, 10).map((row) => ({ label: row.nombre, value: row.score }))
      }
    ],
    assumptions: assumptionNotes()
  });
}

export async function buildAlliancesDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();

  return buildDashboardPayload({
    title: "Alliances",
    subtitle: "Evaluacion de combinaciones, aliados potenciales y liderazgo recomendado por polling.",
    kpis: [
      {
        label: "Lider recomendado",
        value: snapshot.leader[0],
        delta: pct(snapshot.leader[1]),
        tone: "warning"
      },
      {
        label: "Escenarios evaluados",
        value: String(snapshot.allianceBook.length),
        tone: "neutral"
      },
      {
        label: "Mejor alianza",
        value: snapshot.allianceBook[0]?.nombre ?? "N/D",
        tone: "positive"
      },
      {
        label: "Transferencia esperada",
        value: int(snapshot.allianceBook[0]?.transferVotes ?? 0),
        tone: "positive"
      }
    ],
    highlights: [
      {
        title: "Lider por mejor polling",
        description: `La regla aplicada es liderar con quien hoy encabeza el polling: ${snapshot.leader[0]}.`,
        tone: "warning"
      }
    ],
    tables: [
      {
        title: "Libro de alianzas",
        columns: ["alianza", "nivel", "lider", "miembros", "retencion", "transferencia", "valor"],
        rows: snapshot.allianceBook.map((row) => ({
          id: row.id,
          alianza: row.nombre,
          nivel: row.nivel,
          lider: row.candidatoBase,
          miembros: row.miembros.join(", "),
          retencion: pct(row.retention * 100),
          transferencia: int(row.transferVotes),
          valor: round(row.strategicValue, 2)
        }))
      }
    ],
    charts: [
      {
        title: "Valor estrategico de alianzas",
        series: snapshot.allianceBook.map((row) => ({ label: row.nombre, value: row.strategicValue }))
      }
    ],
    assumptions: assumptionNotes([
      "Las alianzas activas e hipoteticas se toman de v_alianzas_activas_2028 y alianza_partidos."
    ])
  });
}

export async function buildVoteTransferDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();

  return buildDashboardPayload({
    title: "Vote Transfer",
    subtitle: "Analisis PLD -> FP por territorio y afinidad estimada.",
    kpis: [
      {
        label: "Provincias con mayor afinidad",
        value: String(snapshot.dataset.transfers.filter((row) => row.factor_afinidad >= 0.5).length),
        tone: "positive"
      },
      {
        label: "Transferencia potencial top",
        value: int(snapshot.dataset.transfers[0]?.transferencia_estimada ?? 0),
        tone: "warning"
      },
      {
        label: "Clasificaciones observadas",
        value: String(new Set(snapshot.dataset.transfers.map((row) => row.clasificacion)).size),
        tone: "neutral"
      },
      {
        label: "Base 2024 PLD",
        value: int(snapshot.dataset.transfers.reduce((sum, row) => sum + row.pld_votos_2024, 0)),
        tone: "neutral"
      }
    ],
    highlights: [
      {
        title: "Modelo base oficial",
        description: "El modulo parte de v_transferencia_pld_fp y permite ajustar tasa de retencion desde simulacion.",
        tone: "positive"
      }
    ],
    tables: [
      {
        title: "Transferencia PLD -> FP",
        columns: ["provincia", "fp_2024", "pld_2024", "perdida_pld", "afinidad", "transferencia", "clasificacion"],
        rows: snapshot.dataset.transfers.slice(0, 15).map((row) => ({
          provincia: row.provincia_nombre,
          fp_2024: int(row.fp_votos_2024),
          pld_2024: int(row.pld_votos_2024),
          perdida_pld: int(row.pld_perdido_2020_24),
          afinidad: round(row.factor_afinidad, 2),
          transferencia: int(row.transferencia_estimada),
          clasificacion: row.clasificacion
        }))
      }
    ],
    charts: [
      {
        title: "Top transferencia esperada",
        series: snapshot.dataset.transfers
          .slice(0, 10)
          .map((row) => ({ label: row.provincia_nombre, value: row.transferencia_estimada }))
      }
    ],
    assumptions: assumptionNotes()
  });
}

export async function buildTrackingDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();

  return buildDashboardPayload({
    title: "Tracking",
    subtitle: "Seguimiento de encuestas, delta temporal y velocidad.",
    kpis: [
      {
        label: "Encuestas activas",
        value: String(snapshot.polling.usablePolls.length),
        tone: "neutral"
      },
      {
        label: "Velocidad mensual FP",
        value: pct(snapshot.polling.velocity.FP),
        tone: snapshot.polling.velocity.FP >= 0 ? "positive" : "negative"
      },
      {
        label: "Velocidad mensual PRM",
        value: pct(snapshot.polling.velocity.PRM),
        tone: snapshot.polling.velocity.PRM <= 0 ? "positive" : "warning"
      },
      {
        label: "Calidad dominante",
        value: snapshot.polling.usablePolls[0]?.calidad?.trim() || "N/D",
        tone: "neutral"
      }
    ],
    highlights: [
      {
        title: "Ponderacion",
        description: "Las encuestas se ponderan por calidad, recencia y tamano de muestra cuando existe.",
        tone: "positive"
      }
    ],
    tables: [
      {
        title: "Serie de tracking",
        columns: ["fecha", "firma", "tipo", "fp", "prm", "pld"],
        rows: snapshot.polling.usablePolls
          .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
          .map((poll) => ({
            fecha: poll.fecha,
            firma: poll.firma,
            tipo: poll.tipo,
            fp: pct(poll.fp_pct ?? 0),
            prm: pct(poll.prm_pct ?? 0),
            pld: pct(poll.pld_pct ?? 0)
          }))
      }
    ],
    charts: [
      chartFromPartyShare("Polling ponderado", snapshot.polling.blended)
    ],
    assumptions: assumptionNotes()
  });
}

export async function buildSimulationDashboard(input?: SimulationInput): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();
  const scenario = applyScenario(snapshot.territoryUniverse, input ?? {}, snapshot.allianceBook);

  return buildDashboardPayload({
    title: "Simulation",
    subtitle: "Escenarios interactivos de alianzas, turnout, padron e impulso de candidatura.",
    kpis: [
      {
        label: "Escenario top",
        value: scenario[0]?.nombre ?? "N/D",
        delta: scenario[0] ? pct(scenario[0].projectedShare) : undefined,
        tone: "positive"
      },
      {
        label: "Turnout shift",
        value: `${input?.turnoutShiftPct ?? 0} pp`,
        tone: "warning"
      },
      {
        label: "Padron growth",
        value: `${input?.padronGrowthPct ?? 0}%`,
        tone: "neutral"
      },
      {
        label: "Alliance",
        value: input?.allianceId ? String(input.allianceId) : "Sin alianza",
        tone: "warning"
      }
    ],
    highlights: [
      {
        title: "Escenario recalculado",
        description: "La simulacion reaplica current_state, turnout y padron proyectado sobre todo el universo territorial.",
        tone: "positive"
      }
    ],
    tables: [
      {
        title: "Resultado del escenario",
        columns: ["territorio", "nivel", "actual_fp", "proyectado_fp", "brecha", "inversion", "accion"],
        rows: territoryTableRows(scenario, 15)
      }
    ],
    charts: [
      {
        title: "Top shares del escenario",
        series: scenario.slice(0, 10).map((row) => ({ label: row.nombre, value: row.projectedShare }))
      }
    ],
    assumptions: assumptionNotes([
      "La simulacion usa presupuesto abstracto e incrementos lineales sobre share, turnout y padron."
    ])
  });
}

export async function buildOptimizationDashboard(): Promise<DashboardPayload> {
  const snapshot = await getIntelligenceSnapshot();
  const bestAlliance = snapshot.allianceBook[0];

  return buildDashboardPayload({
    title: "Optimization",
    subtitle: "Asignacion automatica de presupuesto abstracto, combinaciones de alianza y priorizacion estrategica.",
    kpis: [
      {
        label: "Presupuesto modelado",
        value: "100",
        delta: "unidades abstractas",
        tone: "neutral"
      },
      {
        label: "Top alianza",
        value: bestAlliance?.nombre ?? "N/D",
        tone: "positive"
      },
      {
        label: "Territorio #1",
        value: snapshot.budget[0]?.nombre ?? "N/D",
        delta: snapshot.budget[0] ? `${round(snapshot.budget[0].allocation, 1)} unidades` : undefined,
        tone: "warning"
      },
      {
        label: "Senado recuperable",
        value: String(snapshot.seats.recoverableSenate.length),
        tone: "warning"
      }
    ],
    highlights: buildOptimizationNarrative(snapshot.budget, bestAlliance),
    tables: [
      {
        title: "Plan de asignacion",
        columns: ["territorio", "nivel", "score", "asignacion", "votos_fp"],
        rows: budgetTableRows(snapshot.budget)
      },
      {
        title: "Diputaciones recuperables",
        columns: ["circunscripcion", "partido", "pct", "escanos"],
        rows: snapshot.seats.recoverableDipSeats
      }
    ],
    charts: [
      {
        title: "Asignacion por territorio",
        series: snapshot.budget.map((row) => ({ label: row.nombre, value: row.allocation }))
      }
    ],
    assumptions: assumptionNotes()
  });
}
