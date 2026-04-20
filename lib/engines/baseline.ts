import { CARGO_PRIORITY, SYSTEM_ASSUMPTIONS } from "@/lib/config/assumptions";
import type { ElectionRow, PartyShare, VoteRow } from "@/lib/types";
import { round } from "@/lib/utils/format";

function electionYearMap(elections: ElectionRow[]) {
  return new Map(elections.map((row) => [row.id, row.anio]));
}

function groupPartyShares(rows: VoteRow[], voteField: "votos_total" | "votos" = "votos") {
  const total = rows.reduce((sum, row) => sum + Number(row[voteField] ?? 0), 0);
  if (!total) {
    return {} as PartyShare;
  }

  return rows.reduce<PartyShare>((acc, row) => {
    const value = Number(row[voteField] ?? 0);
    acc[row.partido] = round(((acc[row.partido] ?? 0) * total + value * 100) / total, 2);
    return acc;
  }, {});
}

function normalizeShares(rows: VoteRow[], voteField: "votos_total" | "votos" = "votos") {
  const totals = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.partido] = (acc[row.partido] ?? 0) + Number(row[voteField] ?? 0);
    return acc;
  }, {});
  const totalVotes = Object.values(totals).reduce((sum, value) => sum + value, 0);

  if (!totalVotes) {
    return {} as PartyShare;
  }

  return Object.fromEntries(
    Object.entries(totals).map(([party, value]) => [party, round((value / totalVotes) * 100, 2)])
  );
}

function selectRowsByCargo(rows: VoteRow[], preferred: readonly string[]) {
  for (const cargo of preferred) {
    const filtered = rows.filter((row) => row.tipo_cargo === cargo);
    if (filtered.length) {
      return filtered;
    }
  }
  return rows;
}

export function computeBaseline(
  elections: ElectionRow[],
  nationalVotes: VoteRow[],
  provinceVotes: VoteRow[],
  municipalityVotes: VoteRow[],
  circVotes: VoteRow[]
) {
  const byYear = electionYearMap(elections);

  const national2024 = selectRowsByCargo(
    nationalVotes.filter((row) => byYear.get(row.eleccion_id) === 2024),
    CARGO_PRIORITY.nacional
  );
  const national2020 = selectRowsByCargo(
    nationalVotes.filter((row) => byYear.get(row.eleccion_id) === 2020),
    CARGO_PRIORITY.nacional
  );

  const provinceGroups = groupBy(provinceVotes, (row) => row.provincia_id ?? "NA");
  const municipalityGroups = groupBy(municipalityVotes, (row) => row.municipio_id ?? "NA");
  const circGroups = groupBy(
    circVotes,
    (row) => `${row.provincia_id ?? "NA"}-${row.circ_codigo ?? row.circ_numero ?? "NA"}`
  );

  return {
    national2024: normalizeShares(national2024, "votos_total"),
    national2020: normalizeShares(national2020, "votos_total"),
    provinces: mapGroupedBaseline(provinceGroups, byYear, CARGO_PRIORITY.provincia, "votos"),
    municipalities: mapGroupedBaseline(
      municipalityGroups,
      byYear,
      CARGO_PRIORITY.municipio,
      "votos"
    ),
    circunscriptions: mapGroupedBaseline(
      circGroups,
      byYear,
      CARGO_PRIORITY.circunscripcion,
      "votos"
    ),
    assumptions: [
      `El partido foco operativo es ${SYSTEM_ASSUMPTIONS.focusParty}.`,
      "Cuando un territorio tiene varios cargos en la misma vista, se prioriza el cargo con mayor valor estrategico para ese nivel.",
      "Los resultados 2020 y 2024 funcionan solo como baseline historico; el estado actual se desplaza con polling."
    ]
  };
}

function mapGroupedBaseline(
  groups: Map<string, VoteRow[]>,
  yearMap: Map<number, number>,
  priority: readonly string[],
  voteField: "votos_total" | "votos"
) {
  return Array.from(groups.entries()).map(([key, rows]) => {
    const rows2024 = selectRowsByCargo(
      rows.filter((row) => yearMap.get(row.eleccion_id) === 2024),
      priority
    );
    const rows2020 = selectRowsByCargo(
      rows.filter((row) => yearMap.get(row.eleccion_id) === 2020),
      priority
    );

    const sample = rows2024[0] ?? rows2020[0] ?? rows[0];
    return {
      id: key,
      nombre:
        sample.provincia_nombre ??
        sample.municipio_nombre ??
        `Circ ${sample.circ_numero ?? sample.circ_codigo ?? key}`,
      region: sample.region ?? undefined,
      baseline2024: normalizeShares(rows2024, voteField),
      baseline2020: normalizeShares(rows2020, voteField),
      totalVotes2024: rows2024.reduce((sum, row) => sum + Number(row[voteField] ?? 0), 0),
      totalVotes2020: rows2020.reduce((sum, row) => sum + Number(row[voteField] ?? 0), 0)
    };
  });
}

function groupBy<T>(rows: T[], keyFn: (row: T) => string) {
  return rows.reduce((map, row) => {
    const key = keyFn(row);
    const bucket = map.get(key);
    if (bucket) {
      bucket.push(row);
    } else {
      map.set(key, [row]);
    }
    return map;
  }, new Map<string, T[]>());
}
