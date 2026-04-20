import { SYSTEM_ASSUMPTIONS } from "@/lib/config/assumptions";
import type {
  NewVotersRow,
  PadronRow,
  PartyShare,
  ProvinceIntelRow,
  TerritoryRecommendation,
  TransferRow
} from "@/lib/types";
import { clamp, round } from "@/lib/utils/format";

type TerritoryBaseline = {
  id: string;
  nombre: string;
  region?: string;
  baseline2024: PartyShare;
  baseline2020: PartyShare;
  totalVotes2024: number;
  totalVotes2020: number;
};

export function projectTerritories(params: {
  baselines: TerritoryBaseline[];
  blendedPoll: PartyShare;
  nationalBaseline: PartyShare;
  velocity: PartyShare;
  padron: PadronRow[];
  newVoters: NewVotersRow[];
  provinceIntel: ProvinceIntelRow[];
  transfers: TransferRow[];
  level: "provincia" | "municipio" | "circunscripcion";
}) {
  const {
    baselines,
    blendedPoll,
    nationalBaseline,
    velocity,
    padron,
    newVoters,
    provinceIntel,
    transfers,
    level
  } = params;

  const focus = SYSTEM_ASSUMPTIONS.focusParty;
  const padronByProvince = new Map(
    padron
      .filter((row) => row.nivel === "provincial" && row.provincia_id)
      .map((row) => [row.provincia_id!, row])
  );
  const growthByProvince = new Map(newVoters.map((row) => [row.provincia_id, row]));
  const intelByProvince = new Map(provinceIntel.map((row) => [row.provincia_id, row]));
  const transferByProvince = new Map(transfers.map((row) => [row.provincia_id, row]));

  return baselines.map((territory) => {
    const provinceId = territory.id.slice(0, 2);
    const baselineShare = territory.baseline2024[focus] ?? 0;
    const baselineNational = nationalBaseline[focus] ?? baselineShare;
    const nationalPollFocus = blendedPoll[focus] ?? baselineShare;
    const pollDelta = nationalPollFocus - baselineNational;
    const intel = intelByProvince.get(provinceId);
    const transfer = transferByProvince.get(provinceId);
    const growth = growthByProvince.get(provinceId);
    const padronBase = padronByProvince.get(provinceId);

    const responsiveness = clamp(1 + ((intel?.score_oportunidad ?? 0) - 20) / 100, 0.75, 1.35);
    const currentShare = clamp(baselineShare + pollDelta * 0.65 * responsiveness, 0, 95);
    const projectedShare = clamp(currentShare + (velocity[focus] ?? 0) * 0.4, 0, 95);

    const prmCurrent = clamp(
      (territory.baseline2024.PRM ?? 0) + ((blendedPoll.PRM ?? territory.baseline2024.PRM ?? 0) - (nationalBaseline.PRM ?? territory.baseline2024.PRM ?? 0)) * 0.55,
      0,
      95
    );
    const pldCurrent = clamp(
      (territory.baseline2024.PLD ?? 0) + ((blendedPoll.PLD ?? territory.baseline2024.PLD ?? 0) - (nationalBaseline.PLD ?? territory.baseline2024.PLD ?? 0)) * 0.45,
      0,
      95
    );

    const leaderShare = Math.max(
      prmCurrent,
      pldCurrent,
      territory.baseline2024.PRD ?? 0,
      currentShare
    );

    const turnoutPct = padronBase?.participacion_pct ?? 58;
    const padronProjected = growth?.padron_2028_proy ?? padronBase?.inscritos ?? territory.totalVotes2024;
    const effectiveVotes = padronProjected * (turnoutPct / 100);
    const focusVotesProjected = effectiveVotes * (projectedShare / 100);
    const allianceLift = clamp((intel?.valor_alianza_pld_pp ?? 0) / 2, 0, 18);
    const transferPotential = transfer?.transferencia_estimada ?? 0;
    const gapToLeader = round(Math.max(0, leaderShare - currentShare), 2);
    const closeness = clamp(1 - gapToLeader / 20, 0, 1);
    const turnoutSlack = clamp((70 - turnoutPct) / 20, 0, 1);
    const growthValue = clamp((growth?.valor_estrategico ?? 20) / 50, 0, 1);
    const momentum = intel?.swing_fp ?? transfer?.factor_afinidad ?? 0;
    const score = round(
      100 * (closeness * 0.35 + turnoutSlack * 0.15 + growthValue * 0.2 + (allianceLift / 18) * 0.2 + clamp(momentum / 40, 0, 1) * 0.1),
      2
    );
    const investmentPriority = round(score + clamp(transferPotential / 2500, 0, 12), 2);

    let opportunityType = "blindado";
    if (gapToLeader <= 4) {
      opportunityType = "pickup";
    } else if (gapToLeader <= 8) {
      opportunityType = "persuasion";
    } else if (allianceLift >= 6) {
      opportunityType = "alianza";
    }

    const recommendation =
      opportunityType === "pickup"
        ? "Convertir en territorio de cierre: movilizacion, defensa de voto y voceria local."
        : opportunityType === "alianza"
          ? "Abrir negociacion y transferencia organizada con PLD/aliados."
          : opportunityType === "persuasion"
            ? "Invertir en persuadibles y turnout selectivo."
            : "Mantener presencia minima y monitoreo.";

    return {
      id: territory.id,
      nombre: territory.nombre,
      nivel: level,
      region: territory.region,
      baselineShare: round(baselineShare, 2),
      currentShare: round(currentShare, 2),
      projectedShare: round(projectedShare, 2),
      gapToLeader,
      turnoutPct: round(turnoutPct, 2),
      padronProjected: round(padronProjected, 0),
      effectiveVotes: round(effectiveVotes, 0),
      focusVotesProjected: round(focusVotesProjected, 0),
      score,
      investmentPriority,
      opportunityType,
      allianceLift: round(allianceLift, 2),
      transferPotential,
      momentum: round(momentum, 2),
      recommendation
    } satisfies TerritoryRecommendation;
  });
}
