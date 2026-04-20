"use client";

import { useEffect, useState } from "react";
import type { DashboardPayload } from "@/lib/types";

type Props = {
  endpoint: string;
  titleFallback: string;
};

export function DashboardPage({ endpoint, titleFallback }: Props) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    fetch(endpoint)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(await response.text());
        }
        return response.json();
      })
      .then((payload: DashboardPayload) => {
        if (active) {
          setData(payload);
        }
      })
      .catch((err: Error) => {
        if (active) {
          setError(err.message);
        }
      });

    return () => {
      active = false;
    };
  }, [endpoint]);

  if (error) {
    return <div className="card tone-negative">Error cargando {titleFallback}: {error}</div>;
  }

  if (!data) {
    return <div className="loading">Cargando inteligencia estrategica...</div>;
  }

  return (
    <div className="grid">
      <header className="page-header">
        <div>
          <div className="small-label">Actualizado {new Date(data.generatedAt).toLocaleString("es-DO")}</div>
          <h2>{data.title}</h2>
          <p>{data.subtitle}</p>
        </div>
      </header>

      <section className="grid kpi-grid">
        {data.kpis.map((kpi) => (
          <article className={`card tone-${kpi.tone ?? "neutral"}`} key={kpi.label}>
            <div className="kpi-label">{kpi.label}</div>
            <div className="kpi-value">{kpi.value}</div>
            {kpi.delta ? <div className="small-label">{kpi.delta}</div> : null}
          </article>
        ))}
      </section>

      <section className="grid section-grid">
        <div className="stack">
          {data.tables.map((table) => (
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
              {data.highlights.map((item) => (
                <div className={`highlight-item tone-${item.tone ?? "neutral"}`} key={item.title}>
                  <h4>{item.title}</h4>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          </article>

          {data.charts.map((chart) => (
            <article className="card" key={chart.title}>
              <h3>{chart.title}</h3>
              <div className="chart-list">
                {chart.series.map((entry) => (
                  <div className="bar-row" key={entry.label}>
                    <div>{entry.label}</div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{
                          width: `${Math.max(4, Math.min(100, entry.value))}%`,
                          background: entry.color
                        }}
                      />
                    </div>
                    <div>{entry.value}</div>
                  </div>
                ))}
              </div>
            </article>
          ))}

          <article className="card assumptions">
            <h3>Supuestos activos</h3>
            <ul>
              {data.assumptions.map((assumption) => (
                <li key={assumption}>{assumption}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>
    </div>
  );
}
