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

export type Source = 'LinkedIn' | 'Referral' | 'Arbetsförmedlingen' | 'Karriärsida' | 'Search'

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

export interface Notification {
  id: string
  text: string
  time: string
  to: string
}
