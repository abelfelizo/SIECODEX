import { SYSTEM_ASSUMPTIONS } from "@/lib/config/assumptions";
import type { PartyShare, PollRow } from "@/lib/types";
import { clamp, round } from "@/lib/utils/format";

const PARTY_FIELDS = {
  PRM: "prm_pct",
  FP: "fp_pct",
  PLD: "pld_pct",
  PRD: "prd_pct"
} as const;

function qualityWeight(grade: string | null) {
  const clean = (grade ?? "B").trim().charAt(0).toUpperCase() as "A" | "B" | "C";
  return SYSTEM_ASSUMPTIONS.pollingWeighting.quality[clean] ?? 0.6;
}

function recencyWeight(dateString: string) {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const days = Math.max(0, (now - then) / (1000 * 60 * 60 * 24));
  const halfLife = SYSTEM_ASSUMPTIONS.pollingWeighting.recencyHalfLifeDays;
  return Math.exp((-Math.log(2) * days) / halfLife);
}

export function computePollingState(polls: PollRow[]) {
  const usable = polls
    .filter((poll) => poll.activa && poll.cobertura === "nacional")
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  const weightedTotals: PartyShare = {};
  let totalWeight = 0;

  usable.forEach((poll) => {
    const sampleFactor = poll.n_muestra ? clamp(poll.n_muestra / 1500, 0.6, 1.4) : 0.9;
    const weight = qualityWeight(poll.calidad) * recencyWeight(poll.fecha) * sampleFactor;
    totalWeight += weight;

    for (const [party, field] of Object.entries(PARTY_FIELDS)) {
      const value = poll[field as keyof PollRow] as number | null;
      if (value !== null) {
        weightedTotals[party] = (weightedTotals[party] ?? 0) + value * weight;
      }
    }
  });

  const blended: PartyShare = {};
  for (const party of Object.keys(PARTY_FIELDS)) {
    blended[party] = totalWeight ? round((weightedTotals[party] ?? 0) / totalWeight, 2) : 0;
  }

  const sorted = usable
    .map((poll) => ({
      date: poll.fecha,
      source: poll.firma,
      type: poll.tipo,
      fp: poll.fp_pct ?? 0,
      prm: poll.prm_pct ?? 0,
      pld: poll.pld_pct ?? 0
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const velocity = computeVelocity(sorted);

  return {
    usablePolls: usable,
    blended,
    velocity
  };
}

function computeVelocity(
  series: Array<{ date: string; fp: number; prm: number; pld: number }>
) {
  if (series.length < 2) {
    return { FP: 0, PRM: 0, PLD: 0 };
  }

  const first = series[0];
  const last = series[series.length - 1];
  const days = Math.max(
    1,
    (new Date(last.date).getTime() - new Date(first.date).getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    FP: round(((last.fp - first.fp) / days) * 30, 2),
    PRM: round(((last.prm - first.prm) / days) * 30, 2),
    PLD: round(((last.pld - first.pld) / days) * 30, 2)
  };
}
