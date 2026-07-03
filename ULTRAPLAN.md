# ULTRAPLAN — RecruitFlow blir en "Super-ATS"

> SmartRecruiters styrning + Teamtailors yta + Talentiums AI-motor + Workforce Planning
> som ersätter Excel — i en app, med rollstyrda inlogg och mockat API-lager.
> Baserad på deep research 2026-07-03 (källor i §8).

## STATUS
- ✅ **Etapp 1 (Fas 0–2)** — API-lager + 3 rollinlogg/RBAC + Workforce Planning + varningar + Ledningsfrågor.
- ✅ **Excel-import (.xlsx)** — SheetJS, arkväljare, datum, i Planering (utöver CSV).
- ✅ **Etapp 2 (Fas 3–5)** — AI-sourcing (deep search → smart profiling → förklarbar match → pipeline),
  outreach-sekvenser + joint inbox + Rita-assistent, headhunt-länkar med attribution + leaderboard +
  publik jobbsida (/jobb?hh=).
- ⏭️ **Kvar: Etapp 3 (Fas 6–7)** karriärsidebyggare/triggers/nurture + requisitions/offers/compliance,
  **Etapp 4 (Fas 8–9)** rapportbyggare/copilot-Q&A + datapipeline v2/polish.

---

## 0. Vision — vad vi tar från vem

| Källa | Deras DNA | Det vi bygger in |
|---|---|---|
| **SmartRecruiters** (SmartOS) | Enterprise-styrning: ATS+CRM+offers+analytics i en suite, Winston (agentisk AI), AI Control Center (transparens/audit/RBAC), approval-kedjor, öppet API | Requisitions + godkännandekedjor, offer management, compliance-/auditcenter, rapportbyggare, API-mock format efter deras REST-API |
| **Teamtailor** | Ytan: drag-and-drop-karriärsida, kandidatupplevelse, Triggers (smart move/schedule), Nurture, Connect/talangpool, Co-pilot | Karriärsidebyggare med **riktigt ansök-flöde in i pipelinen**, automations-triggers, talangpool, nurture-kampanjer |
| **Talentium** | Motorn: Deep search (hela webben + nätverk), Smart profiling (fragment→komplett profil), Network intelligence, Joint inbox, AI-outreach, Ted (autonom assistent) | AI-sourcing med naturspråkssök, automatiskt profilbyggande med confidence, förklarbar matchning mot kravprofilen, outreach-sekvenser + gemensam inbox kopplad till pipelinen |
| **Vårt eget lager** (finns inte fullt ut hos någon av dem) | — | **Workforce Planning som ersätter Excel** + tre rollstyrda inlogg + automatiska eftersläpningsvarningar + headhunting-länkar med attribution |

Kärnberättelsen från dagens RecruitFlow behålls: **all data fångas strukturerat vid källan**
— WFP-modulen blir en ny "källa" överst i datapipeline-kartan och sluter en andra loop:
*plan → rekrytering → utfall → nästa plan.*

---

## 1. Research-sammanfattning (det som styr designen)

**Talentium** (talentium.io, Sebastian Hjärne, Sthlm): Deep search — "searches across the
web, your network, and applicants"; parsar GitHub, HuggingFace, portfolios, forskningsartiklar;
naturspråksfrågor ("Find an ML engineer in Berlin with unicorn experience"). Smart profiling
slår ihop data från alla källor till kompletta profiler som auto-uppdateras. Joint inbox +
AI-personaliserad outreach kopplad till mail/kalender, smart nudges. ATS-pipeline i en vy,
Interview assistant, karriärsida, jobbpush till 20+ kanaler, Ted = autonom AI-assistent.
Prismodell avslöjar funktionstrappan: AI-sökningar/dag → delad inbox → bulk-outreach →
full ATS + analytics. **Bara intervjun är manuell** — det är deras tes.

**SmartRecruiters**: SmartOS = ATS, CRM, job distribution, messaging, offers, onboarding,
analytics. Winston = agentisk AI för rekryterare/chef/kandidat, styrd av AI Control Center
(transparens, auditbarhet, GDPR, roller/behörigheter). API:er: Posting, Application,
Reporting, Interview (self-scheduling), Offer, Assessment, webhooks; OAuth2/API-nyckel,
access scopes → **vårt mock-API härmar denna resursindelning**.

**Teamtailor**: karriärsidebyggare i Squarespace-klass, Triggers (auto-skicka meddelanden/
enkäter, smart move, smart schedule, referenstagning, to-dos), Nurture för passiva kandidater,
Connect/talangpool, Co-pilot (skriv annons, föreslå kandidater ur poolen), analytics med
veckosummeringar + kostnad/visningar/ansökningar per kanal. API = JSON:API-format.

**Workforce planning-kategorin** (TeamOhana m.fl. — mönstret för vår WFP-modul):
budget vs utfall, headcount-varians, what-if-scenarier, godkännandeflöden för nya tjänster/
ändringar med audit log, hiring tracker, rekryterarkapacitet, agentisk Q&A
("vilken headcount riskerar försening?"). Livscykel: Inspect → Plan → Hire → Compensate → Optimize.

---

## 2. Arkitektur

### 2.1 Mockat API-lager (byt-mot-riktigt-senare-design)
```
src/api/
  server.ts        In-memory-"databas" (seedas från data.ts) + muteringar. ENDA stället state bor.
  client.ts        apiFetch<T>(resurs, metod, body) — simulerad latens 150–400 ms, Promise-baserad,
                   feltoggle (slå på "API-fel" i Inställningar för att demo:a felhantering)
  resources/
    postings.ts    ~ SmartRecruiters Posting API   (GET/POST /postings, /postings/:id/publications)
    candidates.ts  ~ SR Application API + Teamtailor JSON:API-form på svaren
    offers.ts      ~ SR Offer API
    reports.ts     ~ SR Reporting API (genererar ur live-state)
    sourcing.ts    ~ Talentium-stil: POST /searches {query} → SourcedProfile[]
    outreach.ts    sekvenser, trådar, meddelanden
    wfp.ts         planer, budgetar, mål, varningar
    webhooks.ts    event-buss i minnet — driver triggers + varningar + audit log
```
UI:t får ALDRIG röra `server.ts` direkt — bara `api.*`. Då kan mocken bytas mot riktiga
API:er utan att skärmarna ritas om. Store:n blir ett tunt cache-lager ovanpå API:t.

### 2.2 Inlogg & RBAC (mock-auth)
Inloggningsskärm med tre demokonton (klicka för att logga in — inget lösenord på riktigt):

| Roll | Konto | Ser | Får göra |
|---|---|---|---|
| **Ledningsgrupp** | Vd Viktoria Ceder | ALLT (read-only) + exec-dashboard | Kommentera, exportera |
| **Rekryterande chef (admin)** | Marcus Öhrn | Hela WFP, alla roller, all statistik | Sätta/delegera budget, redigera mål, godkänna requisitions, se & kvittera varningar |
| **Rekryterare** | Eva Lindqvist | Sina roller, sin budget, sina mål, sina länkar | Allt operativt (pipeline, outreach, feedback) |

RBAC-guard per route + per knapp (`can('wfp.editBudget')`-mönster). Rollväxlaren i
toppraden gör demon säljbar: växla persona mitt i en visning.

### 2.3 Nya entiteter (datamodell)
`User/Role`, `WorkforcePlan` (år/kvartal), `PlanRow` (avdelning × roll × antal × kompetenser ×
budget × målstartdatum × ansvarig rekryterare), `Requisition` (+ `ApprovalStep[]`),
`RecruiterTarget`, `Warning` (regel, allvarlighet, kvitterad?), `SourcedProfile`
(fragment[] + confidence + källor), `MatchScore` (per kriterium + förklaring),
`OutreachSequence`/`InboxThread`/`Message`, `HeadhuntLink` (+ `ClickEvent[]`),
`CareerPage` (block[]), `TriggerRule`, `NurtureCampaign`, `AuditEvent` (append-only),
`Scenario` (what-if-kopior av plan).

---

## 3. Faserna

### Fas 0 — Fundament: API-mock + inlogg (grundbulten)
- `src/api/` enligt §2.1; flytta ALL state bakom mock-API:t; store → cache/prenumerant.
- Inloggningsskärm + tre konton + RBAC-guards + rollväxlare i toppraden.
- Audit log-grunden: varje mutation via API:t loggar AuditEvent (aktör, tidsstämpel, diff).
- ✅ Klart när: appen fungerar exakt som idag men allt går via `api.*`, och de tre
  inloggen ser olika navigation/knappar.

### Fas 1 — Workforce Planning (ersätter Excel) ⭐ hjärtat
- Ny modul **Planering**: årsplan med rader per avdelning × roll: antal, kompetenser (chips
  → blir kravprofilsutkast), lönebudget + rekryteringsbudget, målkvartal/startdatum,
  ansvarig rekryterare.
- **Excel/CSV-import på riktigt**: ladda upp befintlig planeringsfil → kolumnmappnings-
  wizard → rader skapas. Det är migrerings-storyn: "importera en gång, aldrig mer Excel."
  (Export till CSV finns också — men appen är källan till sanning.)
- Budget vs utfall live: varje anställning/erbjudande i pipelinen bokförs mot sin planrad
  (lön ur offern + rekryteringskostnad ur kanaldata). Varians-kolumn med färg.
- Prognos per rad: baserat på pipeline-täckning + historisk konverteringsgrad ur trattarna
  → "beräknad start v.42 (3 v. efter plan)".
- What-if-scenarier: duplicera planen, dra i antal/budget, jämför sida vid sida.
- Delegering: chef tilldelar rader/budgetpott till rekryterare → syns i deras inlogg.
- ✅ Klart när: CSV-import → plan → koppla befintliga roller → budget/utfall/prognos räknas
  ur live-pipelinen.

### Fas 2 — Rollstyrda dashboards + varningar + ledningsstatistik
- **Rekryterarens vy**: mina mål (antal/kvartal), min budgetpott, min pipeline-hälsa,
  mina varningar, mina headhunt-länkar (Fas 5).
- **Chefens vy (admin)**: hela planen, delegering, varningscentral, godkännanden,
  **"Ledningsfrågor"** — board-ready kort som besvarar de vanliga frågorna direkt:
  kostnad per anställning per avdelning, plan vs utfall, prognos mot årsmål, källa-ROI,
  tid till start per roll. Varje kort exporterbart (kopiera som bild/tabell).
- **Ledningsvyn**: read-only översikt över allt + trendlinjer mot årsplan.
- **Automatiska varningar** (regelmotor på webhook-bussen, chef ser alla + rekryterare sina):
  - Pipeline-täckning: färre än N aktiva kandidater per öppen planrad
  - Inaktivitet: ingen stegförflyttning/outreach på X dagar för prioriterad roll
  - Prognos slår plan: beräknat startdatum > målstartdatum
  - Budget: prognostiserad kostnad > delegerad pott
  - Varningar kvitteras med kommentar → audit log (styrnings-berättelsen).
- ✅ Klart när: chefen kan svara på "ligger vi i fas?" med två klick, och en efterliggande
  rekryterare genererar en varning som syns i bådas inlogg.

### Fas 3 — Talentium-motorn: Deep search + Smart profiling + matchning ⭐
- **Sourcing-modul**: naturspråkssök ("senior backendutvecklare Stockholm, Kafka, gärna
  open source-bidrag") → animerad "sveper webben"-sekvens → mockade träffar med käll-
  ikoner (GitHub-stil, portfolio, konferens-talk, forskningsartikel, jobbnätverk).
- **Smart profiling**: klick på träff → fragment från olika källor slås ihop synligt till
  en profil (namn, stack, tillväxtbana, sidoprojekt) med **confidence-mätare** per fält
  och "auto-uppdateras vid förändring"-flagga. Talentiums tes syns: profiler byggs, inte
  ansökningar väntas.
- **Förklarbar AI-match**: poäng mot kravprofilens kriterier med per-kriterium-bidrag
  ("+ Kafka i 3 repos", "− ingen ledarerfarenhet") → aldrig ett svart lådnummer.
  Matchpanel på både sourcade profiler och inkomna ansökningar.
- "Spara till pipeline" → SourcedProfile blir Candidate med källa=AI-sourcing.
- Sökkvot per plan-tier som easter egg (Free: 1/dag …) för att visa affärsmodellen.
- ✅ Klart när: sök → profil → matchförklaring → in i kanban, och kandidatkortet visar
  sourcing-källan hela vägen till anställning.

### Fas 4 — Outreach + Joint inbox (Talentium forts.)
- **Sekvenser**: mall med steg (dag 0 personaliserat mail → dag 3 follow-up → dag 7 nudge),
  AI-utkast per kandidat (mock-genererat ur profilen), pausa/avsluta vid svar.
- **Gemensam inbox** per roll: trådar kopplade till kandidat + roll + steg; svara i appen;
  ett svar kan flytta kandidaten i pipelinen direkt från tråden (Talentiums "allt i ett flöde").
- Smart nudges: "Amir öppnade ditt mail 2 ggr — ring nu"-kort.
- **"Ted"-assistenten** (vår: **Rita**): förslagskort i högerpanel — "3 kandidater har inte
  hörts av på 5 dagar, ska jag skicka steg 2?" → godkänn → händer på riktigt i mocken.
- ✅ Klart när: starta sekvens från sourcing-träff → svar landar i inboxen → flytta till
  Intervju från tråden → syns i kanban + tidslinje.

### Fas 5 — Headhunting-länkar med attribution (din specialare)
- Varje rekryterare genererar unika länkar per roll: `/jobb/backend?hh=eva-x7k2`.
- Länken går till rollens **publika jobbsida** (Fas 6-light: enkel version här) med
  ansök-formulär → skapar kandidat med `source: Headhunt · Eva Lindqvist` + länk-id.
- Spårning: klick, unika besökare, ansökningar, konvertering per länk (mockade klick
  + riktiga ansökningar via formuläret).
- Leaderboard i chefens vy: headhunt-ansökningar per rekryterare, kvalitet (snittscore),
  hur många som nått intervju/anställning. Räknas mot rekryterarens WFP-mål.
- QR-kod för mässor (genereras klientside) + kopiera-knapp.
- ✅ Klart när: skapa länk → öppna → ansök → kandidaten dyker upp i kanban med rätt
  attribution och leaderboarden uppdateras.

### Fas 6 — Teamtailor-ytan: karriärsida + triggers + talangpool
- **Karriärsidebyggare**: block-editor (hero, om oss, förmåner, jobb-lista, medarbetarcitat,
  video-placeholder) med drag-ordning och färgtema → **Publicera** → riktig route `/karriar`
  som listar aktiva roller ur API:t; ansök-flödet skapar kandidater på riktigt (samma väg
  som Fas 5-formuläret).
- **Triggers-byggare**: "NÄR kandidat flyttas till [steg] DÅ [skicka mall / begär feedback /
  lägg till i nurture / skapa to-do]" — kör på webhook-bussen, syns i tidslinjen.
  (Vår tvingade avslagsorsak blir en inbyggd trigger.)
- **Connect/talangpool**: kandidater utan aktiv roll; Nurture-kampanj med utskicksschema
  och öppningsstatistik (mock); Co-pilot-momentet "föreslå ur poolen" när ny roll skapas.
- ✅ Klart när: bygg sida → publicera → sök jobb → ansök → trigger skjuter välkomstmail
  + kandidaten syns i pipelinen.

### Fas 7 — SmartRecruiters-styrningen: requisitions + offers + compliance
- **Requisition-flöde**: ny tjänst kräver godkännandekedja (chef → ekonomi → ledning) innan
  rollen kan öppnas; kopplas till WFP-rad (finns budget? auto-check). Approval-status
  syns i planen. (TeamOhana-mönstret: net-new/ändring/audit.)
- **Offer management**: generera erbjudande ur mall (lön inom spann-validering mot WFP-
  budget!), skicka → kandidatens vy → **e-sign-mock** (rita signatur) → status + bokförs
  mot budget.
- **Compliance-center**: GDPR-panelen (finns) + full audit log-vy med filter, AI-transparens-
  panel à la AI Control Center ("dessa AI-beslut fattades, med dessa förklaringar"),
  gallringskörning som demo-knapp.
- **Marketplace-mock**: integrationskort (Slack, Teams, BankID, LinkedIn, Fortnox-lön…)
  på/av — "på" simulerar notiser i appen.
- ✅ Klart när: rollen kan inte öppnas utan godkänd requisition med budgettäckning, och
  offern signeras + bokförs.

### Fas 8 — Analytics-builder + copilot-Q&A
- Rapportbyggare: välj dimension (roll/avdelning/källa/rekryterare) × mått (tid/kostnad/
  konvertering/kvalitet) → tabell + diagram, spara som kort på valfri dashboard.
- **Copilot (Rita, chef/lednings-läge)**: naturspråksfrågor mot mockdatan med regelbaserad
  parser + färdiga svarsmallar: "vilka roller riskerar försening?", "total kostnad för
  ogodkända requisitions?", "vilken kanal ger bäst kvalitet per krona?" → svar med
  källkort + länk till underlaget. (TeamOhana/Winston-mönstret.)
- ✅ Klart när: ledningen kan ställa 5 fördefinierade frågetyper fritt formulerade och få
  korrekta svar ur live-state.

### Fas 9 — Polish & berättelsen
- Datapipeline-kartan v2: nya noder (WFP-planen som källa överst, Sourcing/webben,
  Inbox, Karriärsida in; Varningar/Ledningsvy ut) + andra loopen plan→utfall→plan.
- Guidad tur v2: persona-baserad (tur som chef, tur som rekryterare, tur som ledning).
- Demo-reset-knapp, seed-scenarier ("mitt i Q3, två roller efter plan").
- README, skärmbilder, deploy-verifiering på Render.

---

## 4. Rekommenderad ordning & ungefärlig storlek

| Etapp | Faser | Varför först | Uppskattning |
|---|---|---|---|
| 1 | Fas 0 + 1 + 2 | Ditt kärnbehov (Excel-ersättaren + inlogg + varningar) | stor |
| 2 | Fas 3 + 4 + 5 | Talentium-motorn + dina headhunt-länkar | stor |
| 3 | Fas 6 + 7 | Ytan + styrningen | mellan |
| 4 | Fas 8 + 9 | Copilot + berättelse | mellan |

---

## 5. Tillagt utöver din lista (och varför)
- **CSV/Excel-import i WFP** — utan den syns inte "slipp Excel"-migreringen, bara slutläget.
- **What-if-scenarier + prognos** — standard i WFP-kategorin; det chefer faktiskt frågar efter.
- **Requisition-godkännanden kopplade till budget** — utan dem är budgetstyrningen tandlös.
- **Triggers/automation + nurture + karriärsida med riktigt ansök-flöde** — Teamtailors kärna,
  och headhunt-länkarna (Fas 5) behöver ändå den publika jobbsidan.
- **Audit log + AI-transparens** — SmartRecruiters compliance-DNA; gör demon enterprise-trovärdig.
- **Copilot-Q&A för ledning** — "chefen ska kunna stå till svar" blir starkare när ledningen
  också kan fråga systemet direkt.

## 6. Medvetet bortvalt (för demon)
- Riktig autentisering/SSO (mock-inlogg räcker), riktiga mail-/kalenderintegrationer,
  riktig e-signering, riktig webscraping (juridiskt + tekniskt fel scope — sourcingen mockas),
  onboarding/HRIS-djup, mobilappar, flerspråk. Allt state förblir i minnet
  (ev. localStorage-toggle för att överleva sidladdning — beslut i Fas 0).

## 7. Verifieringsprincip
Varje fas avslutas med browser-verifiering i preview (som hittills): flödestest end-to-end
via eval + skärmdumpar, tsc + prod-build gröna, push → Render.

---

## 8. Källor (deep research 2026-07-03)
- Talentium: [talentium.io](https://talentium.io/) (Deep search, Smart profiling, Network
  intelligence, Joint inbox, Ted), [pricing](https://talentium.io/pricing/) (funktionstrappa),
  [Stockholm Valley-intervju](https://www.stockholmvalley.com/talentium-reimagining-recruitment-with-ai/)
  (naturspråkssök, källor bortom LinkedIn, auto-uppdaterade profiler, "bara intervjun är manuell")
- SmartRecruiters: [smartrecruiters.com](https://www.smartrecruiters.com/) (SmartOS),
  [Winston](https://www.smartrecruiters.com/winston/) (agentisk AI + AI Control Center),
  [developers.smartrecruiters.com](https://developers.smartrecruiters.com/) (Posting/Application/
  Reporting/Interview/Offer-API:er, OAuth2, access scopes, webhooks)
- Teamtailor: [all features](https://www.teamtailor.com/en/all-features/),
  [automation & triggers](https://www.teamtailor.com/en/recruitment-automation-and-triggers/)
  (smart move/schedule, nurture, Co-pilot); API = JSON:API (docs.teamtailor.com)
- WFP-kategorin: [TeamOhana workforce planning](https://www.teamohana.com/workforce-planning-platform)
  + [headcount management](https://www.teamohana.com/headcount-management-platform)
  (budget vs utfall, approvals, scenarier, agentisk Q&A),
  [ChartHop-guide](https://www.charthop.com/resource/best-headcount-planning-software)
