import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CANDIDATES, FEEDBACK_REQUESTS, OFFERS, ROLES, stageLabel } from './data'
import type {
  Candidate, FeedbackRequest, Offer, Profile, Role, Scorecard, ScorecardCriterion, StageId, TeamMember,
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

interface Toast { id: number; text: string }

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

interface Store {
  candidates: Candidate[]
  byId: (id: string) => Candidate | undefined
  moveCandidate: (id: string, stage: StageId) => void
  rejectTarget: string | null // candidate id eller 'demo'
  requestReject: (id: string) => void
  confirmReject: (reason: string, note: string) => void
  cancelReject: () => void
  roles: Role[]
  addRole: (input: NewRoleInput) => string
  roleTitleOf: (roleId: string) => string
  feedback: FeedbackRequest[]
  answerFeedback: (
    requestId: string,
    channel: 'röst' | 'foto' | 'text',
    criteria: ScorecardCriterion[],
    motivation: string,
    voiceDuration?: string,
  ) => void
  remindFeedback: (requestId: string) => void
  offers: Offer[]
  remindOffer: (offerId: string) => void
  profile: Profile
  updateProfile: (p: Profile) => void
  team: TeamMember[]
  addMember: (m: TeamMember) => void
  toasts: Toast[]
  toast: (text: string) => void
  tourStep: number | null
  startTour: () => void
  setTourStep: (n: number | null) => void
}

const Ctx = createContext<Store>(null as unknown as Store)
export const useStore = () => useContext(Ctx)

const nowTs = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`
}

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

const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/[åä]/g, 'a').replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')

const INITIAL_PROFILE: Profile = {
  name: 'Eva Lindqvist',
  title: 'Rekryterare',
  email: 'eva.lindqvist@bolaget.se',
  notiser: 'Direkt vid chefsfeedback · dagligen för övrigt',
}

const INITIAL_TEAM: TeamMember[] = [
  { name: 'Marcus Öhrn', title: 'Utvecklingschef · bedömare' },
  { name: 'Karin Ahlgren', title: 'Ekonomichef · bedömare' },
  { name: 'Peter Sandell', title: 'COO · bedömare' },
  { name: 'Nadia Berg', title: 'Teamlead · bedömare' },
]

export function StoreProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES)
  const [roles, setRoles] = useState<Role[]>(ROLES)
  const [feedback, setFeedback] = useState<FeedbackRequest[]>(FEEDBACK_REQUESTS)
  const [offers, setOffers] = useState<Offer[]>(OFFERS)
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE)
  const [team, setTeam] = useState<TeamMember[]>(INITIAL_TEAM)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [tourStep, setTourStep] = useState<number | null>(null)
  const toastId = useRef(0)

  const toast = useCallback((text: string) => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const addTimelineEvent = useCallback((candidateId: string, actor: string, text: string) => {
    setCandidates(cs => cs.map(c => c.id === candidateId
      ? { ...c, timeline: [...c.timeline, { ts: nowTs(), actor, text }] }
      : c))
  }, [])

  const moveCandidate = useCallback((id: string, stage: StageId) => {
    setCandidates(cs => cs.map(c => {
      if (c.id !== id || c.stage === stage) return c
      return {
        ...c, stage, daysInStage: 0,
        timeline: [...c.timeline, { ts: nowTs(), actor: profile.name, text: `Flyttade kandidat till ${stageLabel(stage)}` }],
      }
    }))
  }, [profile.name])

  const requestReject = useCallback((id: string) => setRejectTarget(id), [])
  const cancelReject = useCallback(() => setRejectTarget(null), [])

  const confirmReject = useCallback((reason: string, note: string) => {
    setRejectTarget(target => {
      if (target && target !== 'demo') {
        setCandidates(cs => cs.map(c => c.id === target
          ? {
              ...c, stage: 'avslag' as StageId, daysInStage: 0,
              rejection: { reason, note: note || undefined },
              timeline: [...c.timeline, { ts: nowTs(), actor: profile.name, text: `Avslag registrerat med orsak: ${reason}` }],
            }
          : c))
        toast('Avslag loggat med orsak — datan finns kvar i pipelinen')
      }
      return null
    })
  }, [toast, profile.name])

  const byId = useCallback((id: string) => candidates.find(c => c.id === id), [candidates])

  const roleTitleOf = useCallback(
    (roleId: string) => roles.find(r => r.id === roleId)?.titel ?? 'Tidigare rekrytering',
    [roles],
  )

  const addRole = useCallback((input: NewRoleInput): string => {
    let id = slugify(input.titel) || 'roll'
    setRoles(rs => {
      while (rs.some(r => r.id === id)) id = `${id}-2`
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
          { namn: 'CV-screening', langd: '—', bedomare: `${profile.name} (rekryterare)`, scorecard: `Screeningmall ${input.titel}` },
          { namn: 'Telefonintervju', langd: '30 min', bedomare: `${profile.name} (rekryterare)`, scorecard: `Telefonintervju ${input.titel}` },
          { namn: 'Case/Arbetsprov', langd: '60 min', bedomare: `${input.chef} (chef)`, scorecard: `Case ${input.titel}` },
          { namn: 'Slutintervju', langd: '45 min', bedomare: `${input.chef} (chef) + HR`, scorecard: `Slutintervju ${input.titel}` },
          { namn: 'Referenser', langd: '2 × 20 min', bedomare: `${profile.name} (rekryterare)`, scorecard: 'Referensmall' },
          { namn: 'Erbjudande', langd: '—', bedomare: `${input.chef} (chef)`, scorecard: '—' },
        ],
      }
      return [...rs, role]
    })
    setTeam(ts => ts.some(m => m.name === input.chef)
      ? ts
      : [...ts, { name: input.chef, title: `${input.chefTitel || 'Rekryterande chef'} · bedömare` }])
    toast(`Rollen "${input.titel}" skapad — kravprofilen är måttstocken`)
    return id
  }, [profile.name, toast])

  const answerFeedback = useCallback((
    requestId: string,
    channel: 'röst' | 'foto' | 'text',
    criteria: ScorecardCriterion[],
    motivation: string,
    voiceDuration?: string,
  ) => {
    const req = feedback.find(f => f.id === requestId)
    if (!req || req.status === 'besvarad') return
    const ts = nowTs()

    setFeedback(fs => fs.map(f => f.id === requestId
      ? {
          ...f, status: 'besvarad' as const, respondedAt: ts, channel,
          responseTime: responseTimeFrom(f.sentAt),
          voice: channel === 'röst' ? { duration: voiceDuration ?? '0:30', quote: motivation } : f.voice,
        }
      : f))

    setCandidates(cs => cs.map(c => {
      if (c.id !== req.candidateId) return c
      const stage = stageFromLabel(req.stageLabel)
      const card: Scorecard = {
        stage,
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
        ...c,
        scorecards,
        score: avgOf(scorecards),
        timeline: [...c.timeline, {
          ts, actor: req.till,
          text: `Lämnade scorecard via ${viaLabel} (${cardAvg.toFixed(1).replace('.', ',')}) — svarstid ${responseTimeFrom(req.sentAt)}`,
        }],
      }
    }))

    toast('Feedback sparad — strukturerad och kopplad till kandidat, roll och steg')
  }, [feedback, toast])

  const remindFeedback = useCallback((requestId: string) => {
    const req = feedback.find(f => f.id === requestId)
    if (!req) return
    const ts = nowTs()
    setFeedback(fs => fs.map(f => f.id === requestId ? { ...f, remindedAt: ts } : f))
    addTimelineEvent(req.candidateId, profile.name, `Påminnelse om feedback skickad till ${req.till}`)
    toast(`Påminnelse skickad till ${req.till}`)
  }, [feedback, addTimelineEvent, profile.name, toast])

  const remindOffer = useCallback((offerId: string) => {
    const offer = offers.find(o => o.id === offerId)
    if (!offer) return
    const ts = nowTs()
    setOffers(os => os.map(o => o.id === offerId ? { ...o, remindedAt: ts } : o))
    const cand = candidates.find(c => c.id === offer.candidateId)
    addTimelineEvent(offer.candidateId, profile.name, 'Påminnelse om erbjudandet skickad till kandidaten')
    toast(`Påminnelse skickad till ${cand?.name ?? 'kandidaten'}`)
  }, [offers, candidates, addTimelineEvent, profile.name, toast])

  const updateProfile = useCallback((p: Profile) => {
    setProfile(p)
    toast('Profil uppdaterad')
  }, [toast])

  const addMember = useCallback((m: TeamMember) => {
    setTeam(ts => [...ts, m])
    toast(`${m.name} tillagd i teamet`)
  }, [toast])

  const startTour = useCallback(() => setTourStep(0), [])

  const value = useMemo<Store>(() => ({
    candidates, byId, moveCandidate,
    rejectTarget, requestReject, confirmReject, cancelReject,
    roles, addRole, roleTitleOf,
    feedback, answerFeedback, remindFeedback,
    offers, remindOffer,
    profile, updateProfile, team, addMember,
    toasts, toast,
    tourStep, startTour, setTourStep,
  }), [
    candidates, byId, moveCandidate, rejectTarget, requestReject, confirmReject, cancelReject,
    roles, addRole, roleTitleOf, feedback, answerFeedback, remindFeedback, offers, remindOffer,
    profile, updateProfile, team, addMember, toasts, toast, tourStep, startTour,
  ])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
