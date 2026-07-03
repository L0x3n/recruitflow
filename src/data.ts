import type {
  Candidate, FeedbackRequest, Notification, Offer, PlanRow, Role, Scorecard, SourcedProfile, StageId, TimelineEvent, User,
} from './types'

// ---------- Användare (mock-inlogg) ----------

export const USERS: User[] = [
  {
    id: 'u-viktoria', name: 'Viktoria Ceder', title: 'Vd', role: 'ledning', roleLabel: 'Ledningsgrupp',
    email: 'viktoria.ceder@bolaget.se', notiser: 'Veckosummering',
  },
  {
    id: 'u-marcus', name: 'Marcus Öhrn', title: 'Utvecklingschef · rekryterande chef', role: 'chef', roleLabel: 'Rekryterande chef',
    email: 'marcus.ohrn@bolaget.se', notiser: 'Direkt vid varningar och feedback',
  },
  {
    id: 'u-eva', name: 'Eva Lindqvist', title: 'Rekryterare', role: 'rekryterare', roleLabel: 'Rekryterare',
    email: 'eva.lindqvist@bolaget.se', notiser: 'Direkt vid chefsfeedback · dagligen för övrigt',
  },
]

export const RECRUITERS = ['Eva Lindqvist', 'Sofia Renberg']

// ---------- Workforce plan 2026 (seed) ----------

export const PLAN_ROWS_2026: PlanRow[] = [
  {
    id: 'p-backend', avdelning: 'Utveckling', rollTitel: 'Backend-utvecklare', koppladRollId: 'backend',
    antal: 3, kompetenser: ['TypeScript', 'Node.js', 'SQL'], lonebudget: 62000, rekrbudget: 60000,
    malKvartal: 'Q3 2026', malStart: '2026-09-01', ansvarig: 'Eva Lindqvist', prioritet: 'hög',
  },
  {
    id: 'p-ekonomi', avdelning: 'Ekonomi', rollTitel: 'Ekonomiassistent', koppladRollId: 'ekonomi',
    antal: 2, kompetenser: ['Fortnox', 'Excel'], lonebudget: 38000, rekrbudget: 20000,
    malKvartal: 'Q3 2026', malStart: '2026-08-15', ansvarig: 'Eva Lindqvist', prioritet: 'normal',
  },
  {
    id: 'p-ktchef', avdelning: 'Kundtjänst', rollTitel: 'Kundtjänstchef', koppladRollId: 'kundtjanst',
    antal: 1, kompetenser: ['Ledarskap', 'CX'], lonebudget: 56000, rekrbudget: 35000,
    malKvartal: 'Q4 2026', malStart: '2026-10-01', ansvarig: 'Eva Lindqvist', prioritet: 'hög',
  },
  {
    id: 'p-ktmed', avdelning: 'Kundtjänst', rollTitel: 'Kundtjänstmedarbetare',
    antal: 2, kompetenser: ['Zendesk', 'Kundfokus'], lonebudget: 32000, rekrbudget: 15000,
    malKvartal: 'Q3 2026', malStart: '2026-08-15', ansvarig: 'Sofia Renberg', prioritet: 'normal',
  },
  {
    id: 'p-frontend', avdelning: 'Utveckling', rollTitel: 'Frontend-utvecklare',
    antal: 1, kompetenser: ['React', 'TypeScript'], lonebudget: 58000, rekrbudget: 45000,
    malKvartal: 'Q4 2026', malStart: '2026-11-01', ansvarig: 'Eva Lindqvist', prioritet: 'normal',
  },
  {
    id: 'p-ux', avdelning: 'Design', rollTitel: 'UX-designer',
    antal: 1, kompetenser: ['Figma', 'Prototyping'], lonebudget: 52000, rekrbudget: 40000,
    malKvartal: 'Q4 2026', malStart: '2026-11-15', ansvarig: 'Sofia Renberg', prioritet: 'normal',
  },
  {
    id: 'p-saljare', avdelning: 'Sälj', rollTitel: 'Account Manager',
    antal: 2, kompetenser: ['B2B-försäljning', 'CRM'], lonebudget: 45000, rekrbudget: 50000,
    malKvartal: 'Q1 2027', malStart: '2027-01-15', ansvarig: '', prioritet: 'normal',
  },
]

// ---------- Steg ----------

export const STAGES: { id: StageId; label: string }[] = [
  { id: 'nya', label: 'Nya ansökningar' },
  { id: 'screening', label: 'Screening' },
  { id: 'intervju', label: 'Intervju' },
  { id: 'case', label: 'Case/Teknisk' },
  { id: 'slutintervju', label: 'Slutintervju' },
  { id: 'referenser', label: 'Referenser' },
  { id: 'erbjudande', label: 'Erbjudande' },
  { id: 'anstalld', label: 'Anställd' },
  { id: 'avslag', label: 'Avslag' },
]

export const stageLabel = (id: StageId) => STAGES.find(s => s.id === id)?.label ?? id

export const REJECTION_REASONS = [
  'Saknar must-have-kompetens',
  'Lönekrav utanför spann',
  'Bättre kandidat vald',
  'Tackade nej',
  'Kulturell matchning',
]

// ---------- Roller ----------

export const ROLES: Role[] = [
  {
    id: 'backend',
    titel: 'Backend-utvecklare',
    status: 'aktiv',
    chef: 'Marcus Öhrn',
    chefTitel: 'Utvecklingschef',
    mustHave: ['TypeScript', 'Node.js', 'SQL & datamodellering', 'CI/CD', '3+ års erfarenhet'],
    meriterande: ['AWS', 'Kubernetes', 'GraphQL', 'Terraform'],
    lonespann: '52 000 – 62 000 kr/mån',
    startdatum: '2026-09-01',
    succekriterier: [
      'Levererar självständigt i teamets sprintar inom 3 månader',
      'Har tagit ägarskap för minst en tjänst i plattformen',
      'Bidrar aktivt i kodgranskningar och arkitekturdiskussioner',
    ],
    kravprofilKomplett: true,
    kriterier: ['TypeScript/Node.js', 'Systemdesign', 'SQL & datamodellering', 'Samarbete & kommunikation', 'Problemlösning'],
    annonsering: [
      { kanal: 'LinkedIn', kostnad: 12000, visningar: 18400, ansokningar: 21 },
      { kanal: 'Karriärsida', kostnad: 0, visningar: 3200, ansokningar: 9 },
      { kanal: 'Arbetsförmedlingen', kostnad: 0, visningar: 5100, ansokningar: 11 },
      { kanal: 'Utvecklarforum (annons)', kostnad: 6500, visningar: 7800, ansokningar: 7 },
    ],
    intervjuplan: [
      { namn: 'CV-screening', langd: '—', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Screeningmall Backend' },
      { namn: 'Telefonintervju', langd: '30 min', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Telefonintervju Backend' },
      { namn: 'Teknisk intervju/Case', langd: '60 min', bedomare: 'Marcus Öhrn (chef)', scorecard: 'Tekniskt case Backend' },
      { namn: 'Slutintervju', langd: '45 min', bedomare: 'Marcus Öhrn (chef) + Nadia Berg (teamlead)', scorecard: 'Slutintervju Backend' },
      { namn: 'Referenser', langd: '2 × 20 min', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Referensmall' },
      { namn: 'Erbjudande', langd: '—', bedomare: 'Marcus Öhrn (chef)', scorecard: '—' },
    ],
  },
  {
    id: 'ekonomi',
    titel: 'Ekonomiassistent',
    status: 'aktiv',
    chef: 'Karin Ahlgren',
    chefTitel: 'Ekonomichef',
    mustHave: ['Löpande bokföring', 'Fortnox', 'Excel', 'Gymnasieekonomi eller YH'],
    meriterande: ['Lönehantering', 'Engelska i tal och skrift', 'Power BI'],
    lonespann: '32 000 – 38 000 kr/mån',
    startdatum: '2026-08-15',
    succekriterier: [],
    kravprofilKomplett: false,
    kriterier: ['Bokföring & Fortnox', 'Excel', 'Noggrannhet', 'Kommunikation', 'Självständighet'],
    annonsering: [
      { kanal: 'Arbetsförmedlingen', kostnad: 0, visningar: 9200, ansokningar: 18 },
      { kanal: 'LinkedIn', kostnad: 8000, visningar: 11000, ansokningar: 12 },
      { kanal: 'Karriärsida', kostnad: 0, visningar: 2100, ansokningar: 6 },
      { kanal: 'Lokalpress (annons)', kostnad: 4500, visningar: 3000, ansokningar: 3 },
    ],
    intervjuplan: [
      { namn: 'CV-screening', langd: '—', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Screeningmall Ekonomi' },
      { namn: 'Telefonintervju', langd: '30 min', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Telefonintervju Ekonomi' },
      { namn: 'Case (bokföringsuppgift)', langd: '60 min', bedomare: 'Karin Ahlgren (chef)', scorecard: 'Case Ekonomi' },
      { namn: 'Slutintervju', langd: '45 min', bedomare: 'Karin Ahlgren (chef) + Jonas Wall (redovisningsansvarig)', scorecard: 'Slutintervju Ekonomi' },
      { namn: 'Referenser', langd: '2 × 20 min', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Referensmall' },
      { namn: 'Erbjudande', langd: '—', bedomare: 'Karin Ahlgren (chef)', scorecard: '—' },
    ],
  },
  {
    id: 'kundtjanst',
    titel: 'Kundtjänstchef',
    status: 'aktiv',
    chef: 'Peter Sandell',
    chefTitel: 'COO',
    mustHave: ['Ledarerfarenhet 3+ år', 'Kundtjänst/CX-bakgrund', 'Coachande ledarskap', 'Datadrivet arbetssätt'],
    meriterande: ['Zendesk', 'NPS/CSAT-arbete', 'Förändringsledning'],
    lonespann: '48 000 – 56 000 kr/mån',
    startdatum: '2026-10-01',
    succekriterier: [
      'CSAT över 4,5 inom 6 månader',
      'Sänkt genomsnittlig svarstid till under 2 timmar',
      'Genomförda utvecklingssamtal med hela teamet (8 personer)',
    ],
    kravprofilKomplett: true,
    kriterier: ['Ledarskap', 'Kundfokus', 'Coaching', 'Processförbättring', 'Kommunikation'],
    annonsering: [
      { kanal: 'LinkedIn', kostnad: 14000, visningar: 15600, ansokningar: 14 },
      { kanal: 'Search (rekryteringsbyrå)', kostnad: 25000, visningar: 0, ansokningar: 4 },
      { kanal: 'Karriärsida', kostnad: 0, visningar: 1800, ansokningar: 5 },
      { kanal: 'Arbetsförmedlingen', kostnad: 0, visningar: 4400, ansokningar: 6 },
    ],
    intervjuplan: [
      { namn: 'CV-screening', langd: '—', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Screeningmall Ledare' },
      { namn: 'Telefonintervju', langd: '30 min', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Telefonintervju Ledare' },
      { namn: 'Case (ledarscenario)', langd: '60 min', bedomare: 'Peter Sandell (chef)', scorecard: 'Ledarcase' },
      { namn: 'Slutintervju', langd: '45 min', bedomare: 'Peter Sandell (chef) + HR', scorecard: 'Slutintervju Ledare' },
      { namn: 'Referenser', langd: '3 × 20 min', bedomare: 'Eva Lindqvist (rekryterare)', scorecard: 'Referensmall' },
      { namn: 'Erbjudande', langd: '—', bedomare: 'Peter Sandell (chef)', scorecard: '—' },
    ],
  },
]

export const roleTitle = (roleId: string) =>
  ROLES.find(r => r.id === roleId)?.titel ?? 'Tidigare rekrytering'

// ---------- AI-sourcing: profiler funna "över hela webben" ----------

export const SOURCED_POOL: SourcedProfile[] = [
  {
    id: 's-noa', name: 'Noa Lindqvist', title: 'Senior Backend Engineer', location: 'Stockholm',
    summary: 'Bygger distribuerade Node.js-tjänster i fintech, aktiv open source-bidragare till TypeScript-ekosystemet. Har skalat en betalplattform från 0 till 2 M användare.',
    skills: ['TypeScript', 'Node.js', 'Kafka', 'PostgreSQL', 'AWS', 'Kubernetes'],
    growthSignals: ['Gick från utvecklare till teamlead på 18 mån', 'Talare på Node Congress 2025', 'Underhåller ett npm-paket med 40k veckonedladdningar'],
    fragments: [
      { source: 'GitHub', detail: '58 publika repos, mest TypeScript & Go, 1.2k stjärnor totalt', confidence: 95 },
      { source: 'Konferens', detail: 'Talare "Scaling Event-Driven Systems", Node Congress 2025', confidence: 88 },
      { source: 'LinkedIn', detail: 'Senior Backend @ fintech-scaleup, 6 år erfarenhet', confidence: 82 },
      { source: 'Stack Overflow', detail: '14k rykte, topp 3% inom [node.js] och [kafka]', confidence: 79 },
    ],
    years: 6, openToWork: 72,
    tags: ['backend', 'typescript', 'node.js', 'kafka', 'aws', 'kubernetes', 'postgresql', 'stockholm', 'fintech', 'open source', 'distribuerade system'],
  },
  {
    id: 's-yara', name: 'Yara El-Amin', title: 'Backend Developer', location: 'Göteborg',
    summary: 'Backendutvecklare med djup databaskompetens från högvolyms-e-handel. Brinner för datamodellering och prestandaoptimering.',
    skills: ['Node.js', 'TypeScript', 'PostgreSQL', 'Redis', 'GraphQL'],
    growthSignals: ['Skrev bloggserie om SQL-optimering (30k läsningar)', 'Bytte från Java till Node på eget initiativ'],
    fragments: [
      { source: 'Blogg', detail: 'Teknisk blogg om databasindexering, 30k läsningar/år', confidence: 84 },
      { source: 'GitHub', detail: '23 repos, bidrag till Prisma ORM', confidence: 80 },
      { source: 'LinkedIn', detail: 'Backend @ e-handelsbolag, 5 år', confidence: 76 },
    ],
    years: 5, openToWork: 65,
    tags: ['backend', 'node.js', 'typescript', 'postgresql', 'sql', 'graphql', 'göteborg', 'e-handel', 'databas'],
  },
  {
    id: 's-elias', name: 'Elias Berg', title: 'Fullstack Engineer', location: 'Remote (Malmö)',
    summary: 'Fullstackutvecklare från startup-miljö, van att bygga från noll. Stark på både React och Node, gillar produktnära arbete.',
    skills: ['TypeScript', 'React', 'Node.js', 'tRPC', 'Postgres'],
    growthSignals: ['Grundade ett indie-SaaS med 400 betalande kunder', 'Aktiv i svenska React-communityn'],
    fragments: [
      { source: 'GitHub', detail: '41 repos, egen SaaS-boilerplate med 600 stjärnor', confidence: 90 },
      { source: 'Portfölj', detail: 'Personlig sajt med 6 lanserade sidoprojekt', confidence: 85 },
      { source: 'Meetup', detail: 'Regelbunden deltagare React Meetup Malmö', confidence: 62 },
    ],
    years: 4, openToWork: 80,
    tags: ['backend', 'frontend', 'fullstack', 'typescript', 'react', 'node.js', 'malmö', 'remote', 'startup', 'saas'],
  },
  {
    id: 's-maja', name: 'Maja Fors', title: 'Product Designer', location: 'Stockholm',
    summary: 'UX/Product-designer med starkt systemtänk. Har byggt designsystem från grunden och driver tillgänglighet som hjärtefråga.',
    skills: ['Figma', 'Prototyping', 'Designsystem', 'Tillgänglighet', 'Användartester'],
    growthSignals: ['Föreläser om a11y', 'Byggde designsystem som används av 40 utvecklare'],
    fragments: [
      { source: 'Dribbble', detail: '120 shots, fokus på datatunga gränssnitt', confidence: 86 },
      { source: 'Portfölj', detail: 'Case-studies med mätbar UX-förbättring (+31% NPS)', confidence: 91 },
      { source: 'Konferens', detail: 'Talare "Designsystem som skalar", UX Sthlm 2025', confidence: 78 },
    ],
    years: 7, openToWork: 58,
    tags: ['design', 'ux', 'figma', 'prototyping', 'designsystem', 'tillgänglighet', 'stockholm', 'produktdesign'],
  },
  {
    id: 's-omar', name: 'Omar Haddad', title: 'UX Engineer', location: 'Uppsala',
    summary: 'Hybrid designer/utvecklare som bygger interaktiva prototyper i kod. Bro mellan design och engineering.',
    skills: ['Figma', 'React', 'Framer', 'Prototyping', 'Motion'],
    growthSignals: ['Bytte från frontend till UX engineering', 'Byggde open source-komponentbibliotek'],
    fragments: [
      { source: 'GitHub', detail: 'Komponentbibliotek med 900 stjärnor', confidence: 88 },
      { source: 'Dribbble', detail: '45 shots med interaktiva prototyper', confidence: 74 },
      { source: 'Blogg', detail: 'Skriver om design engineering', confidence: 70 },
    ],
    years: 5, openToWork: 69,
    tags: ['design', 'ux', 'figma', 'react', 'prototyping', 'motion', 'uppsala', 'frontend'],
  },
  {
    id: 's-sara', name: 'Sara Ekström', title: 'Data Engineer', location: 'Stockholm',
    summary: 'Data engineer med bakgrund i ML-infrastruktur. Bygger datapipelines i Python och dbt, van vid stora datamängder.',
    skills: ['Python', 'SQL', 'dbt', 'Airflow', 'Snowflake'],
    growthSignals: ['Publicerade forskningsartikel om feature stores', 'Talare på PyData Stockholm'],
    fragments: [
      { source: 'Forskning', detail: 'Medförfattare, artikel om ML feature stores (94 citeringar)', confidence: 83 },
      { source: 'GitHub', detail: '30 repos, bidrag till dbt-core', confidence: 81 },
      { source: 'Konferens', detail: 'Talare PyData Stockholm 2024', confidence: 77 },
    ],
    years: 6, openToWork: 54,
    tags: ['data', 'python', 'sql', 'dbt', 'airflow', 'snowflake', 'ml', 'stockholm', 'dataanalys'],
  },
  {
    id: 's-johanna', name: 'Johanna Vik', title: 'Analytics Engineer', location: 'Remote (Umeå)',
    summary: 'Analytics engineer som förvandlar rådata till beslutsunderlag. Stark på SQL, dbt och att kommunicera insikter till affären.',
    skills: ['SQL', 'dbt', 'Python', 'Power BI', 'Looker'],
    growthSignals: ['Omskolade sig från ekonom till data', 'Bygger publik dashboard-portfölj'],
    fragments: [
      { source: 'Portfölj', detail: 'Publika dashboards med öppna svenska data', confidence: 79 },
      { source: 'GitHub', detail: '18 repos, dbt-modeller och SQL-övningar', confidence: 72 },
      { source: 'LinkedIn', detail: 'Analytics Engineer @ SaaS-bolag, 4 år', confidence: 75 },
    ],
    years: 4, openToWork: 76,
    tags: ['data', 'sql', 'dbt', 'python', 'power bi', 'looker', 'umeå', 'remote', 'analys', 'ekonomi'],
  },
  {
    id: 's-david', name: 'David Núñez', title: 'Account Executive', location: 'Stockholm',
    summary: 'B2B-säljare med track record inom SaaS. Bygger relationer och stänger stora affärer, van vid komplexa säljcykler.',
    skills: ['B2B-försäljning', 'SaaS', 'CRM', 'Förhandling', 'Pipeline-hantering'],
    growthSignals: ['120% av kvot tre år i rad', 'Byggde upp en ny marknad från noll'],
    fragments: [
      { source: 'LinkedIn', detail: 'Account Executive @ B2B SaaS, 6 år, topp-säljare', confidence: 85 },
      { source: 'Blogg', detail: 'Skriver om moderna säljtekniker', confidence: 66 },
    ],
    years: 6, openToWork: 61,
    tags: ['sälj', 'b2b', 'saas', 'crm', 'account manager', 'account executive', 'stockholm', 'förhandling'],
  },
  {
    id: 's-linnea', name: 'Linnéa Holm', title: 'Customer Success Lead', location: 'Göteborg',
    summary: 'Kundtjänst- och CX-ledare som höjt CSAT och byggt coachande team. Datadriven och van vid Zendesk och NPS-arbete.',
    skills: ['Ledarskap', 'CX', 'Zendesk', 'NPS', 'Coaching'],
    growthSignals: ['Höjde CSAT från 3.8 till 4.6', 'Byggde ett team om 12 från 3'],
    fragments: [
      { source: 'LinkedIn', detail: 'Customer Success Lead, 7 år, team om 12', confidence: 84 },
      { source: 'Konferens', detail: 'Panelist om kundupplevelse, CX Forum 2025', confidence: 71 },
    ],
    years: 7, openToWork: 49,
    tags: ['kundtjänst', 'cx', 'ledarskap', 'zendesk', 'nps', 'coaching', 'göteborg', 'customer success'],
  },
  {
    id: 's-viktor', name: 'Viktor Ahl', title: 'Junior Backend Developer', location: 'Linköping',
    summary: 'Nyexaminerad civilingenjör med stark portfölj av egna Node.js-projekt. Hungrig och snabblärd, söker första fasta rollen.',
    skills: ['TypeScript', 'Node.js', 'Express', 'MongoDB'],
    growthSignals: ['Byggde 8 sidoprojekt under studietiden', 'Vann ett hackathon 2025'],
    fragments: [
      { source: 'GitHub', detail: '34 repos, aktiv commit-historik under 2 år', confidence: 82 },
      { source: 'Portfölj', detail: 'Studentportfölj med 8 projekt', confidence: 73 },
    ],
    years: 1, openToWork: 88,
    tags: ['backend', 'typescript', 'node.js', 'express', 'mongodb', 'linköping', 'junior', 'nyexad'],
  },
]

// ---------- Hjälpare ----------

const ev = (ts: string, actor: string, text: string): TimelineEvent => ({ ts, actor, text })

const sc = (
  stage: StageId, stageLabelStr: string, assessor: string, date: string,
  scores: [string, number][], motivation: string, via: 'röst' | 'foto' | 'text' = 'text',
): Scorecard => ({
  stage, stageLabel: stageLabelStr, assessor, date,
  criteria: scores.map(([name, score]) => ({ name, score })),
  motivation, via,
})

// ---------- Kandidater (27 i pipeline + 5 historiska) ----------

export const CANDIDATES: Candidate[] = [
  // ===== Backend-utvecklare (12) =====
  {
    id: 'c-johan', name: 'Johan Ek', roleId: 'backend', source: 'LinkedIn',
    appliedDate: '2026-05-12', stage: 'anstalld', daysInStage: 3, score: 4.5,
    cvSummary: 'Fullstackutvecklare med 6 års erfarenhet av Node.js och TypeScript på fintech-bolag. Har byggt och driftat mikrotjänster på AWS med hög belastning.',
    email: 'johan.ek@mail.se', phone: '070-123 45 67', gdprConsentUntil: '2027-01-15',
    timeline: [
      ev('2026-05-12 08:14', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-05-13 10:02', 'Eva Lindqvist', 'CV-screening godkänd — uppfyller alla must-have-krav'),
      ev('2026-05-18 14:30', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,4)'),
      ev('2026-06-12 14:32', 'Eva Lindqvist', 'Flyttade kandidat till Teknisk intervju'),
      ev('2026-06-16 13:10', 'Marcus Öhrn', 'Lämnade scorecard via röstmemo (4,6) — svarstid 4 tim'),
      ev('2026-06-22 11:05', 'Marcus Öhrn + Nadia Berg', 'Slutintervju genomförd, scorecard sparad (4,5)'),
      ev('2026-06-24 09:40', 'Eva Lindqvist', 'Referenser klara — två mycket positiva'),
      ev('2026-06-25 16:40', 'Marcus Öhrn', 'Beslut dokumenterat: Johan Ek erbjuds tjänsten'),
      ev('2026-06-26 10:00', 'Eva Lindqvist', 'Erbjudande skickat (58 000 kr/mån, start 2026-09-01)'),
      ev('2026-06-30 15:22', 'Johan Ek', 'Accepterade erbjudandet 🎉'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-05-18',
        [['TypeScript/Node.js', 4], ['Systemdesign', 4], ['SQL & datamodellering', 5], ['Samarbete & kommunikation', 5], ['Problemlösning', 4]],
        'Tydlig kommunikatör med gedigen teknisk grund. Motiverad av produktnära arbete, lönekrav inom spann.'),
      sc('case', 'Teknisk intervju/Case', 'Marcus Öhrn', '2026-06-16',
        [['TypeScript/Node.js', 5], ['Systemdesign', 5], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 4], ['Problemlösning', 5]],
        'Stark på systemdesign, lite tunn på SQL-optimering men lär sig snabbt — klart godkänd för slutintervju.', 'röst'),
      sc('slutintervju', 'Slutintervju', 'Marcus Öhrn + Nadia Berg', '2026-06-22',
        [['TypeScript/Node.js', 5], ['Systemdesign', 4], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 5], ['Problemlösning', 5]],
        'Bäst i processen på samarbete och ägarskap. Nadia bedömer att han lyfter hela teamet. Rekommenderas för erbjudande.'),
    ],
  },
  {
    id: 'c-lisa', name: 'Lisa Bergström', roleId: 'backend', source: 'Referral',
    appliedDate: '2026-05-20', stage: 'slutintervju', daysInStage: 3, score: 4.3,
    cvSummary: 'Backendutvecklare med 5 års erfarenhet från e-handel. Djup kompetens i Node.js, PostgreSQL och eventdriven arkitektur. Rekommenderad av teamlead Nadia Berg.',
    email: 'lisa.bergstrom@mail.se', phone: '070-234 56 78', gdprConsentUntil: '2027-02-01',
    timeline: [
      ev('2026-05-20 12:40', 'System', 'Ansökan mottagen via medarbetarrekommendation (Nadia Berg)'),
      ev('2026-05-22 09:15', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-05-28 11:00', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,2)'),
      ev('2026-06-18 15:45', 'Marcus Öhrn', 'Tekniskt case bedömt, scorecard sparad (4,3) — svarstid 3 tim'),
      ev('2026-06-30 10:20', 'Eva Lindqvist', 'Flyttade kandidat till Slutintervju (bokad 2026-07-06)'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-05-28',
        [['TypeScript/Node.js', 4], ['Systemdesign', 4], ['SQL & datamodellering', 5], ['Samarbete & kommunikation', 4], ['Problemlösning', 4]],
        'Mycket strukturerad. Stark databaskompetens från högvolyms-e-handel. Vill ta mer arkitekturansvar.'),
      sc('case', 'Teknisk intervju/Case', 'Marcus Öhrn', '2026-06-18',
        [['TypeScript/Node.js', 4], ['Systemdesign', 5], ['SQL & datamodellering', 5], ['Samarbete & kommunikation', 4], ['Problemlösning', 4]],
        'Bästa databaslösningen hittills i processen. Något försiktig i diskussionen men mycket genomtänkt.'),
    ],
  },
  {
    id: 'c-amir', name: 'Amir Haddad', roleId: 'backend', source: 'LinkedIn',
    appliedDate: '2026-05-15', stage: 'referenser', daysInStage: 2, score: 4.2,
    cvSummary: 'Systemutvecklare med 7 års erfarenhet, senast på SaaS-bolag inom logistik. Van vid Kubernetes, CI/CD-pipelines och att mentora juniora kollegor.',
    email: 'amir.haddad@mail.se', phone: '070-345 67 89', gdprConsentUntil: '2027-01-20',
    timeline: [
      ev('2026-05-15 17:22', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-05-19 10:05', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-05-26 13:30', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,0)'),
      ev('2026-06-17 16:50', 'Marcus Öhrn', 'Tekniskt case bedömt, scorecard sparad (4,4)'),
      ev('2026-06-26 14:00', 'Marcus Öhrn + Nadia Berg', 'Slutintervju genomförd, scorecard sparad (4,1)'),
      ev('2026-07-01 09:30', 'Eva Lindqvist', 'Flyttade kandidat till Referenser'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-05-26',
        [['TypeScript/Node.js', 4], ['Systemdesign', 4], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 4], ['Problemlösning', 4]],
        'Jämn och erfaren profil. Trivs i mentorsroll, söker mer produktfokus än nuvarande konsultuppdrag.'),
      sc('case', 'Teknisk intervju/Case', 'Marcus Öhrn', '2026-06-17',
        [['TypeScript/Node.js', 4], ['Systemdesign', 5], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 4], ['Problemlösning', 5]],
        'Löste caset snabbast av alla. Mycket stark på drift och observability.', 'foto'),
      sc('slutintervju', 'Slutintervju', 'Marcus Öhrn + Nadia Berg', '2026-06-26',
        [['TypeScript/Node.js', 4], ['Systemdesign', 4], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 4], ['Problemlösning', 4]],
        'Solid genomgående. Något mindre driv i produktdiskussionen än Johan, men mycket trygg teknisk profil.'),
    ],
  },
  {
    id: 'c-erik', name: 'Erik Lund', roleId: 'backend', source: 'Karriärsida',
    appliedDate: '2026-06-02', stage: 'case', daysInStage: 9, score: 4.1,
    cvSummary: 'Backendutvecklare med 4 års erfarenhet från medtech. Noggrann, testdriven och van vid regulatoriska krav. Flyttar till stan i augusti.',
    email: 'erik.lund@mail.se', phone: '070-456 78 90', gdprConsentUntil: '2027-03-01',
    timeline: [
      ev('2026-06-02 09:48', 'System', 'Ansökan mottagen via karriärsidan'),
      ev('2026-06-04 11:20', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-11 10:00', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,1)'),
      ev('2026-06-24 15:10', 'Eva Lindqvist', 'Flyttade kandidat till Case/Teknisk'),
      ev('2026-07-02 11:00', 'System', 'Feedbackförfrågan skickad till Marcus Öhrn — väntar på svar'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-11',
        [['TypeScript/Node.js', 4], ['Systemdesign', 4], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 4], ['Problemlösning', 4]],
        'Metodisk och kvalitetsmedveten. Testdriven på riktigt, inte bara på pappret.'),
    ],
  },
  {
    id: 'c-viktor', name: 'Viktor Öberg', roleId: 'backend', source: 'LinkedIn',
    appliedDate: '2026-06-05', stage: 'case', daysInStage: 5, score: 3.8,
    cvSummary: 'Utvecklare med 3 års erfarenhet från startup-miljö. Bred men något grund profil — snabb, nyfiken och van att bygga från noll.',
    email: 'viktor.oberg@mail.se', phone: '070-567 89 01', gdprConsentUntil: '2027-02-10',
    timeline: [
      ev('2026-06-05 20:31', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-06-09 09:00', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-16 14:00', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (3,8)'),
      ev('2026-06-28 10:15', 'Eva Lindqvist', 'Flyttade kandidat till Case/Teknisk'),
      ev('2026-07-01 15:30', 'System', 'Feedbackförfrågan skickad till Marcus Öhrn — väntar på svar'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-16',
        [['TypeScript/Node.js', 4], ['Systemdesign', 3], ['SQL & datamodellering', 3], ['Samarbete & kommunikation', 4], ['Problemlösning', 5]],
        'Mycket energi och snabbt huvud. Systemdesign behöver prövas i caset — kan vara junior för kravet om 3+ år på djupet.'),
    ],
  },
  {
    id: 'c-maria', name: 'Maria Nilsson', roleId: 'backend', source: 'LinkedIn',
    appliedDate: '2026-06-10', stage: 'intervju', daysInStage: 4, score: 3.9,
    cvSummary: 'Backendutvecklare med 5 års erfarenhet från bank. Stark på SQL och batch-processning, vill växla till modernare stack.',
    email: 'maria.nilsson@mail.se', phone: '070-678 90 12', gdprConsentUntil: '2027-02-20',
    timeline: [
      ev('2026-06-10 07:55', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-06-12 13:40', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-29 11:30', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (3,9)'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-29',
        [['TypeScript/Node.js', 3], ['Systemdesign', 4], ['SQL & datamodellering', 5], ['Samarbete & kommunikation', 4], ['Problemlösning', 4]],
        'Starkast SQL-profil i processen. TypeScript-erfarenheten är begränsad men grunderna sitter.'),
    ],
  },
  {
    id: 'c-oskar', name: 'Oskar Lindgren', roleId: 'backend', source: 'Karriärsida',
    appliedDate: '2026-06-20', stage: 'screening', daysInStage: 6,
    cvSummary: 'Nyexaminerad civilingenjör i datateknik med två somrars praktik på spelbolag. Portfölj med egna Node.js-projekt.',
    email: 'oskar.lindgren@mail.se', phone: '070-789 01 23', gdprConsentUntil: '2027-04-01',
    timeline: [
      ev('2026-06-20 16:12', 'System', 'Ansökan mottagen via karriärsidan'),
      ev('2026-06-27 09:30', 'Eva Lindqvist', 'Flyttade kandidat till Screening'),
    ],
    scorecards: [],
  },
  {
    id: 'c-emma', name: 'Emma Karlsson', roleId: 'backend', source: 'Arbetsförmedlingen',
    appliedDate: '2026-06-22', stage: 'screening', daysInStage: 4,
    cvSummary: 'Utvecklare med 4 års erfarenhet av Java som skolat om sig till Node.js via bootcamp. Söker första renodlade TypeScript-rollen.',
    email: 'emma.karlsson@mail.se', phone: '070-890 12 34', gdprConsentUntil: '2027-03-15',
    timeline: [
      ev('2026-06-22 10:44', 'System', 'Ansökan mottagen via Arbetsförmedlingen'),
      ev('2026-06-29 14:20', 'Eva Lindqvist', 'Flyttade kandidat till Screening'),
    ],
    scorecards: [],
  },
  {
    id: 'c-anders', name: 'Anders Sjöberg', roleId: 'backend', source: 'LinkedIn',
    appliedDate: '2026-06-30', stage: 'nya', daysInStage: 3,
    cvSummary: 'Senior konsult med 9 års erfarenhet inom systemintegration. Söker fast anställning närmare produktutveckling.',
    email: 'anders.sjoberg@mail.se', phone: '070-901 23 45', gdprConsentUntil: '2027-06-30',
    timeline: [ev('2026-06-30 08:05', 'System', 'Ansökan mottagen via LinkedIn')],
    scorecards: [],
  },
  {
    id: 'c-fatima', name: 'Fatima Al-Sayed', roleId: 'backend', source: 'Referral',
    appliedDate: '2026-07-01', stage: 'nya', daysInStage: 2,
    cvSummary: 'Backendutvecklare med 5 års erfarenhet från telekom. Rekommenderad av Johan Ek. Djup Node.js- och Kafka-erfarenhet.',
    email: 'fatima.alsayed@mail.se', phone: '070-012 34 56', gdprConsentUntil: '2027-07-01',
    timeline: [ev('2026-07-01 12:18', 'System', 'Ansökan mottagen via medarbetarrekommendation (Johan Ek)')],
    scorecards: [],
  },
  {
    id: 'c-karl', name: 'Karl Johansson', roleId: 'backend', source: 'Arbetsförmedlingen',
    appliedDate: '2026-05-25', stage: 'avslag', daysInStage: 18,
    cvSummary: 'Frontendutvecklare med 3 års erfarenhet av React. Begränsad backend-erfarenhet.',
    email: 'karl.johansson@mail.se', phone: '070-111 22 33', gdprConsentUntil: '2027-01-25',
    timeline: [
      ev('2026-05-25 14:02', 'System', 'Ansökan mottagen via Arbetsförmedlingen'),
      ev('2026-06-15 10:30', 'Eva Lindqvist', 'Avslag registrerat med orsak: Saknar must-have-kompetens'),
    ],
    scorecards: [],
    rejection: { reason: 'Saknar must-have-kompetens', note: 'Ingen praktisk Node.js- eller SQL-erfarenhet — profilen är renodlad frontend.' },
  },
  {
    id: 'c-hanna', name: 'Hanna Söderberg', roleId: 'backend', source: 'LinkedIn',
    appliedDate: '2026-05-18', stage: 'avslag', daysInStage: 22, score: 4.0,
    cvSummary: 'Senior backendutvecklare med 8 års erfarenhet från storbank. Mycket stark profil.',
    email: 'hanna.soderberg@mail.se', phone: '070-222 33 44', gdprConsentUntil: '2027-01-18',
    timeline: [
      ev('2026-05-18 09:35', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-05-27 13:00', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,0)'),
      ev('2026-06-11 09:12', 'Eva Lindqvist', 'Avslag registrerat med orsak: Lönekrav utanför spann'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-05-27',
        [['TypeScript/Node.js', 4], ['Systemdesign', 4], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 4], ['Problemlösning', 4]],
        'Mycket kompetent, men lönekravet (72 000 kr) ligger 10 000 kr över spannets tak.'),
    ],
    rejection: { reason: 'Lönekrav utanför spann', note: 'Krav 72 000 kr/mån mot spannets tak 62 000 kr. Kandidaten informerad, vill bli kontaktad för seniorroller.' },
  },

  // ===== Ekonomiassistent (9) =====
  {
    id: 'c-elin', name: 'Elin Åkesson', roleId: 'ekonomi', source: 'Referral',
    appliedDate: '2026-06-01', stage: 'case', daysInStage: 4, score: 4.2,
    cvSummary: 'Ekonomiassistent med 4 års erfarenhet från redovisningsbyrå. Dagligt arbete i Fortnox, van vid många parallella kunder.',
    email: 'elin.akesson@mail.se', phone: '070-333 44 55', gdprConsentUntil: '2027-03-01',
    timeline: [
      ev('2026-06-01 08:50', 'System', 'Ansökan mottagen via medarbetarrekommendation'),
      ev('2026-06-03 10:15', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-10 13:00', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,1)'),
      ev('2026-06-29 09:45', 'Eva Lindqvist', 'Flyttade kandidat till Case'),
      ev('2026-06-30 15:20', 'Karin Ahlgren', 'Lämnade casebedömning via foto av anteckningar (4,3) — svarstid 5 tim'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-10',
        [['Bokföring & Fortnox', 5], ['Excel', 4], ['Noggrannhet', 4], ['Kommunikation', 4], ['Självständighet', 4]],
        'Byråvana ger bredd och tempo. Trivs bäst med tydliga rutiner och eget ansvar.'),
      sc('case', 'Case (bokföringsuppgift)', 'Karin Ahlgren', '2026-06-30',
        [['Bokföring & Fortnox', 5], ['Excel', 4], ['Noggrannhet', 5], ['Kommunikation', 4], ['Självständighet', 4]],
        'Felfri avstämning i caset, hittade dessutom den inbyggda kuggfrågan i momsunderlaget. Stark kandidat.', 'foto'),
    ],
  },
  {
    id: 'c-david', name: 'David Persson', roleId: 'ekonomi', source: 'Arbetsförmedlingen',
    appliedDate: '2026-06-08', stage: 'intervju', daysInStage: 5, score: 3.8,
    cvSummary: 'Ekonom med 2 års erfarenhet som ekonomiassistent på byggbolag. Van vid leverantörsreskontra och Fortnox.',
    email: 'david.persson@mail.se', phone: '070-444 55 66', gdprConsentUntil: '2027-03-08',
    timeline: [
      ev('2026-06-08 11:27', 'System', 'Ansökan mottagen via Arbetsförmedlingen'),
      ev('2026-06-10 09:00', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-28 10:30', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (3,8)'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-28',
        [['Bokföring & Fortnox', 4], ['Excel', 3], ['Noggrannhet', 4], ['Kommunikation', 4], ['Självständighet', 4]],
        'Stabil grundprofil. Excel-kunskaperna behöver prövas i caset.'),
    ],
  },
  {
    id: 'c-sofia', name: 'Sofia Blom', roleId: 'ekonomi', source: 'Karriärsida',
    appliedDate: '2026-06-09', stage: 'intervju', daysInStage: 3, score: 4.0,
    cvSummary: 'Ekonomiassistent med 3 års erfarenhet från detaljhandel. Har effektiviserat fakturaflödet med regelstyrd attest.',
    email: 'sofia.blom@mail.se', phone: '070-555 66 77', gdprConsentUntil: '2027-03-09',
    timeline: [
      ev('2026-06-09 15:03', 'System', 'Ansökan mottagen via karriärsidan'),
      ev('2026-06-11 10:40', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-30 14:15', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,0)'),
      ev('2026-07-02 09:00', 'System', 'Feedbackförfrågan skickad till Karin Ahlgren — väntar på svar'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-30',
        [['Bokföring & Fortnox', 4], ['Excel', 4], ['Noggrannhet', 4], ['Kommunikation', 4], ['Självständighet', 4]],
        'Processintresserad och driven — har själv automatiserat återkommande moment.'),
    ],
  },
  {
    id: 'c-mikael', name: 'Mikael Ström', roleId: 'ekonomi', source: 'Arbetsförmedlingen',
    appliedDate: '2026-06-18', stage: 'screening', daysInStage: 7,
    cvSummary: 'Omskolad till ekonomi via YH efter 10 år i logistikbranschen. Praktik på redovisningsbyrå med goda vitsord.',
    email: 'mikael.strom@mail.se', phone: '070-666 77 88', gdprConsentUntil: '2027-04-18',
    timeline: [
      ev('2026-06-18 09:21', 'System', 'Ansökan mottagen via Arbetsförmedlingen'),
      ev('2026-06-26 11:00', 'Eva Lindqvist', 'Flyttade kandidat till Screening'),
    ],
    scorecards: [],
  },
  {
    id: 'c-anna', name: 'Anna Wikström', roleId: 'ekonomi', source: 'LinkedIn',
    appliedDate: '2026-06-24', stage: 'screening', daysInStage: 3,
    cvSummary: 'Ekonomiassistent med 5 års erfarenhet från kommunal verksamhet. Söker sig till privat sektor, stark på avstämningar.',
    email: 'anna.wikstrom@mail.se', phone: '070-777 88 99', gdprConsentUntil: '2027-04-24',
    timeline: [
      ev('2026-06-24 13:37', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-06-30 16:00', 'Eva Lindqvist', 'Flyttade kandidat till Screening'),
    ],
    scorecards: [],
  },
  {
    id: 'c-peterh', name: 'Peter Hedlund', roleId: 'ekonomi', source: 'Karriärsida',
    appliedDate: '2026-07-01', stage: 'nya', daysInStage: 2,
    cvSummary: 'Nyexaminerad ekonom från Handels med sommarjobb på revisionsbyrå. Snabblärd och ambitiös.',
    email: 'peter.hedlund@mail.se', phone: '070-888 99 00', gdprConsentUntil: '2027-07-01',
    timeline: [ev('2026-07-01 10:12', 'System', 'Ansökan mottagen via karriärsidan')],
    scorecards: [],
  },
  {
    id: 'c-julia', name: 'Julia Norén', roleId: 'ekonomi', source: 'LinkedIn',
    appliedDate: '2026-07-02', stage: 'nya', daysInStage: 1,
    cvSummary: 'Ekonomiassistent med 3 års erfarenhet från mediebolag. Fortnox- och Excel-van, intresserad av Power BI.',
    email: 'julia.noren@mail.se', phone: '070-999 00 11', gdprConsentUntil: '2027-07-02',
    timeline: [ev('2026-07-02 08:44', 'System', 'Ansökan mottagen via LinkedIn')],
    scorecards: [],
  },
  {
    id: 'c-gustav', name: 'Gustav Falk', roleId: 'ekonomi', source: 'Arbetsförmedlingen',
    appliedDate: '2026-06-05', stage: 'avslag', daysInStage: 10, score: 3.9,
    cvSummary: 'Ekonomiassistent med 4 års erfarenhet. Fick konkurrerande erbjudande under processen.',
    email: 'gustav.falk@mail.se', phone: '070-121 21 21', gdprConsentUntil: '2027-03-05',
    timeline: [
      ev('2026-06-05 09:58', 'System', 'Ansökan mottagen via Arbetsförmedlingen'),
      ev('2026-06-15 13:30', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (3,9)'),
      ev('2026-06-23 10:05', 'Eva Lindqvist', 'Avslag registrerat med orsak: Tackade nej'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-15',
        [['Bokföring & Fortnox', 4], ['Excel', 4], ['Noggrannhet', 4], ['Kommunikation', 4], ['Självständighet', 3]],
        'Bra profil men signalerade tidigt att en annan process låg före.'),
    ],
    rejection: { reason: 'Tackade nej', note: 'Accepterade konkurrerande erbjudande med kortare pendling. Positiv till framtida kontakt.' },
  },
  {
    id: 'c-linnea', name: 'Linnéa Dahl', roleId: 'ekonomi', source: 'Karriärsida',
    appliedDate: '2026-06-12', stage: 'avslag', daysInStage: 8,
    cvSummary: 'Administratör med 6 års erfarenhet men utan bokföringsvana eller Fortnox-erfarenhet.',
    email: 'linnea.dahl@mail.se', phone: '070-232 32 32', gdprConsentUntil: '2027-03-12',
    timeline: [
      ev('2026-06-12 14:26', 'System', 'Ansökan mottagen via karriärsidan'),
      ev('2026-06-25 11:15', 'Eva Lindqvist', 'Avslag registrerat med orsak: Saknar must-have-kompetens'),
    ],
    scorecards: [],
    rejection: { reason: 'Saknar must-have-kompetens', note: 'Ingen erfarenhet av löpande bokföring eller Fortnox — båda är must-have i kravprofilen.' },
  },

  // ===== Kundtjänstchef (6) =====
  {
    id: 'c-sara', name: 'Sara Holm', roleId: 'kundtjanst', source: 'Search',
    appliedDate: '2026-05-28', stage: 'erbjudande', daysInStage: 6, score: 4.6,
    cvSummary: 'Kundtjänstchef med 6 års ledarerfarenhet från telekom, team om 12 personer. Höjde CSAT från 3,9 till 4,6 på 18 månader.',
    email: 'sara.holm@mail.se', phone: '070-343 43 43', gdprConsentUntil: '2027-02-28',
    timeline: [
      ev('2026-05-28 10:33', 'System', 'Kandidat presenterad via search-partner'),
      ev('2026-06-01 09:20', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-08 14:00', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,5)'),
      ev('2026-06-15 10:30', 'Peter Sandell', 'Ledarcase bedömt, scorecard sparad (4,7)'),
      ev('2026-06-22 15:45', 'Peter Sandell', 'Slutintervju genomförd — scorecard via röstmemo (4,6), svarstid 4 tim'),
      ev('2026-06-25 11:10', 'Eva Lindqvist', 'Referenser klara — tre starka referenser'),
      ev('2026-06-27 09:00', 'Eva Lindqvist', 'Erbjudande skickat (54 000 kr/mån, start 2026-10-01) — giltigt t.o.m. 2026-07-04'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-08',
        [['Ledarskap', 5], ['Kundfokus', 4], ['Coaching', 4], ['Processförbättring', 5], ['Kommunikation', 5]],
        'Imponerande track record med mätbara resultat. Tydlig kring sitt ledarskap.'),
      sc('case', 'Case (ledarscenario)', 'Peter Sandell', '2026-06-15',
        [['Ledarskap', 5], ['Kundfokus', 5], ['Coaching', 4], ['Processförbättring', 5], ['Kommunikation', 4]],
        'Löste konfliktscenariot föredömligt — coachande utan att tappa tempo. Konkret plan för CSAT-arbetet.'),
      sc('slutintervju', 'Slutintervju', 'Peter Sandell', '2026-06-22',
        [['Ledarskap', 5], ['Kundfokus', 5], ['Coaching', 4], ['Processförbättring', 4], ['Kommunikation', 5]],
        'Bästa ledarkandidaten på flera år. Kulturell matchning mycket god. Erbjud omgående.', 'röst'),
    ],
  },
  {
    id: 'c-henrik', name: 'Henrik Borg', roleId: 'kundtjanst', source: 'Referral',
    appliedDate: '2026-06-03', stage: 'intervju', daysInStage: 6, score: 4.0,
    cvSummary: 'Teamledare inom kundservice med 4 års erfarenhet från e-handel. Van vid Zendesk och NPS-uppföljning.',
    email: 'henrik.borg@mail.se', phone: '070-454 54 54', gdprConsentUntil: '2027-03-03',
    timeline: [
      ev('2026-06-03 12:09', 'System', 'Ansökan mottagen via medarbetarrekommendation'),
      ev('2026-06-05 10:25', 'Eva Lindqvist', 'CV-screening godkänd'),
      ev('2026-06-27 13:30', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,0)'),
      ev('2026-07-03 08:15', 'System', 'Feedbackförfrågan skickad till Peter Sandell — väntar på svar'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-27',
        [['Ledarskap', 4], ['Kundfokus', 4], ['Coaching', 4], ['Processförbättring', 4], ['Kommunikation', 4]],
        'Jämn profil, första chefsrollen skulle bli ett kliv — men referenspersonen beskriver honom som en naturlig ledare.'),
    ],
  },
  {
    id: 'c-rebecka', name: 'Rebecka Åström', roleId: 'kundtjanst', source: 'LinkedIn',
    appliedDate: '2026-06-19', stage: 'screening', daysInStage: 5,
    cvSummary: 'Kundtjänstchef med 5 års erfarenhet från försäkringsbolag, team om 15. Söker mindre organisation med kortare beslutsvägar.',
    email: 'rebecka.astrom@mail.se', phone: '070-565 65 65', gdprConsentUntil: '2027-04-19',
    timeline: [
      ev('2026-06-19 16:41', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-06-28 09:10', 'Eva Lindqvist', 'Flyttade kandidat till Screening'),
    ],
    scorecards: [],
  },
  {
    id: 'c-jonas', name: 'Jonas Vikander', roleId: 'kundtjanst', source: 'Arbetsförmedlingen',
    appliedDate: '2026-07-01', stage: 'nya', daysInStage: 2,
    cvSummary: 'Supportchef med 3 års erfarenhet från IT-drift. Datadriven, har byggt upp kunskapsbas och självservice från grunden.',
    email: 'jonas.vikander@mail.se', phone: '070-676 76 76', gdprConsentUntil: '2027-07-01',
    timeline: [ev('2026-07-01 09:27', 'System', 'Ansökan mottagen via Arbetsförmedlingen')],
    scorecards: [],
  },
  {
    id: 'c-camilla', name: 'Camilla Öhman', roleId: 'kundtjanst', source: 'LinkedIn',
    appliedDate: '2026-06-02', stage: 'avslag', daysInStage: 12, score: 3.6,
    cvSummary: 'Kundtjänstchef med 7 års erfarenhet från callcenter-miljö med starkt fokus på volym och pinnstatistik.',
    email: 'camilla.ohman@mail.se', phone: '070-787 87 87', gdprConsentUntil: '2027-03-02',
    timeline: [
      ev('2026-06-02 11:53', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-06-12 14:30', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (3,6)'),
      ev('2026-06-21 10:40', 'Eva Lindqvist', 'Avslag registrerat med orsak: Kulturell matchning'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-12',
        [['Ledarskap', 4], ['Kundfokus', 3], ['Coaching', 3], ['Processförbättring', 4], ['Kommunikation', 4]],
        'Erfaren men styr på volym-KPI:er snarare än kundupplevelse och coachning — motsatt riktning mot kravprofilen.'),
    ],
    rejection: { reason: 'Kulturell matchning', note: 'Pinnstatistik-ledarskap krockar med kravprofilens coachande succékriterier. Transparent återkoppling given.' },
  },
  {
    id: 'c-nils', name: 'Nils Sandberg', roleId: 'kundtjanst', source: 'Karriärsida',
    appliedDate: '2026-06-07', stage: 'avslag', daysInStage: 9, score: 4.1,
    cvSummary: 'CX-ansvarig med 5 års erfarenhet från resebranschen. Stark kandidat som drog sig ur processen.',
    email: 'nils.sandberg@mail.se', phone: '070-898 98 98', gdprConsentUntil: '2027-03-07',
    timeline: [
      ev('2026-06-07 15:36', 'System', 'Ansökan mottagen via karriärsidan'),
      ev('2026-06-16 11:00', 'Eva Lindqvist', 'Telefonintervju genomförd, scorecard sparad (4,1)'),
      ev('2026-06-24 09:20', 'Eva Lindqvist', 'Avslag registrerat med orsak: Tackade nej'),
    ],
    scorecards: [
      sc('intervju', 'Telefonintervju', 'Eva Lindqvist', '2026-06-16',
        [['Ledarskap', 4], ['Kundfokus', 5], ['Coaching', 4], ['Processförbättring', 4], ['Kommunikation', 4]],
        'Mycket kundfokuserad profil. Tveksam till pendlingsavståndet redan i samtalet.'),
    ],
    rejection: { reason: 'Tackade nej', note: 'Drog sig ur på grund av pendlingsavstånd. Vill bli kontaktad om hybridupplägg blir aktuellt.' },
  },

  // ===== Historiska anställningar (Quality of hire) =====
  {
    id: 'h-alexander', name: 'Alexander Roos', roleId: 'historisk', source: 'LinkedIn',
    appliedDate: '2026-01-07', stage: 'anstalld', daysInStage: 160, score: 4.6,
    cvSummary: 'Frontendutvecklare, anställd januari 2026 efter fullständig scorecard-process.',
    email: 'alexander.roos@bolaget.se', phone: '—', gdprConsentUntil: '2028-01-07',
    timeline: [
      ev('2026-01-07 09:00', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-01-26 10:00', 'Eva Lindqvist', 'Anställd som Frontendutvecklare (scorecard-snitt 4,6)'),
      ev('2026-06-28 14:00', 'Marcus Öhrn', '6-månadersutvärdering registrerad: 4,8 — kopplad till ursprunglig scorecard'),
    ],
    scorecards: [
      sc('case', 'Tekniskt case Frontend', 'Marcus Öhrn', '2026-01-16',
        [['React/TypeScript', 5], ['UI-arkitektur', 5], ['Tillgänglighet', 4], ['Samarbete & kommunikation', 4], ['Problemlösning', 5]],
        'Utmärkt case med genomtänkt komponentdesign. Anställdes — och 6-månadersutfallet bekräftade bedömningen.'),
    ],
    historical: {
      roleLabel: 'Frontendutvecklare', hiredDate: '2026-01-26', originalScore: 4.6,
      sixMonthRating: 4.8, retention: 'Kvar',
      managerComment: 'Överträffar förväntningarna — driver nu designsystemet självständigt.',
    },
  },
  {
    id: 'h-ida', name: 'Ida Månsson', roleId: 'historisk', source: 'Referral',
    appliedDate: '2026-01-12', stage: 'anstalld', daysInStage: 155, score: 4.3,
    cvSummary: 'Redovisningsekonom, anställd februari 2026 via medarbetarrekommendation.',
    email: 'ida.mansson@bolaget.se', phone: '—', gdprConsentUntil: '2028-01-12',
    timeline: [
      ev('2026-01-12 11:00', 'System', 'Ansökan mottagen via medarbetarrekommendation'),
      ev('2026-02-02 10:00', 'Eva Lindqvist', 'Anställd som Redovisningsekonom (scorecard-snitt 4,3)'),
      ev('2026-06-30 10:30', 'Karin Ahlgren', '6-månadersutvärdering registrerad: 4,5 — kopplad till ursprunglig scorecard'),
    ],
    scorecards: [
      sc('case', 'Case Redovisning', 'Karin Ahlgren', '2026-01-22',
        [['Redovisning', 5], ['Excel', 4], ['Noggrannhet', 4], ['Kommunikation', 4], ['Självständighet', 4]],
        'Mycket stark i bokslutscaset. Anställdes — presterar i nivå med bedömningen.'),
    ],
    historical: {
      roleLabel: 'Redovisningsekonom', hiredDate: '2026-02-02', originalScore: 4.3,
      sixMonthRating: 4.5, retention: 'Kvar',
      managerComment: 'Tog över månadsbokslutet redan efter tre månader.',
    },
  },
  {
    id: 'h-frida', name: 'Frida Lindahl', roleId: 'historisk', source: 'Karriärsida',
    appliedDate: '2026-01-05', stage: 'anstalld', daysInStage: 162, score: 4.4,
    cvSummary: 'Kundtjänstmedarbetare, anställd januari 2026 via karriärsidan.',
    email: 'frida.lindahl@bolaget.se', phone: '—', gdprConsentUntil: '2028-01-05',
    timeline: [
      ev('2026-01-05 08:30', 'System', 'Ansökan mottagen via karriärsidan'),
      ev('2026-01-19 10:00', 'Eva Lindqvist', 'Anställd som Kundtjänstmedarbetare (scorecard-snitt 4,4)'),
      ev('2026-06-25 09:15', 'Peter Sandell', '6-månadersutvärdering registrerad: 4,2 — kopplad till ursprunglig scorecard'),
    ],
    scorecards: [
      sc('intervju', 'Intervju Kundtjänst', 'Peter Sandell', '2026-01-14',
        [['Kundfokus', 5], ['Kommunikation', 5], ['Stresstålighet', 4], ['Samarbete', 4], ['Systemvana', 4]],
        'Värme och skärpa i kombination. Anställdes — högst CSAT i teamet efter 6 månader.'),
    ],
    historical: {
      roleLabel: 'Kundtjänstmedarbetare', hiredDate: '2026-01-19', originalScore: 4.4,
      sixMonthRating: 4.2, retention: 'Kvar',
      managerComment: 'Högst CSAT i teamet. Kandidat till teamlead-spåret.',
    },
  },
  {
    id: 'h-martin', name: 'Martin Kask', roleId: 'historisk', source: 'Arbetsförmedlingen',
    appliedDate: '2026-01-09', stage: 'anstalld', daysInStage: 158, score: 3.6,
    cvSummary: 'Backendutvecklare, anställd februari 2026 trots scorecard under riktvärdet — tidspress i teamet avgjorde.',
    email: 'martin.kask@bolaget.se', phone: '—', gdprConsentUntil: '2028-01-09',
    timeline: [
      ev('2026-01-09 13:20', 'System', 'Ansökan mottagen via Arbetsförmedlingen'),
      ev('2026-02-09 10:00', 'Eva Lindqvist', 'Anställd som Backendutvecklare (scorecard-snitt 3,6 — under riktvärde 4,2)'),
      ev('2026-06-20 16:00', 'Marcus Öhrn', '6-månadersutvärdering registrerad: 3,1 — kopplad till ursprunglig scorecard'),
      ev('2026-06-26 10:00', 'System', 'Anställningen avslutad på egen begäran'),
    ],
    scorecards: [
      sc('case', 'Tekniskt case Backend', 'Marcus Öhrn', '2026-01-28',
        [['TypeScript/Node.js', 4], ['Systemdesign', 3], ['SQL & datamodellering', 4], ['Samarbete & kommunikation', 3], ['Problemlösning', 4]],
        'Godkänt men tveksamheter kring samarbete och design. Anställdes under tidspress — utfallet bekräftade tveksamheterna.'),
    ],
    historical: {
      roleLabel: 'Backendutvecklare', hiredDate: '2026-02-09', originalScore: 3.6,
      sixMonthRating: 3.1, retention: 'Slutat',
      managerComment: 'Lärdomen: gå inte under scorecard-riktvärdet ens under tidspress.',
    },
  },
  {
    id: 'h-tove', name: 'Tove Berglund', roleId: 'historisk', source: 'LinkedIn',
    appliedDate: '2026-01-15', stage: 'anstalld', daysInStage: 152, score: 4.5,
    cvSummary: 'Projektledare, anställd februari 2026 efter strukturerad trestegs­process.',
    email: 'tove.berglund@bolaget.se', phone: '—', gdprConsentUntil: '2028-01-15',
    timeline: [
      ev('2026-01-15 10:10', 'System', 'Ansökan mottagen via LinkedIn'),
      ev('2026-02-05 10:00', 'Eva Lindqvist', 'Anställd som Projektledare (scorecard-snitt 4,5)'),
      ev('2026-07-01 13:45', 'Peter Sandell', '6-månadersutvärdering registrerad: 4,6 — kopplad till ursprunglig scorecard'),
    ],
    scorecards: [
      sc('case', 'Ledarcase Projekt', 'Peter Sandell', '2026-01-27',
        [['Planering', 5], ['Intressenthantering', 4], ['Kommunikation', 5], ['Riskhantering', 4], ['Leveransfokus', 5]],
        'Tydligast plan av alla kandidater. Anställdes — levererar över förväntan.'),
    ],
    historical: {
      roleLabel: 'Projektledare', hiredDate: '2026-02-05', originalScore: 4.5,
      sixMonthRating: 4.6, retention: 'Kvar',
      managerComment: 'Landade två strategiska projekt i tid under första halvåret.',
    },
  },
]

// ---------- Feedback ----------

export const FEEDBACK_REQUESTS: FeedbackRequest[] = [
  {
    id: 'f-johan-case', candidateId: 'c-johan', stageLabel: 'Teknisk intervju/Case', till: 'Marcus Öhrn',
    sentAt: '2026-06-16 09:00', respondedAt: '2026-06-16 13:10', status: 'besvarad',
    channel: 'röst', responseTime: '4 tim 10 min',
    voice: {
      duration: '0:42',
      quote: 'Stark på systemdesign, lite tunn på SQL-optimering men lär sig snabbt — klart godkänd för slutintervju.',
    },
  },
  {
    id: 'f-lisa-case', candidateId: 'c-lisa', stageLabel: 'Teknisk intervju/Case', till: 'Marcus Öhrn',
    sentAt: '2026-06-18 12:30', respondedAt: '2026-06-18 15:45', status: 'besvarad',
    channel: 'text', responseTime: '3 tim 15 min',
  },
  {
    id: 'f-johan-slut', candidateId: 'c-johan', stageLabel: 'Slutintervju', till: 'Marcus Öhrn + Nadia Berg',
    sentAt: '2026-06-22 09:00', respondedAt: '2026-06-22 11:05', status: 'besvarad',
    channel: 'text', responseTime: '2 tim 5 min',
  },
  {
    id: 'f-elin-case', candidateId: 'c-elin', stageLabel: 'Case (bokföringsuppgift)', till: 'Karin Ahlgren',
    sentAt: '2026-06-30 10:00', respondedAt: '2026-06-30 15:20', status: 'besvarad',
    channel: 'foto', responseTime: '5 tim 20 min',
  },
  {
    id: 'f-sara-slut', candidateId: 'c-sara', stageLabel: 'Slutintervju', till: 'Peter Sandell',
    sentAt: '2026-06-22 11:30', respondedAt: '2026-06-22 15:45', status: 'besvarad',
    channel: 'röst', responseTime: '4 tim 15 min',
    voice: {
      duration: '0:38',
      quote: 'Bästa ledarkandidaten på flera år. Kulturell matchning mycket god. Erbjud omgående.',
    },
  },
  {
    id: 'f-erik-case', candidateId: 'c-erik', stageLabel: 'Teknisk intervju/Case', till: 'Marcus Öhrn',
    sentAt: '2026-07-02 11:00', status: 'väntande',
  },
  {
    id: 'f-viktor-case', candidateId: 'c-viktor', stageLabel: 'Teknisk intervju/Case', till: 'Marcus Öhrn',
    sentAt: '2026-07-01 15:30', status: 'väntande',
  },
  {
    id: 'f-sofia-int', candidateId: 'c-sofia', stageLabel: 'Nästa steg: Case', till: 'Karin Ahlgren',
    sentAt: '2026-07-02 09:00', status: 'väntande',
  },
  {
    id: 'f-henrik-int', candidateId: 'c-henrik', stageLabel: 'Nästa steg: Ledarcase', till: 'Peter Sandell',
    sentAt: '2026-07-03 08:15', status: 'väntande',
  },
]

// ---------- Erbjudanden ----------

export const OFFERS: Offer[] = [
  {
    id: 'o-johan', candidateId: 'c-johan', sentDate: '2026-06-26', expiryDate: '2026-07-03',
    status: 'accepterat', lon: '58 000 kr/mån', startDate: '2026-09-01', acceptedDate: '2026-06-30',
  },
  {
    id: 'o-sara', candidateId: 'c-sara', sentDate: '2026-06-27', expiryDate: '2026-07-04',
    status: 'väntar', lon: '54 000 kr/mån', startDate: '2026-10-01',
  },
]

// ---------- Notiser ----------

export const NOTIFICATIONS: Notification[] = [
  { id: 'n1', text: 'Marcus Öhrn lämnade feedback på Johan Ek via röstmemo', time: 'för 2 tim sedan', to: '/feedback' },
  { id: 'n2', text: 'Erbjudandet till Sara Holm går ut imorgon (2026-07-04)', time: 'för 4 tim sedan', to: '/erbjudanden' },
  { id: 'n3', text: '3 nya ansökningar har kommit in denna vecka', time: 'igår', to: '/kandidater' },
]

// ---------- Analys ----------

export const FUNNELS: Record<string, { steg: string; antal: number }[]> = {
  backend: [
    { steg: 'Ansökningar', antal: 48 },
    { steg: 'Screening', antal: 18 },
    { steg: 'Intervju', antal: 8 },
    { steg: 'Erbjudande', antal: 2 },
    { steg: 'Anställd', antal: 1 },
  ],
  ekonomi: [
    { steg: 'Ansökningar', antal: 39 },
    { steg: 'Screening', antal: 14 },
    { steg: 'Intervju', antal: 6 },
    { steg: 'Erbjudande', antal: 0 },
    { steg: 'Anställd', antal: 0 },
  ],
  kundtjanst: [
    { steg: 'Ansökningar', antal: 29 },
    { steg: 'Screening', antal: 10 },
    { steg: 'Intervju', antal: 5 },
    { steg: 'Erbjudande', antal: 1 },
    { steg: 'Anställd', antal: 0 },
  ],
}

export const TIME_IN_STAGE = [
  { steg: 'Screening', dagar: 2 },
  { steg: 'Telefonintervju', dagar: 3 },
  { steg: 'Case/Teknisk', dagar: 9, flaskhals: true },
  { steg: 'Slutintervju', dagar: 4 },
  { steg: 'Referenser', dagar: 3 },
  { steg: 'Erbjudande', dagar: 2 },
]

export const SOURCE_ECONOMY = [
  { kanal: 'LinkedIn', anstallda: 8, kostnad: 96000 },
  { kanal: 'Referral', anstallda: 5, kostnad: 25000 },
  { kanal: 'Arbetsförmedlingen', anstallda: 3, kostnad: 0 },
  { kanal: 'Karriärsida', anstallda: 2, kostnad: 12000 },
  { kanal: 'Search', anstallda: 2, kostnad: 90000 },
]

export const SOURCE_OF_HIRE = [
  { label: 'LinkedIn', value: 40, color: '#2563EB' },
  { label: 'Referral', value: 25, color: '#1F5C46' },
  { label: 'Arbetsförmedlingen', value: 15, color: '#7C9C8E' },
  { label: 'Karriärsida', value: 12, color: '#A7C4B5' },
  { label: 'Search', value: 8, color: '#CBD5D0' },
]

// ---------- Datapipeline: nod-metadata ----------

export interface PipelineNode {
  id: string
  label: string
  desc: string
  fields: string[]
  to: string
}

export const PIPELINE_SOURCES: PipelineNode[] = [
  {
    id: 'rekryterare', label: 'Rekryterare',
    desc: 'Skapar stegförflyttningar, screeningbeslut och avslagsorsaker',
    fields: ['stegförflyttning', 'tidsstämpel & aktör', 'avslagsorsak', 'screeningbeslut'],
    to: '/kandidater',
  },
  {
    id: 'ansokningar', label: 'Ansökningar',
    desc: 'Kandidatens egna data vid ansökan',
    fields: ['CV & personligt brev', 'kontaktuppgifter', 'källkanal', 'GDPR-samtycke'],
    to: '/kandidater/c-johan?tab=oversikt',
  },
  {
    id: 'chefer', label: 'Chefer',
    desc: 'Scorecards och intervjufeedback — via röst, foto eller text',
    fields: ['scorecard (1–5 per kriterium)', 'intervjuanteckning', 'bedömare', 'svarstid'],
    to: '/feedback',
  },
  {
    id: 'jobbannonser', label: 'Jobbannonser',
    desc: 'Kanaldata från annonsering',
    fields: ['kanal & kostnad', 'visningar', 'ansökningar per kanal', 'kostnad/ansökan'],
    to: '/roller/backend?tab=annonsering',
  },
  {
    id: 'tester', label: 'Tester & referenser',
    desc: 'Strukturerade bedömningar mot kravprofilen',
    fields: ['case-resultat', 'referensomdöme', 'kriteriepoäng', 'motivering'],
    to: '/kandidater/c-johan?tab=bedomningar',
  },
]

export const PIPELINE_INSIGHTS: PipelineNode[] = [
  {
    id: 'dashboard', label: 'Dashboard',
    desc: 'KPI:er i realtid ur ren, strukturerad data',
    fields: ['time-to-hire', 'cost-per-hire', 'feedback-svarstid', 'acceptansgrad'],
    to: '/',
  },
  {
    id: 'beslutsunderlag', label: 'Beslutsunderlag',
    desc: 'Jämförbara scorecards → dokumenterade beslut',
    fields: ['kandidatjämförelse', 'radardiagram', 'beslutsmotivering', 'signaturer'],
    to: '/erbjudanden',
  },
  {
    id: 'larande', label: 'Lärande / Quality of hire',
    desc: 'Utfall efter 6 mån kopplas till ursprunglig bedömning',
    fields: ['6-månadersbetyg', 'retention', 'scorecard-korrelation', 'kanal-ROI'],
    to: '/analys?scroll=qoh#qoh',
  },
]

export const PIPE_NODE: PipelineNode = {
  id: 'roret', label: 'Samla in → Strukturera & tvätta → Lagra',
  desc: 'Datamodellen: fält, format och gallringsregler',
  fields: ['normaliserade fält', 'valideringsregler', 'gallringsregler (GDPR)', 'versionshistorik'],
  to: '/installningar?panel=datamodell',
}

// ---------- "Data som skapas här" per skärm ----------

export const DATA_BADGES: { prefix: string; skapas: string[] }[] = [
  { prefix: '/planering', skapas: ['headcount-mål per avdelning & roll', 'löne- & rekryteringsbudget', 'delegering till rekryterare', 'what-if-scenarier', 'Excel/CSV-import (bort från Excel)'] },
  { prefix: '/sourcing', skapas: ['sammanslagna webbprofiler (GitHub/portfölj/forskning)', 'confidence per fält', 'matchpoäng mot kravprofil', 'källa: AI-sourcing vid sparning'] },
  { prefix: '/ledningsfragor', skapas: ['inga — board-ready svar konsumeras ur pipelinen'] },
  { prefix: '/roller', skapas: ['kravprofil (must-have, meriterande)', 'succékriterier', 'lönespann & startdatum', 'intervjuplan & scorecard-mallar', 'kanalkostnader'] },
  { prefix: '/kandidater', skapas: ['stegförflyttning', 'tidsstämpel & aktör', 'avslagsorsak (obligatorisk)', 'källkanal', 'GDPR-samtycke'] },
  { prefix: '/feedback', skapas: ['scorecard', 'intervjuanteckning', 'bedömare', 'tidsstämpel', 'svarstid'] },
  { prefix: '/erbjudanden', skapas: ['erbjudandestatus', 'lön & startdatum', 'beslutsmotivering', 'signaturer (chef + rekryterare)'] },
  { prefix: '/analys', skapas: ['6-månadersutvärdering', 'retention-status', 'inga övriga — här konsumeras data'] },
  { prefix: '/datapipeline', skapas: ['inga — detta är kartan över var all data bor'] },
  { prefix: '/installningar', skapas: ['datamodell', 'gallringsregler', 'behörigheter'] },
  { prefix: '/', skapas: ['inga — här konsumeras data (KPI:er, trender, åtgärdslistor)'] },
]
