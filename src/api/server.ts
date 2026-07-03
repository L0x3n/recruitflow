// In-memory-"backend". ENDA stället appens state bor och muteras.
// UI:t når hit uteslutande via api-fasaden (./index.ts) — så kan mocken
// bytas mot riktiga API:er (SmartRecruiters/Teamtailor-form) utan UI-ändringar.

import {
  CANDIDATES, FEEDBACK_REQUESTS, HEADHUNT_CANDIDATES, HEADHUNT_LINKS, OFFERS, OUTREACH_THREADS,
  PLAN_ROWS_2026, ROLES, SEQUENCES, SOURCED_POOL, USERS, roleTitle, stageLabel,
} from '../data'
import { matchProfile } from '../sourcing'
import type {
  AppSettings, AuditEvent, Candidate, FeedbackRequest, HeadhuntLink, Offer, OutreachThread, PlanRow, Profile, Role,
  Scenario, Scorecard, ScorecardCriterion, StageId, TeamMember, User, WarningAck, WorkforcePlan,
} from '../types'

export interface NewRoleInput {
  titel: string
  chef: string
  chefTitel: string
  lonespann: string
  startdatum: string
  mustHave: string[]
  meriterande: string[]
  succekriterier: string[]
}

interface DB {
  users: User[]
  currentUserId: string | null
  candidates: Candidate[]
  roles: Role[]
  feedback: FeedbackRequest[]
  offers: Offer[]
  team: TeamMember[]
  plan: WorkforcePlan
  scenarios: Scenario[]
  warningAcks: WarningAck[]
  savedSourced: string[]
  threads: OutreachThread[]
  headhuntLinks: HeadhuntLink[]
  audit: AuditEvent[]
  auditSeq: number
  settings: AppSettings
}

export interface Snapshot {
  users: User[]
  currentUser: User | null
  candidates: Candidate[]
  roles: Role[]
  feedback: FeedbackRequest[]
  offers: Offer[]
  team: TeamMember[]
  plan: WorkforcePlan
  scenarios: Scenario[]
  warningAcks: WarningAck[]
  savedSourced: string[]
  threads: OutreachThread[]
  headhuntLinks: HeadhuntLink[]
  audit: AuditEvent[]
  settings: AppSettings
}

export const nowTs = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}
export const todayIso = () => nowTs().slice(0, 10)

export const db: DB = {
  users: USERS,
  currentUserId: null,
  candidates: [...CANDIDATES, ...HEADHUNT_CANDIDATES],
  roles: ROLES,
  feedback: FEEDBACK_REQUESTS,
  offers: OFFERS,
  team: [
    { name: 'Marcus Öhrn', title: 'Utvecklingschef · bedömare' },
    { name: 'Karin Ahlgren', title: 'Ekonomichef · bedömare' },
    { name: 'Peter Sandell', title: 'COO · bedömare' },
    { name: 'Nadia Berg', title: 'Teamlead · bedömare' },
    { name: 'Sofia Renberg', title: 'Rekryterare' },
  ],
  plan: { id: 'plan-2026', namn: 'Årsplan 2026', ar: 2026, rows: PLAN_ROWS_2026 },
  scenarios: [],
  warningAcks: [],
  savedSourced: [],
  threads: OUTREACH_THREADS,
  headhuntLinks: HEADHUNT_LINKS,
  audit: [],
  auditSeq: 0,
  settings: { apiFel: false },
}

const actor = () => db.users.find(u => u.id === db.currentUserId)?.name ?? 'System'

export function logAudit(action: string, details: string) {
  db.audit = [...db.audit, { id: ++db.auditSeq, ts: nowTs(), actor: actor(), action, details }]
}

export function snapshot(): Snapshot {
  return {
    users: [...db.users],
    currentUser: db.users.find(u => u.id === db.currentUserId) ?? null,
    candidates: [...db.candidates],
    roles: [...db.roles],
    feedback: [...db.feedback],
    offers: [...db.offers],
    team: [...db.team],
    plan: { ...db.plan, rows: [...db.plan.rows] },
    scenarios: [...db.scenarios],
    warningAcks: [...db.warningAcks],
    savedSourced: [...db.savedSourced],
    threads: db.threads.map(t => ({ ...t, messages: [...t.messages] })),
    headhuntLinks: [...db.headhuntLinks],
    audit: [...db.audit],
    settings: { ...db.settings },
  }
}

// ---------- Auth ----------

export function login(userId: string) {
  const user = db.users.find(u => u.id === userId)
  if (!user) throw new Error('Okänt konto')
  db.currentUserId = userId
  logAudit('Inloggning', `${user.name} (${user.roleLabel}) loggade in`)
}

export function logout() {
  logAudit('Utloggning', `${actor()} loggade ut`)
  db.currentUserId = null
}

// ---------- Kandidater ----------

export function moveCandidate(id: string, stage: StageId) {
  db.candidates = db.candidates.map(c => {
    if (c.id !== id || c.stage === stage) return c
    return {
      ...c, stage, daysInStage: 0,
      timeline: [...c.timeline, { ts: nowTs(), actor: actor(), text: `Flyttade kandidat till ${stageLabel(stage)}` }],
    }
  })
  const cand = db.candidates.find(c => c.id === id)
  logAudit('Stegförflyttning', `${cand?.name} → ${stageLabel(stage)}`)
}

export function rejectCandidate(id: string, reason: string, note: string) {
  db.candidates = db.candidates.map(c => c.id === id
    ? {
        ...c, stage: 'avslag' as StageId, daysInStage: 0,
        rejection: { reason, note: note || undefined },
        timeline: [...c.timeline, { ts: nowTs(), actor: actor(), text: `Avslag registrerat med orsak: ${reason}` }],
      }
    : c)
  const cand = db.candidates.find(c => c.id === id)
  logAudit('Avslag', `${cand?.name} — orsak: ${reason}`)
}

// ---------- Feedback ----------

const responseTimeFrom = (sentAt: string) => {
  const t0 = new Date(sentAt.replace(' ', 'T')).getTime()
  if (Number.isNaN(t0)) return '1 tim'
  const h = Math.max(1, Math.round((Date.now() - t0) / 3_600_000))
  return h < 48 ? `${h} tim` : `${Math.round(h / 24)} dagar`
}

const avgOf = (scorecards: Scorecard[]) => {
  const all = scorecards.flatMap(s => s.criteria.map(c => c.score))
  return all.length ? Math.round((all.reduce((a, b) => a + b, 0) / all.length) * 10) / 10 : undefined
}

const stageFromLabel = (label: string): StageId =>
  /slutintervju/i.test(label) ? 'slutintervju'
    : /case|teknisk|ledarcase|arbetsprov/i.test(label) ? 'case'
    : 'intervju'

export function answerFeedback(
  requestId: string,
  channel: 'röst' | 'foto' | 'text',
  criteria: ScorecardCriterion[],
  motivation: string,
  voiceDuration?: string,
) {
  const req = db.feedback.find(f => f.id === requestId)
  if (!req || req.status === 'besvarad') return
  const ts = nowTs()

  db.feedback = db.feedback.map(f => f.id === requestId
    ? {
        ...f, status: 'besvarad' as const, respondedAt: ts, channel,
        responseTime: responseTimeFrom(f.sentAt),
        voice: channel === 'röst' ? { duration: voiceDuration ?? '0:30', quote: motivation } : f.voice,
      }
    : f)

  db.candidates = db.candidates.map(c => {
    if (c.id !== req.candidateId) return c
    const card: Scorecard = {
      stage: stageFromLabel(req.stageLabel),
      stageLabel: req.stageLabel.replace(/^Nästa steg: /, ''),
      assessor: req.till,
      date: ts.slice(0, 10),
      criteria,
      motivation,
      via: channel,
    }
    const scorecards = [...c.scorecards, card]
    const cardAvg = criteria.reduce((a, b) => a + b.score, 0) / criteria.length
    const viaLabel = channel === 'röst' ? 'röstmemo' : channel === 'foto' ? 'foto av anteckningar' : 'text'
    return {
      ...c, scorecards, score: avgOf(scorecards),
      timeline: [...c.timeline, {
        ts, actor: req.till,
        text: `Lämnade scorecard via ${viaLabel} (${cardAvg.toFixed(1).replace('.', ',')}) — svarstid ${responseTimeFrom(req.sentAt)}`,
      }],
    }
  })
  const cand = db.candidates.find(c => c.id === req.candidateId)
  logAudit('Feedback besvarad', `${req.till} → ${cand?.name} via ${channel}`)
}

const addTimeline = (candidateId: string, text: string) => {
  db.candidates = db.candidates.map(c => c.id === candidateId
    ? { ...c, timeline: [...c.timeline, { ts: nowTs(), actor: actor(), text }] }
    : c)
}

export function remindFeedback(requestId: string) {
  const req = db.feedback.find(f => f.id === requestId)
  if (!req) return
  db.feedback = db.feedback.map(f => f.id === requestId ? { ...f, remindedAt: nowTs() } : f)
  addTimeline(req.candidateId, `Påminnelse om feedback skickad till ${req.till}`)
  logAudit('Påminnelse', `Feedback-påminnelse till ${req.till}`)
}

export function remindOffer(offerId: string) {
  const offer = db.offers.find(o => o.id === offerId)
  if (!offer) return
  db.offers = db.offers.map(o => o.id === offerId ? { ...o, remindedAt: nowTs() } : o)
  addTimeline(offer.candidateId, 'Påminnelse om erbjudandet skickad till kandidaten')
  const cand = db.candidates.find(c => c.id === offer.candidateId)
  logAudit('Påminnelse', `Erbjudande-påminnelse till ${cand?.name}`)
}

// ---------- Roller ----------

const slugify = (s: string) =>
  s.toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function addRole(input: NewRoleInput): string {
  let id = slugify(input.titel) || 'roll'
  while (db.roles.some(r => r.id === id)) id = `${id}-2`
  const rekryterare = actor()
  const role: Role = {
    id,
    titel: input.titel,
    status: 'aktiv',
    chef: input.chef,
    chefTitel: input.chefTitel || 'Rekryterande chef',
    mustHave: input.mustHave,
    meriterande: input.meriterande,
    lonespann: input.lonespann || 'ej satt',
    startdatum: input.startdatum || 'ej satt',
    succekriterier: input.succekriterier,
    kravprofilKomplett: input.succekriterier.length > 0 && input.mustHave.length > 0,
    kriterier: ['Fackkompetens', 'Erfarenhet', 'Samarbete & kommunikation', 'Problemlösning', 'Motivation & driv'],
    annonsering: [
      { kanal: 'LinkedIn', kostnad: 0, visningar: 0, ansokningar: 0 },
      { kanal: 'Arbetsförmedlingen', kostnad: 0, visningar: 0, ansokningar: 0 },
      { kanal: 'Karriärsida', kostnad: 0, visningar: 0, ansokningar: 0 },
    ],
    intervjuplan: [
      { namn: 'CV-screening', langd: '—', bedomare: `${rekryterare} (rekryterare)`, scorecard: `Screeningmall ${input.titel}` },
      { namn: 'Telefonintervju', langd: '30 min', bedomare: `${rekryterare} (rekryterare)`, scorecard: `Telefonintervju ${input.titel}` },
      { namn: 'Case/Arbetsprov', langd: '60 min', bedomare: `${input.chef} (chef)`, scorecard: `Case ${input.titel}` },
      { namn: 'Slutintervju', langd: '45 min', bedomare: `${input.chef} (chef) + HR`, scorecard: `Slutintervju ${input.titel}` },
      { namn: 'Referenser', langd: '2 × 20 min', bedomare: `${rekryterare} (rekryterare)`, scorecard: 'Referensmall' },
      { namn: 'Erbjudande', langd: '—', bedomare: `${input.chef} (chef)`, scorecard: '—' },
    ],
  }
  db.roles = [...db.roles, role]
  if (!db.team.some(m => m.name === input.chef)) {
    db.team = [...db.team, { name: input.chef, title: `${input.chefTitel || 'Rekryterande chef'} · bedömare` }]
  }
  logAudit('Roll skapad', `${input.titel} (chef: ${input.chef})`)
  return id
}

// ---------- AI-sourcing ----------

export function saveSourcedToPipeline(profileId: string, roleId: string): string | null {
  const p = SOURCED_POOL.find(x => x.id === profileId)
  const role = db.roles.find(r => r.id === roleId)
  if (!p || !role) return null
  if (db.candidates.some(c => c.id === `src-${p.id}`)) return `src-${p.id}`

  const ts = nowTs()
  const match = matchProfile(p, role)
  const cand: Candidate = {
    id: `src-${p.id}`,
    name: p.name,
    roleId,
    source: 'AI-sourcing',
    appliedDate: ts.slice(0, 10),
    stage: 'nya',
    daysInStage: 0,
    score: Math.round((match.score / 20) * 10) / 10, // 0–99 → ~0–5
    cvSummary: p.summary,
    email: `${p.name.toLowerCase().replace(/[^a-zåäö]/g, '.').replace(/\.+/g, '.')}@sourcad.demo`,
    phone: '—',
    gdprConsentUntil: '2027-12-31',
    timeline: [
      { ts, actor: 'AI-sourcing', text: `Profil funnen över webben (${p.fragments.map(f => f.source).join(', ')}) och sammanslagen automatiskt` },
      { ts, actor: actor(), text: `Sparad till ${roleTitle(roleId)} — matchpoäng ${match.score}% mot kravprofilen` },
    ],
    scorecards: [],
  }
  db.candidates = [...db.candidates, cand]
  db.savedSourced = [...db.savedSourced, p.id]
  logAudit('AI-sourcing', `${p.name} sparad till ${roleTitle(roleId)} (match ${match.score}%)`)
  return cand.id
}

// ---------- Headhunt-länkar ----------

const slugName = (name: string) =>
  name.split(' ')[0].toLowerCase().replace(/[åä]/g, 'a').replace(/ö/g, 'o').replace(/[^a-z]/g, '')

export function createHeadhuntLink(roleId: string): string {
  const recruiter = actor()
  const rand = Math.random().toString(36).slice(2, 6)
  const id = `${slugName(recruiter)}-${rand}`
  db.headhuntLinks = [...db.headhuntLinks, { id, recruiter, roleId, created: todayIso(), clicks: 0 }]
  logAudit('Headhunt-länk skapad', `${id} → ${roleTitle(roleId)}`)
  return id
}

export function registerHeadhuntClick(linkId: string) {
  db.headhuntLinks = db.headhuntLinks.map(l => l.id === linkId ? { ...l, clicks: l.clicks + 1 } : l)
}

export function applyViaHeadhunt(linkId: string, roleId: string, name: string, note: string): string | null {
  const link = db.headhuntLinks.find(l => l.id === linkId)
  const effectiveRole = link?.roleId ?? roleId
  if (!db.roles.some(r => r.id === effectiveRole)) return null
  const ts = nowTs()
  const id = `hh-${Date.now()}`
  const cand: Candidate = {
    id, name: name.trim() || 'Anonym sökande', roleId: effectiveRole, source: 'Headhunt',
    appliedDate: ts.slice(0, 10), stage: 'nya', daysInStage: 0,
    cvSummary: note.trim() || 'Sökte via en headhunt-länk. Ingen ytterligare info angiven ännu.',
    email: `${slugName(name || 'sokande')}@mail.se`, phone: '—', gdprConsentUntil: '2027-12-31',
    headhuntLinkId: link ? linkId : undefined,
    timeline: [{ ts, actor: 'System', text: link ? `Ansökan via headhunt-länk (${linkId}, ${link.recruiter})` : 'Ansökan via publik jobbsida' }],
    scorecards: [],
  }
  db.candidates = [...db.candidates, cand]
  logAudit('Headhunt-ansökan', `${cand.name} → ${roleTitle(effectiveRole)}${link ? ` (via ${link.recruiter})` : ''}`)
  return id
}

// ---------- Outreach + joint inbox ----------

let msgSeq = 100
const fillTemplate = (tpl: string, name: string, roleTitel: string, skill: string) =>
  tpl.replace(/\{namn\}/g, name.split(' ')[0]).replace(/\{roll\}/g, roleTitel).replace(/\{skill\}/g, skill)

const skillOf = (roleId: string, sourcedId?: string, candidateId?: string): string => {
  if (sourcedId) {
    const p = SOURCED_POOL.find(x => x.id === sourcedId)
    if (p?.skills.length) return p.skills[0]
  }
  const role = db.roles.find(r => r.id === roleId)
  return role?.mustHave[0] ?? 'din bakgrund'
}

export function sendMessage(threadId: string, text: string) {
  const thread = db.threads.find(t => t.id === threadId)
  if (!thread || !text.trim()) return
  const ts = nowTs()
  const msg = { id: `m${++msgSeq}`, from: 'rekryterare' as const, author: actor(), ts, channel: thread.channel, text: text.trim() }
  db.threads = db.threads.map(t => t.id === threadId
    ? { ...t, messages: [...t.messages, msg], status: 'väntar' as const, lastActivity: ts }
    : t)
  if (thread.candidateId) addTimeline(thread.candidateId, `Outreach-meddelande skickat via ${thread.channel}`)
  logAudit('Outreach', `Meddelande till ${thread.candidateName} (${thread.channel})`)
}

export function advanceSequence(threadId: string) {
  const thread = db.threads.find(t => t.id === threadId)
  if (!thread) return
  const seq = SEQUENCES.find(s => s.id === thread.sequenceId)
  if (!seq || thread.sequenceStep >= seq.steps.length) return
  const step = seq.steps[thread.sequenceStep]
  const roleTitel = roleTitle(thread.roleId)
  const skill = skillOf(thread.roleId, thread.sourcedId, thread.candidateId)
  const ts = nowTs()
  const msg = {
    id: `m${++msgSeq}`, from: 'rekryterare' as const, author: actor(), ts, channel: step.kanal,
    text: fillTemplate(step.mall, thread.candidateName, roleTitel, skill),
  }
  db.threads = db.threads.map(t => t.id === threadId
    ? { ...t, messages: [...t.messages, msg], status: 'väntar' as const, sequenceStep: t.sequenceStep + 1, channel: step.kanal, lastActivity: ts }
    : t)
  if (thread.candidateId) addTimeline(thread.candidateId, `Sekvenssteg ${thread.sequenceStep + 1} skickat (${step.kanal})`)
  logAudit('Outreach', `Sekvenssteg ${thread.sequenceStep + 1} → ${thread.candidateName}`)
}

export function enrollSequence(opts: { candidateId?: string; sourcedId?: string; roleId: string; sequenceId: string }): string | null {
  const seq = SEQUENCES.find(s => s.id === opts.sequenceId)
  if (!seq) return null
  let name = 'Kandidat'
  if (opts.candidateId) name = db.candidates.find(c => c.id === opts.candidateId)?.name ?? name
  else if (opts.sourcedId) name = SOURCED_POOL.find(p => p.id === opts.sourcedId)?.name ?? name
  const existing = db.threads.find(t =>
    (opts.candidateId && t.candidateId === opts.candidateId) || (opts.sourcedId && t.sourcedId === opts.sourcedId))
  if (existing) return existing.id

  const id = `t-${opts.candidateId ?? opts.sourcedId ?? Date.now()}`
  const step = seq.steps[0]
  const ts = nowTs()
  const skill = skillOf(opts.roleId, opts.sourcedId, opts.candidateId)
  const thread: OutreachThread = {
    id, candidateName: name, candidateId: opts.candidateId, sourcedId: opts.sourcedId, roleId: opts.roleId,
    channel: step.kanal, status: 'väntar', sequenceId: opts.sequenceId, sequenceStep: 1, lastActivity: ts,
    messages: [{
      id: `m${++msgSeq}`, from: 'rekryterare', author: actor(), ts, channel: step.kanal,
      text: fillTemplate(step.mall, name, roleTitle(opts.roleId), skill),
    }],
  }
  db.threads = [...db.threads, thread]
  if (opts.candidateId) addTimeline(opts.candidateId, `Outreach-sekvens "${seq.namn}" startad`)
  logAudit('Outreach', `Sekvens "${seq.namn}" startad för ${name}`)
  return id
}

export function moveFromThread(threadId: string, stage: StageId) {
  const thread = db.threads.find(t => t.id === threadId)
  if (!thread || !thread.candidateId) return
  moveCandidate(thread.candidateId, stage)
  const ts = nowTs()
  const msg = { id: `m${++msgSeq}`, from: 'system' as const, author: 'System', ts, channel: thread.channel, text: `Kandidaten flyttad till ${stageLabel(stage)} direkt från inkorgen.` }
  db.threads = db.threads.map(t => t.id === threadId ? { ...t, messages: [...t.messages, msg], lastActivity: ts } : t)
}

// ---------- Användare & team ----------

export function updateProfile(p: Profile) {
  db.users = db.users.map(u => u.id === db.currentUserId ? { ...u, ...p } : u)
  logAudit('Profil uppdaterad', p.name)
}

export function addMember(m: TeamMember) {
  db.team = [...db.team, m]
  logAudit('Teammedlem tillagd', `${m.name} (${m.title})`)
}

// ---------- Workforce planning ----------

export function updatePlanRow(rowId: string, patch: Partial<PlanRow>) {
  db.plan = { ...db.plan, rows: db.plan.rows.map(r => r.id === rowId ? { ...r, ...patch } : r) }
  const row = db.plan.rows.find(r => r.id === rowId)
  logAudit('Planrad uppdaterad', `${row?.rollTitel}: ${Object.keys(patch).join(', ')}`)
}

export function addPlanRows(rows: Omit<PlanRow, 'id'>[]) {
  let seq = db.plan.rows.length
  const withIds = rows.map(r => ({ ...r, id: `p-import-${++seq}-${slugify(r.rollTitel)}` }))
  db.plan = { ...db.plan, rows: [...db.plan.rows, ...withIds] }
  logAudit('Planrader importerade', `${rows.length} rader (CSV-import)`)
  return withIds.length
}

export function deletePlanRow(rowId: string) {
  const row = db.plan.rows.find(r => r.id === rowId)
  db.plan = { ...db.plan, rows: db.plan.rows.filter(r => r.id !== rowId) }
  logAudit('Planrad borttagen', row?.rollTitel ?? rowId)
}

export function createScenario(namn: string): string {
  const id = `sc-${db.scenarios.length + 1}`
  db.scenarios = [...db.scenarios, {
    id, namn, skapad: nowTs(),
    rows: db.plan.rows.map(r => ({ ...r, id: `${id}-${r.id}` })),
  }]
  logAudit('Scenario skapat', namn)
  return id
}

export function updateScenarioRow(scenarioId: string, rowId: string, patch: Partial<PlanRow>) {
  db.scenarios = db.scenarios.map(s => s.id === scenarioId
    ? { ...s, rows: s.rows.map(r => r.id === rowId ? { ...r, ...patch } : r) }
    : s)
}

export function deleteScenario(scenarioId: string) {
  const sc = db.scenarios.find(s => s.id === scenarioId)
  db.scenarios = db.scenarios.filter(s => s.id !== scenarioId)
  logAudit('Scenario raderat', sc?.namn ?? scenarioId)
}

export function ackWarning(warningId: string, comment: string) {
  if (db.warningAcks.some(a => a.id === warningId)) return
  db.warningAcks = [...db.warningAcks, { id: warningId, by: actor(), ts: nowTs(), comment: comment || undefined }]
  logAudit('Varning kvitterad', `${warningId}${comment ? ` — ${comment}` : ''}`)
}

// ---------- Inställningar ----------

export function setSetting<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
  db.settings = { ...db.settings, [key]: value }
  logAudit('Inställning ändrad', `${key} = ${String(value)}`)
}
