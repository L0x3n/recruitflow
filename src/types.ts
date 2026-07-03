// Löst typad så att nya roller kan skapas i appen ('backend', 'ekonomi', … + dynamiska id:n)
export type RoleId = string

export type StageId =
  | 'nya'
  | 'screening'
  | 'intervju'
  | 'case'
  | 'slutintervju'
  | 'referenser'
  | 'erbjudande'
  | 'anstalld'
  | 'avslag'

export type Source = 'LinkedIn' | 'Referral' | 'Arbetsförmedlingen' | 'Karriärsida' | 'Search' | 'AI-sourcing' | 'Headhunt'

export interface TimelineEvent {
  ts: string
  actor: string
  text: string
}

export interface ScorecardCriterion {
  name: string
  score: number // 1–5
}

export interface Scorecard {
  stage: StageId
  stageLabel: string
  assessor: string
  date: string
  criteria: ScorecardCriterion[]
  motivation: string
  via: 'röst' | 'foto' | 'text'
}

export interface HistoricalOutcome {
  roleLabel: string
  hiredDate: string
  originalScore: number
  sixMonthRating: number
  retention: 'Kvar' | 'Slutat'
  managerComment: string
}

export interface Candidate {
  id: string
  name: string
  roleId: RoleId
  source: Source
  appliedDate: string
  stage: StageId
  daysInStage: number
  score?: number
  cvSummary: string
  email: string
  phone: string
  gdprConsentUntil: string
  timeline: TimelineEvent[]
  scorecards: Scorecard[]
  rejection?: { reason: string; note?: string }
  historical?: HistoricalOutcome
  headhuntLinkId?: string // attribution om ansökan kom via en headhunt-länk
}

export interface HeadhuntLink {
  id: string // t.ex. 'eva-k7x2'
  recruiter: string
  roleId: string
  created: string
  clicks: number
}

// ---------- Fas 6: karriärsida ----------

export type BlockType = 'hero' | 'about' | 'benefits' | 'jobs' | 'quote'

export interface CareerBlock {
  id: string
  type: BlockType
  enabled: boolean
  title?: string
  text?: string
  items?: string[]
  author?: string
}

export interface CareerPage {
  accent: string
  companyName: string
  tagline: string
  blocks: CareerBlock[]
  published: boolean
}

// ---------- Fas 6: triggers & nurture ----------

export type TriggerAction = 'mail' | 'feedback' | 'nurture' | 'todo'

export interface TriggerRule {
  id: string
  when: StageId
  action: TriggerAction
  detail: string // mall/ämne/beskrivning
  active: boolean
  firedCount: number
}

export interface NurtureCampaign {
  id: string
  namn: string
  audience: string
  medlemmar: number
  utskick: number
  oppningar: number
  aktiv: boolean
}

// ---------- Fas 7: requisitions, offers, compliance, marketplace ----------

export type ApprovalRole = 'chef' | 'ekonomi' | 'ledning'
export type ApprovalStatus = 'väntar' | 'godkänd' | 'avslagen'

export interface ApprovalStep {
  role: ApprovalRole
  approver: string
  status: ApprovalStatus
  comment?: string
  ts?: string
}

export interface Requisition {
  id: string
  rollTitel: string
  avdelning: string
  planRowId?: string
  lonebudget: number
  antal: number
  motivering: string
  requestedBy: string
  created: string
  steps: ApprovalStep[]
  status: 'under godkännande' | 'godkänd' | 'avslagen'
}

export interface OfferDraft {
  id: string
  candidateId: string
  roleId: string
  lon: number
  startDate: string
  status: 'utkast' | 'skickat' | 'signerat'
  sentDate?: string
  signature?: string // dataURL av ritad signatur
  signedDate?: string
}

export interface Integration {
  id: string
  namn: string
  ikon: string
  kategori: string
  connected: boolean
}


export interface AdChannel {
  kanal: string
  kostnad: number
  visningar: number
  ansokningar: number
}

export interface InterviewStage {
  namn: string
  langd: string
  bedomare: string
  scorecard: string
}

export interface Role {
  id: RoleId
  titel: string
  status: 'aktiv'
  chef: string
  chefTitel: string
  mustHave: string[]
  meriterande: string[]
  lonespann: string
  startdatum: string
  succekriterier: string[]
  kravprofilKomplett: boolean
  kriterier: string[] // scorecard criteria rows
  annonsering: AdChannel[]
  intervjuplan: InterviewStage[]
}

export interface FeedbackRequest {
  id: string
  candidateId: string
  stageLabel: string
  till: string // manager
  sentAt: string
  respondedAt?: string
  status: 'väntande' | 'besvarad'
  channel?: 'röst' | 'foto' | 'text'
  responseTime?: string
  voice?: { duration: string; quote: string }
  remindedAt?: string
}

export interface Offer {
  id: string
  candidateId: string
  sentDate: string
  expiryDate: string
  status: 'accepterat' | 'väntar'
  lon: string
  startDate: string
  acceptedDate?: string
  remindedAt?: string
}

export interface Profile {
  name: string
  title: string
  email: string
  notiser: string
}

export interface TeamMember {
  name: string
  title: string
}

// ---------- Fas 0–2: användare, WFP, varningar, audit ----------

export type RoleName = 'ledning' | 'chef' | 'rekryterare'

export interface User extends Profile {
  id: string
  role: RoleName
  roleLabel: string // "Ledningsgrupp" / "Rekryterande chef" / "Rekryterare"
}

export interface PlanRow {
  id: string
  avdelning: string
  rollTitel: string
  koppladRollId?: string // koppling till aktiv rekrytering
  antal: number
  kompetenser: string[]
  lonebudget: number // kr/mån per person
  rekrbudget: number // kr totalt för raden
  malKvartal: string // 'Q3 2026'
  malStart: string // ISO-datum
  ansvarig: string // rekryterare (namn) — '' = ej delegerad
  prioritet: 'hög' | 'normal'
}

export interface WorkforcePlan {
  id: string
  namn: string
  ar: number
  rows: PlanRow[]
}

export interface Scenario {
  id: string
  namn: string
  skapad: string
  rows: PlanRow[]
}

export type WarningRule = 'tackning' | 'inaktivitet' | 'prognos' | 'budget' | 'ejstartad'

export interface PlanWarning {
  id: string // stabil: `${rule}-${rowId}`
  rule: WarningRule
  severity: 'hög' | 'medel'
  text: string
  rowId: string
  ansvarig: string
}

export interface WarningAck {
  id: string // varnings-id
  by: string
  ts: string
  comment?: string
}

export interface AuditEvent {
  id: number
  ts: string
  actor: string
  action: string
  details: string
}

export interface AppSettings {
  apiFel: boolean
}

// ---------- Fas 3: AI-sourcing (Talentium-stil) ----------

export type FragmentSource =
  | 'GitHub' | 'Portfölj' | 'Konferens' | 'Forskning' | 'LinkedIn' | 'Blogg' | 'Stack Overflow' | 'Meetup' | 'Dribbble'

export interface ProfileFragment {
  source: FragmentSource
  detail: string
  confidence: number // 0–100
}

export interface SourcedProfile {
  id: string
  name: string
  title: string
  location: string
  summary: string
  skills: string[]
  growthSignals: string[]
  fragments: ProfileFragment[]
  years: number
  openToWork: number // 0–100 sannolikhet att vara öppen för nytt
  tags: string[] // fritt sökbara nyckelord (stack, domän, ort)
}

export interface MatchContribution {
  label: string
  delta: number // +/- poängbidrag
  reason: string
}

export interface MatchResult {
  score: number // 0–100
  contributions: MatchContribution[]
}

// ---------- Fas 4: Outreach + joint inbox ----------

export type OutreachChannel = 'mail' | 'linkedin' | 'sms'

export interface OutreachMessage {
  id: string
  from: 'rekryterare' | 'kandidat' | 'system'
  author: string
  ts: string
  text: string
  channel: OutreachChannel
  opened?: boolean
}

export interface OutreachThread {
  id: string
  candidateName: string
  candidateId?: string // om i pipeline
  sourcedId?: string // om från sourcad pool
  roleId: string
  channel: OutreachChannel
  status: 'sekvens' | 'väntar' | 'svarade'
  sequenceId: string
  sequenceStep: number // hur många steg som skickats
  messages: OutreachMessage[]
  lastActivity: string
}

export interface SequenceStep {
  dag: number
  kanal: OutreachChannel
  amne: string
  mall: string // {namn} {roll} {skill} ersätts
}

export interface SequenceTemplate {
  id: string
  namn: string
  steps: SequenceStep[]
}

export interface Notification {
  id: string
  text: string
  time: string
  to: string
}
