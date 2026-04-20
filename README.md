# Strategic Electoral Intelligence System (SIE)

Aplicacion full-stack en Next.js para inteligencia electoral estrategica conectada a Supabase en modo solo lectura. El sistema usa resultados 2020 y 2024 como baseline historico y deriva el estado actual desde encuestas ponderadas por calidad y recencia.

## Principios del modelo

- Supabase se usa en modo lectura.
- No hay migraciones, cambios de esquema ni escrituras a la base.
- `2024` no se trata como estado actual, solo como baseline.
- El estado actual combina:
  - baseline territorial 2024
  - polls ponderados
  - velocidad de tendencia
  - padron proyectado
  - turnout historico
  - transferencia PLD -> FP
  - escenarios de alianza

## Vistas y tablas usadas

- `elecciones`
- `encuestas`
- `padron`
- `partidos`
- `alianzas`
- `alianza_partidos`
- `v_transferencia_pld_fp`
- `v_riesgo_territorial`
- `v_inteligencia_provincial`
- `v_nuevos_electores_2028`
- `v_senado_provincial`
- `v_diputados_circ`
- `alertas`
- `mv_votos_nacional`
- `mv_votos_provincia`
- `mv_votos_municipio`
- `mv_votos_circunscripcion`
- `votos_mesa` como fuente granular confirmada para futuros splits de colegio

## Modulos implementados

- Ingestion Engine
- Baseline Engine
- Polling Engine
- Nowcasting Engine
- Trend & Velocity Engine
- Projection Engine
- Strategic Scoring Engine
- Investment Engine
- Seat Recovery Engine
- Alliance Engine
- Vote Transfer Engine
- Alert Engine
- Scenario Simulation Engine
- Optimization Engine
- Electoral Roll Projection Engine
- Turnout Engine

## Frontend

Vistas incluidas:

- Overview
- Strategic Map
- Territory Analysis
- Opportunities
- Alliances
- Vote Transfer
- Tracking
- Simulation
- Optimization

## Setup

1. Instala dependencias:

```bash
npm install
```

2. Crea el archivo `.env.local` a partir de `.env.example`.

3. Ejecuta desarrollo:

```bash
npm run dev
```

4. Compila produccion:

```bash
npm run build
```

5. Inicia produccion:

```bash
npm run start
```

## Variables de entorno

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SCHEMA=sie2028
NEXT_PUBLIC_APP_NAME=Strategic Electoral Intelligence System
```

## Conexion a Supabase

La conexion se define en [lib/supabase/client.ts](/Users/DISENOCD/Documents/New project/lib/supabase/client.ts). El cliente:

- usa `NEXT_PUBLIC_SUPABASE_URL`
- usa `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- fija el esquema en `sie2028` por defecto
- desactiva persistencia de sesion

## Supuestos documentados

- El foco estrategico actual se modela alrededor de `FP`, por ser el eje de transferencia y alianzas confirmado.
- Las encuestas nacionales son la señal mas confiable hoy; cuando entren encuestas territoriales, el motor puede extender su ponderacion.
- El presupuesto se optimiza en una unidad abstracta de `100`, no monetaria.
- Donde una fuente por nivel no esta plenamente expuesta, el sistema usa las vistas agregadas confirmadas y deja la logica encapsulada para sustitucion futura.

## Estructura

```text
app/
  api/
  overview/
  strategic-map/
  territory-analysis/
  opportunities/
  alliances/
  vote-transfer/
  tracking/
  simulation/
  optimization/
components/
lib/
  config/
  engines/
  supabase/
  utils/
```

## Notas

- El proyecto esta listo para subirse a GitHub como repo Next.js.
- Para compartirlo como archivo, comprime la carpeta raiz una vez validado con `npm run build`.
