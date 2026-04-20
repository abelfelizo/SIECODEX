"use client";

import { useEffect, useState } from "react";
import type { DashboardPayload } from "@/lib/types";

type AllianceOption = {
  id: number;
  name: string;
};

export function SimulationConsole() {
  const [payload, setPayload] = useState<DashboardPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [alliances, setAlliances] = useState<AllianceOption[]>([]);
  const [form, setForm] = useState({
    allianceId: "",
    turnoutShiftPct: "0",
    padronGrowthPct: "0",
    candidateBoostFp: "0"
  });

  useEffect(() => {
    fetch("/api/alliances")
      .then((response) => response.json())
      .then((data: DashboardPayload) => {
        const table = data.tables[0];
        const options =
          table?.rows.map((row, index) => ({
            id: Number(row.id ?? index + 1),
            name: String(row.alianza)
          })) ?? [];
        setAlliances(options);
      });

    submitScenario();
  }, []);

  async function submitScenario() {
    setLoading(true);
    const response = await fetch("/api/simulation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        allianceId: form.allianceId ? Number(form.allianceId) : undefined,
        turnoutShiftPct: Number(form.turnoutShiftPct),
        padronGrowthPct: Number(form.padronGrowthPct),
        candidateBoosts: {
          FP: Number(form.candidateBoostFp)
        }
      })
    });
    const data = (await response.json()) as DashboardPayload;
    setPayload(data);
    setLoading(false);
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <div className="small-label">Escenario interactivo</div>
          <h2>Simulation</h2>
          <p>Ajusta alianza, turnout, crecimiento del padron e impulso de candidatura para recalcular el tablero.</p>
        </div>
      </header>

      <section className="card">
        <div className="simulation-controls">
          <label className="field">
            <span>Alianza</span>
            <select
              value={form.allianceId}
              onChange={(event) => setForm((prev) => ({ ...prev, allianceId: event.target.value }))}
            >
              <option value="">Sin alianza</option>
              {alliances.map((alliance) => (
                <option key={alliance.id} value={alliance.id}>
                  {alliance.name}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Shift turnout (pp)</span>
            <input
              type="number"
              value={form.turnoutShiftPct}
              onChange={(event) => setForm((prev) => ({ ...prev, turnoutShiftPct: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Crecimiento adicional del padron (%)</span>
            <input
              type="number"
              value={form.padronGrowthPct}
              onChange={(event) => setForm((prev) => ({ ...prev, padronGrowthPct: event.target.value }))}
            />
          </label>

          <label className="field">
            <span>Boost candidato FP (pp)</span>
            <input
              type="number"
              value={form.candidateBoostFp}
              onChange={(event) => setForm((prev) => ({ ...prev, candidateBoostFp: event.target.value }))}
            />
          </label>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="button" type="button" onClick={submitScenario} disabled={loading}>
            {loading ? "Recalculando..." : "Simular"}
          </button>
        </div>
      </section>

      {payload ? (
        <div className="grid">
          <section className="grid kpi-grid">
            {payload.kpis.map((kpi) => (
              <article className={`card tone-${kpi.tone ?? "neutral"}`} key={kpi.label}>
                <div className="kpi-label">{kpi.label}</div>
                <div className="kpi-value">{kpi.value}</div>
                {kpi.delta ? <div className="small-label">{kpi.delta}</div> : null}
              </article>
            ))}
          </section>

          <section className="grid section-grid">
            <div className="stack">
              {payload.tables.map((table) => (
                <article className="card" key={table.title}>
                  <h3>{table.title}</h3>
                  <div className="table-wrap">
                    <table>
                      <thead>
                        <tr>
                          {table.columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={`${table.title}-${rowIndex}`}>
                            {table.columns.map((column) => (
                              <td key={column}>{String(row[column] ?? "")}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </article>
              ))}
            </div>

            <div className="stack">
              <article className="card">
                <h3>Highlights</h3>
                <div className="highlight-list">
                  {payload.highlights.map((item) => (
                    <div className={`highlight-item tone-${item.tone ?? "neutral"}`} key={item.title}>
                      <h4>{item.title}</h4>
                      <p>{item.description}</p>
                    </div>
                  ))}
                </div>
              </article>

              {payload.charts.map((chart) => (
                <article className="card" key={chart.title}>
                  <h3>{chart.title}</h3>
                  <div className="chart-list">
                    {chart.series.map((entry) => (
                      <div className="bar-row" key={entry.label}>
                        <div>{entry.label}</div>
                        <div className="bar-track">
                          <div className="bar-fill" style={{ width: `${Math.max(4, Math.min(100, entry.value))}%` }} />
                        </div>
                        <div>{entry.value}</div>
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      ) : (
        <div className="loading">Preparando simulador...</div>
      )}
    </div>
  );
}
