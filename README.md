# RecruitFlow — Rekrytering i en perfekt värld

En fullt klickbar demo (ingen backend, allt state i minnet) som visar hur rekrytering fungerar
när varje datapunkt fångas, struktureras och är spårbar — från kravprofil till quality of hire.

**Signaturfunktionen:** sidan *Datapipeline* är en levande karta över hela dataflödet.
Varje nod är klickbar och djuplänkar till exakt den skärm där datan skapas eller används.
Togglen **"Visa verkligheten"** visar det brutna chefsflödet — läckan som appen stänger.

## Innehåll

- **Översikt** — KPI:er (hjältemetrik: feedback-svarstid 3 dagar → 4 tim), åtgärdslista, source of hire
- **Roller** — strukturerade kravprofiler, kanalkostnader, intervjuplan
- **Kandidater** — kanban med drag & drop; avslag kräver alltid loggad orsak
- **Feedback** — chefen svarar via röst/foto/text utan inloggning; röstmemo → strukturerad scorecard
- **Erbjudanden & beslut** — jämförbara scorecards, radardiagram, signerad beslutsmotivering
- **Analys** — trattar, flaskhalsar, kanal-ROI och quality of hire kopplad till ursprunglig bedömning
- **Guidad tur** — 8 steg genom den perfekta världen

All text och mockdata på svenska. 27 kandidater, 3 roller, 5 historiska anställningar.

## Kör lokalt

```bash
npm install
npm run dev        # http://localhost:5202
```

## Bygg

```bash
npm run build      # typkoll + produktionsbygge till dist/
```

## Deploy (Render)

Repot innehåller `render.yaml` — skapa en **Static Site** på render.com kopplad till repot,
eller använd *Blueprints*. Rewrite-regeln `/* → /index.html` krävs för react-router-djuplänkarna.

Byggd med Vite + React + TypeScript. Inga övriga beroenden — alla diagram är handskriven SVG.
