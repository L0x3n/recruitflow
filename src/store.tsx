import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { api, snapshot, todayIso } from './api'
import type { NewRoleInput, Snapshot } from './api'
import { computePlan, evaluateWarnings } from './planning'
import type { RowStatus } from './planning'
import type {
  AppSettings, PlanRow, PlanWarning, Profile, ScorecardCriterion, StageId, TeamMember, User,
} from './types'

export interface TourStep {
  route: string
  selector: string
  title: string
  text: string
  openRejectDemo?: boolean
}

export const TOUR_STEPS: TourStep[] = [
  {
    route: '/roller/backend?tab=kravprofil', selector: 'kravprofil',
    title: '1. Kravprofilen', text: 'Allt börjar med en strukturerad kravprofil — den blir måttstocken som varje bedömning i hela processen mäts mot.',
  },
  {
    route: '/roller/backend?tab=annonsering', selector: 'annonsering',
    title: '2. Annonsering', text: 'Varje kanal mäts: kostnad per ansökan syns direkt. Inga magkänslo-beslut om var annonsen ska ligga.',
  },
  {
    route: '/kandidater', selector: 'kanban',
    title: '3. Ett enda flöde', text: 'Alla kandidater i ett flöde — inga Excel-listor. Varje kort bär sin källa, sitt steg och sin poäng.',
  },
  {
    route: '/kandidater', selector: 'reject-modal',
    title: '4. Inget tyst avslag', text: 'Inget avslag utan loggad orsak. Modalen går inte att stänga utan att välja — därför finns datan alltid kvar.',
    openRejectDemo: true,
  },
  {
    route: '/feedback', selector: 'voice-memo',
    title: '5. Läckan är stängd', text: 'Chefen svarar via röst på 30 sekunder — utan login. Röstmemot struktureras automatiskt till en scorecard.',
  },
  {
    route: '/erbjudanden', selector: 'beslut',
    title: '6. Försvarbart beslut', text: 'Jämförbara scorecards mot samma kriterier → dokumenterat, försvarbart beslut med signaturer och tidsstämpel.',
  },
  {
    route: '/analys?scroll=qoh', selector: 'qoh',
    title: '7. Loopen sluts', text: 'Utfallet efter 6 månader kopplas tillbaka till urvalet — nu vet ni vilka bedömningar som förutsäger prestation.',
  },
  {
    route: '/datapipeline', selector: 'pipeline-map',
    title: '8. Hela kartan', text: 'Hela flödet på en karta — klicka på valfri nod för att se exakt var datan bor i appen.',
  },
]

// ---------- RBAC ----------

export type Permission =
  | 'operate'        // flytta kandidater, svara feedback, skapa roller, outreach
  | 'wfp.view'       // se hela planen
  | 'wfp.viewOwn'    // se sina egna planrader
  | 'wfp.edit'       // redigera budget/mål/delegering, importera, scenarier
  | 'warnings.ack'   // kvittera varningar
  | 'exec.view'      // ledningsstatistik
  | 'audit.view'     // händelselogg

const PERMS: Record<User['role'], Permission[]> = {
  ledning: ['exec.view', 'wfp.view', 'audit.view'],
  chef: ['exec.view', 'wfp.view', 'wfp.edit', 'warnings.ack', 'operate', 'audit.view'],
  rekryterare: ['operate', 'wfp.viewOwn'],
}

interface Toast { id: number; text: string; error?: boolean }

interface Store {
  // snapshot-data
  candidates: Snapshot['candidates']
  roles: Snapshot['roles']
  feedback: Snapshot['feedback']
  offers: Snapshot['offers']
  team: TeamMember[]
  users: User[]
  currentUser: User | null
  plan: Snapshot['plan']
  scenarios: Snapshot['scenarios']
  warningAcks: Snapshot['warningAcks']
  savedSourced: Snapshot['savedSourced']
  threads: Snapshot['threads']
  headhuntLinks: Snapshot['headhuntLinks']
  audit: Snapshot['audit']
  settings: AppSettings
  // härlett
  byId: (id: string) => Snapshot['candidates'][number] | undefined
  roleTitleOf: (roleId: string) => string
  profile: Profile
  can: (p: Permission) => boolean
  planStatuses: RowStatus[]
  warnings: PlanWarning[]
  // auth
  login: (userId: string) => Promise<void>
  logout: () => Promise<void>
  // actions
  moveCandidate: (id: string, stage: StageId) => void
  rejectTarget: string | null
  requestReject: (id: string) => void
  confirmReject: (reason: string, note: string) => void
  cancelReject: () => void
  answerFeedback: (requestId: string, channel: 'röst' | 'foto' | 'text', criteria: ScorecardCriterion[], motivation: string, voiceDuration?: string) => void
  remindFeedback: (requestId: string) => void
  remindOffer: (offerId: string) => void
  addRole: (input: NewRoleInput) => Promise<string | null>
  saveSourced: (profileId: string, roleId: string) => Promise<string | null>
  sendMessage: (threadId: string, text: string) => void
  advanceSequence: (threadId: string) => void
  enrollSequence: (opts: { candidateId?: string; sourcedId?: string; roleId: string; sequenceId: string }) => Promise<string | null>
  moveFromThread: (threadId: string, stage: StageId) => void
  createHeadhuntLink: (roleId: string) => Promise<string | null>
  registerHeadhuntClick: (linkId: string) => void
  applyViaHeadhunt: (linkId: string, roleId: string, name: string, note: string) => Promise<string | null>
  updateProfile: (p: Profile) => void
  addMember: (m: TeamMember) => void
  // WFP
  updatePlanRow: (rowId: string, patch: Partial<PlanRow>) => void
  addPlanRows: (rows: Omit<PlanRow, 'id'>[]) => Promise<number | null>
  deletePlanRow: (rowId: string) => void
  createScenario: (namn: string) => void
  updateScenarioRow: (scenarioId: string, rowId: string, patch: Partial<PlanRow>) => void
  deleteScenario: (scenarioId: string) => void
  ackWarning: (warningId: string, comment: string) => void
  setSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void
  // UI
  toasts: Toast[]
  toast: (text: string) => void
  tourStep: number | null
  startTour: () => void
  setTourStep: (n: number | null) => void
}

const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [snap, setSnap] = useState<Snapshot>(() => snapshot())
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [tourStep, setTourStep] = useState<number | null>(null)
  const toastId = useRef(0)

  const pushToast = useCallback((text: string, error = false) => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, text, error }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), error ? 5000 : 3500)
  }, [])

  const toast = useCallback((text: string) => pushToast(text), [pushToast])

  // Kör en API-mutation: latens → uppdatera snapshot → ev. success-toast; fel → fel-toast.
  const run = useCallback(async <T,>(fn: () => Promise<T>, successToast?: string): Promise<T | null> => {
    try {
      const result = await fn()
      setSnap(snapshot())
      if (successToast) pushToast(successToast)
      return result
    } catch (e) {
      setSnap(snapshot())
      pushToast(`⚠ ${e instanceof Error ? e.message : 'Okänt fel'} — ändringen sparades inte`, true)
      return null
    }
  }, [pushToast])

  // ---- härlett ----
  const byId = useCallback((id: string) => snap.candidates.find(c => c.id === id), [snap.candidates])
  const roleTitleOf = useCallback(
    (roleId: string) => snap.roles.find(r => r.id === roleId)?.titel ?? 'Tidigare rekrytering',
    [snap.roles],
  )
  const can = useCallback(
    (p: Permission) => !!snap.currentUser && PERMS[snap.currentUser.role].includes(p),
    [snap.currentUser],
  )
  const profile: Profile = snap.currentUser ?? { name: '—', title: '', email: '', notiser: '' }

  const planStatuses = useMemo(
    () => computePlan(snap.plan.rows, snap.candidates, snap.roles, snap.offers, todayIso()),
    [snap.plan.rows, snap.candidates, snap.roles, snap.offers],
  )
  const warnings = useMemo(
    () => evaluateWarnings(planStatuses, snap.candidates, todayIso()),
    [planStatuses, snap.candidates],
  )

  // ---- auth ----
  const login = useCallback(async (userId: string) => { await run(() => api.auth.login(userId)) }, [run])
  const logout = useCallback(async () => { setTourStep(null); await run(() => api.auth.logout()) }, [run])

  // ---- actions ----
  const moveCandidate = useCallback((id: string, stage: StageId) => {
    void run(() => api.candidates.move(id, stage))
  }, [run])

  const requestReject = useCallback((id: string) => setRejectTarget(id), [])
  const cancelReject = useCallback(() => setRejectTarget(null), [])
  const confirmReject = useCallback((reason: string, note: string) => {
    setRejectTarget(target => {
      if (target && target !== 'demo') {
        void run(() => api.candidates.reject(target, reason, note), 'Avslag loggat med orsak — datan finns kvar i pipelinen')
      }
      return null
    })
  }, [run])

  const answerFeedback = useCallback((requestId: string, channel: 'röst' | 'foto' | 'text', criteria: ScorecardCriterion[], motivation: string, voiceDuration?: string) => {
    void run(() => api.feedback.answer(requestId, channel, criteria, motivation, voiceDuration),
      'Feedback sparad — strukturerad och kopplad till kandidat, roll och steg')
  }, [run])

  const remindFeedback = useCallback((requestId: string) => {
    const req = snap.feedback.find(f => f.id === requestId)
    void run(() => api.feedback.remind(requestId), `Påminnelse skickad till ${req?.till}`)
  }, [run, snap.feedback])

  const remindOffer = useCallback((offerId: string) => {
    const offer = snap.offers.find(o => o.id === offerId)
    const cand = offer && snap.candidates.find(c => c.id === offer.candidateId)
    void run(() => api.offers.remind(offerId), `Påminnelse skickad till ${cand?.name ?? 'kandidaten'}`)
  }, [run, snap.offers, snap.candidates])

  const addRole = useCallback(async (input: NewRoleInput) =>
    run(() => api.postings.create(input), `Rollen "${input.titel}" skapad — kravprofilen är måttstocken`),
  [run])

  const saveSourced = useCallback(async (profileId: string, roleId: string) =>
    run(() => api.sourcing.saveToPipeline(profileId, roleId), 'Profil sparad till pipelinen — källa: AI-sourcing'),
  [run])

  const sendMessage = useCallback((threadId: string, text: string) => {
    void run(() => api.outreach.send(threadId, text), 'Meddelande skickat')
  }, [run])
  const advanceSequence = useCallback((threadId: string) => {
    void run(() => api.outreach.advance(threadId), 'Nästa sekvenssteg skickat')
  }, [run])
  const enrollSequence = useCallback(async (opts: { candidateId?: string; sourcedId?: string; roleId: string; sequenceId: string }) =>
    run(() => api.outreach.enroll(opts), 'Outreach-sekvens startad'),
  [run])
  const moveFromThread = useCallback((threadId: string, stage: StageId) => {
    void run(() => api.outreach.moveFromThread(threadId, stage), 'Kandidaten flyttad direkt från inkorgen')
  }, [run])

  const createHeadhuntLink = useCallback(async (roleId: string) =>
    run(() => api.headhunt.createLink(roleId), 'Headhunt-länk skapad — sprid den och spåra vem du fångar'),
  [run])
  const registerHeadhuntClick = useCallback((linkId: string) => {
    void api.headhunt.registerClick(linkId).then(() => setSnap(snapshot()))
  }, [])
  const applyViaHeadhunt = useCallback(async (linkId: string, roleId: string, name: string, note: string) =>
    run(() => api.headhunt.apply(linkId, roleId, name, note)),
  [run])

  const updateProfile = useCallback((p: Profile) => {
    void run(() => api.users.updateProfile(p), 'Profil uppdaterad')
  }, [run])

  const addMember = useCallback((m: TeamMember) => {
    void run(() => api.users.addMember(m), `${m.name} tillagd i teamet`)
  }, [run])

  // ---- WFP ----
  const updatePlanRow = useCallback((rowId: string, patch: Partial<PlanRow>) => {
    void run(() => api.wfp.updateRow(rowId, patch))
  }, [run])
  const addPlanRows = useCallback(async (rows: Omit<PlanRow, 'id'>[]) =>
    run(() => api.wfp.addRows(rows), `${rows.length} planrader importerade — Excel-filen kan pensioneras`),
  [run])
  const deletePlanRow = useCallback((rowId: string) => {
    void run(() => api.wfp.deleteRow(rowId), 'Planrad borttagen')
  }, [run])
  const createScenario = useCallback((namn: string) => {
    void run(() => api.wfp.createScenario(namn), `Scenario "${namn}" skapat`)
  }, [run])
  const updateScenarioRow = useCallback((scenarioId: string, rowId: string, patch: Partial<PlanRow>) => {
    void run(() => api.wfp.updateScenarioRow(scenarioId, rowId, patch))
  }, [run])
  const deleteScenario = useCallback((scenarioId: string) => {
    void run(() => api.wfp.deleteScenario(scenarioId), 'Scenario raderat')
  }, [run])
  const ackWarning = useCallback((warningId: string, comment: string) => {
    void run(() => api.wfp.ackWarning(warningId, comment), 'Varning kvitterad — loggad i händelseloggen')
  }, [run])
  const setSetting = useCallback(<K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
    void run(() => api.settings.set(key, value))
  }, [run])

  const startTour = useCallback(() => setTourStep(0), [])

  const value = useMemo<Store>(() => ({
    candidates: snap.candidates, roles: snap.roles, feedback: snap.feedback, offers: snap.offers,
    team: snap.team, users: snap.users, currentUser: snap.currentUser,
    plan: snap.plan, scenarios: snap.scenarios, warningAcks: snap.warningAcks,
    savedSourced: snap.savedSourced, threads: snap.threads, headhuntLinks: snap.headhuntLinks,
    audit: snap.audit, settings: snap.settings,
    byId, roleTitleOf, profile, can, planStatuses, warnings,
    login, logout,
    moveCandidate, rejectTarget, requestReject, confirmReject, cancelReject,
    answerFeedback, remindFeedback, remindOffer, addRole, saveSourced,
    sendMessage, advanceSequence, enrollSequence, moveFromThread,
    createHeadhuntLink, registerHeadhuntClick, applyViaHeadhunt, updateProfile, addMember,
    updatePlanRow, addPlanRows, deletePlanRow, createScenario, updateScenarioRow, deleteScenario,
    ackWarning, setSetting,
    toasts, toast, tourStep, startTour, setTourStep,
  }), [
    snap, byId, roleTitleOf, profile, can, planStatuses, warnings, login, logout,
    moveCandidate, rejectTarget, requestReject, confirmReject, cancelReject,
    answerFeedback, remindFeedback, remindOffer, addRole, saveSourced,
    sendMessage, advanceSequence, enrollSequence, moveFromThread,
    createHeadhuntLink, registerHeadhuntClick, applyViaHeadhunt, updateProfile, addMember,
    updatePlanRow, addPlanRows, deletePlanRow, createScenario, updateScenarioRow, deleteScenario,
    ackWarning, setSetting, toasts, toast, tourStep, startTour,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
