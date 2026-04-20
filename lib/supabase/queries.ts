import { createSupabaseReadOnlyClient } from "@/lib/supabase/client";
import type {
  AlertRow,
  AlliancePartyRow,
  AllianceRow,
  ElectionRow,
  NewVotersRow,
  PadronRow,
  PartyShare,
  PollRow,
  ProvinceIntelRow,
  RiskRow,
  TransferRow,
  VoteRow
} from "@/lib/types";

const PAGE_SIZE = 1000;

async function fetchAllRows<T>(table: string, columns = "*"): Promise<T[]> {
  const client = createSupabaseReadOnlyClient();
  const rows: T[] = [];
  let from = 0;

  while (true) {
    const { data, error } = await client
      .from(table)
      .select(columns)
      .range(from, from + PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Supabase read-only query failed for ${table}: ${error.message}`);
    }

    const chunk = (data ?? []) as T[];
    rows.push(...chunk);

    if (chunk.length < PAGE_SIZE) {
      break;
    }

    from += PAGE_SIZE;
  }

  return rows;
}

export async function fetchElectoralDataset() {
  const [
    elections,
    nationalVotes,
    provinceVotes,
    municipalityVotes,
    circVotes,
    polls,
    padron,
    provinceIntel,
    risks,
    transfers,
    alliances,
    allianceParties,
    activeAllianceScenarios,
    newVoters,
    senateView,
    diputadosCirc,
    alerts
  ] = await Promise.all([
    fetchAllRows<ElectionRow>("elecciones"),
    fetchAllRows<VoteRow>("mv_votos_nacional"),
    fetchAllRows<VoteRow>("mv_votos_provincia"),
    fetchAllRows<VoteRow>("mv_votos_municipio"),
    fetchAllRows<VoteRow>("mv_votos_circunscripcion"),
    fetchAllRows<PollRow>("encuestas"),
    fetchAllRows<PadronRow>("padron"),
    fetchAllRows<ProvinceIntelRow>("v_inteligencia_provincial"),
    fetchAllRows<RiskRow>("v_riesgo_territorial"),
    fetchAllRows<TransferRow>("v_transferencia_pld_fp"),
    fetchAllRows<AllianceRow>("alianzas"),
    fetchAllRows<AlliancePartyRow>("alianza_partidos"),
    fetchAllRows<AllianceRow>("v_alianzas_activas_2028"),
    fetchAllRows<NewVotersRow>("v_nuevos_electores_2028"),
    fetchAllRows<Record<string, unknown>>("v_senado_provincial"),
    fetchAllRows<Record<string, unknown>>("v_diputados_circ"),
    fetchAllRows<AlertRow>("alertas")
  ]);

  return {
    elections,
    nationalVotes,
    provinceVotes,
    municipalityVotes,
    circVotes,
    polls,
    padron,
    provinceIntel,
    risks,
    transfers,
    alliances,
    allianceParties,
    activeAllianceScenarios,
    newVoters,
    senateView,
    diputadosCirc,
    alerts
  };
}

export function sharesFromRows(rows: VoteRow[]): PartyShare {
  const totals: PartyShare = {};
  const totalVotes = rows.reduce((sum, row) => {
    const value = row.votos_total ?? row.votos_nacional ?? row.votos ?? 0;
    totals[row.partido] = (totals[row.partido] ?? 0) + value;
    return sum + value;
  }, 0);

  if (!totalVotes) {
    return totals;
  }

  return Object.fromEntries(
    Object.entries(totals).map(([party, votes]) => [party, (votes / totalVotes) * 100])
  );
}
