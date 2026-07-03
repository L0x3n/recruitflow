# RecruitFlow — en "super-ATS" i en klickbar demo

En fullt klickbar demo (ingen backend, allt state i minnet bakom ett mockat API-lager) som
förenar det bästa från **SmartRecruiters** (styrning), **Teamtailor** (employer branding) och
**Talentium** (AI-motor) — plus ett eget **Workforce Planning-lager som ersätter Excel**.

Byggd på en deep research-baserad plan ([ULTRAPLAN.md](ULTRAPLAN.md)), alla faser klara.
All text och mockdata på svenska.

## Logga in som olika roller
Ingen riktig inloggning — välj persona på startsidan. Varje roll ser sin egen värld (RBAC):
- **Ledningsgrupp** (Viktoria Ceder) — ser allt i läsläge + exec-dashboard, copilot, requisition-godkännande.
- **Rekryterande chef** (Marcus Öhrn) — sätter/delegerar budget, godkänner, ser varningar & compliance.
- **Rekryterare** (Eva Lindqvist) — arbetar operativt: pipeline, sourcing, outreach, headhunt.

## Moduler
- **Översikt** — rollstyrd dashboard (rekryterarens mål / chefens varningscentral / ledningens exec-vy).
- **Planering (WFP)** — workforce planning som ersätter Excel: **importera .xlsx/.csv**, budget vs utfall
  live ur pipelinen, prognos, what-if-scenarier, delegering.
- **Roller** — kravprofiler, kanalkostnader, intervjuplan.
- **Requisitions** — ny tjänst kräver godkännandekedja (chef → ekonomi → ledning) + budgetkoll.
- **AI-sourcing** — naturspråkssök över "hela webben", profiler byggda ur fragment med confidence,
  förklarbar matchning mot kravprofilen → spara till pipeline.
- **Headhunt-länkar** — spårbara länkar per rekryterare×roll, publik ansökan med attribution, leaderboard.
- **Karriärsida** — block-editor + tema → publik `/karriar` med ansök-flöde; triggers/automation; talangpool & nurture.
- **Kandidater** — kanban med drag & drop; avslag kräver alltid loggad orsak.
- **Inkorg** — outreach-sekvenser + gemensam inbox; svar flyttar kandidaten i pipelinen; Rita-assistent.
- **Feedback** — chefen svarar via röst/foto/text utan inloggning; röstmemo → strukturerad scorecard.
- **Erbjudanden** — jämförbara scorecards + radar; skapa erbjudande med lön-validering + **e-sign** (rita signatur).
- **Analys** — trattar, flaskhalsar, quality of hire + **rapportbyggare** (dimension × mått).
- **Ledningsfrågor** — board-ready kort + **copilot-Q&A** i naturligt språk (frågor besvaras live ur datan).
- **Compliance** — append-only audit-logg, AI-transparens, GDPR-gallring, marketplace-integrationer.
- **Datapipeline** — interaktiv karta över hela dataflödet; varje nod djuplänkar in i appen; "Visa verkligheten"-toggle;
  två loopar (process ↻ och plan → utfall → nästa plan).
- **Guidad tur** — 8 steg genom den perfekta världen. Demo-reset i Inställningar.

## Kör lokalt
```bash
npm install
npm run dev        # http://localhost:5202
```

## Bygg
```bash
npm run build      # typkoll + produktionsbygge till dist/
```

## Arkitektur
- **React + Vite + TypeScript**, react-router. Diagram är handskriven SVG; Excel via SheetJS (lazy).
- **Mockat API-lager** (`src/api/`) — in-memory "backend" med resursindelning formad efter SmartRecruiters
  öppna API, simulerad latens och valbar felsimulering. UI:t muterar ENDAST via `api.*`, så mocken kan
  bytas mot riktiga anrop utan att rita om skärmarna.
- Allt state i minnet — inget backend, inga konton, ingen persistens (medvetet, för en ren demo).

## Deploy (Render)
Repot innehåller `render.yaml` — skapa en **Static Site** kopplad till repot. Rewrite-regeln
`/* → /index.html` krävs för react-router-djuplänkarna.
