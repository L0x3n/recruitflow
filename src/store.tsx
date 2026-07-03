import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { CANDIDATES, stageLabel } from './data'
import type { Candidate, StageId } from './types'

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

interface Store {
  candidates: Candidate[]
  byId: (id: string) => Candidate | undefined
  moveCandidate: (id: string, stage: StageId) => void
  rejectTarget: string | null // candidate id eller 'demo'
  requestReject: (id: string) => void
  confirmReject: (reason: string, note: string) => void
  cancelReject: () => void
  toasts: Toast[]
  toast: (text: string) => void
  demo: () => void
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

export function StoreProvider({ children }: { children: ReactNode }) {
  const [candidates, setCandidates] = useState<Candidate[]>(CANDIDATES)
  const [rejectTarget, setRejectTarget] = useState<string | null>(null)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [tourStep, setTourStep] = useState<number | null>(null)
  const toastId = useRef(0)

  const toast = useCallback((text: string) => {
    const id = ++toastId.current
    setToasts(t => [...t, { id, text }])
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500)
  }, [])

  const demo = useCallback(() => toast('Demo — den här funktionen är illustrativ'), [toast])

  const moveCandidate = useCallback((id: string, stage: StageId) => {
    setCandidates(cs => cs.map(c => {
      if (c.id !== id || c.stage === stage) return c
      return {
        ...c, stage, daysInStage: 0,
        timeline: [...c.timeline, { ts: nowTs(), actor: 'Eva Lindqvist', text: `Flyttade kandidat till ${stageLabel(stage)}` }],
      }
    }))
  }, [])

  const requestReject = useCallback((id: string) => setRejectTarget(id), [])
  const cancelReject = useCallback(() => setRejectTarget(null), [])

  const confirmReject = useCallback((reason: string, note: string) => {
    setRejectTarget(target => {
      if (target && target !== 'demo') {
        setCandidates(cs => cs.map(c => c.id === target
          ? {
              ...c, stage: 'avslag' as StageId, daysInStage: 0,
              rejection: { reason, note: note || undefined },
              timeline: [...c.timeline, { ts: nowTs(), actor: 'Eva Lindqvist', text: `Avslag registrerat med orsak: ${reason}` }],
            }
          : c))
        toast('Avslag loggat med orsak — datan finns kvar i pipelinen')
      }
      return null
    })
  }, [toast])

  const byId = useCallback((id: string) => candidates.find(c => c.id === id), [candidates])

  const startTour = useCallback(() => setTourStep(0), [])

  const value = useMemo<Store>(() => ({
    candidates, byId, moveCandidate,
    rejectTarget, requestReject, confirmReject, cancelReject,
    toasts, toast, demo,
    tourStep, startTour, setTourStep,
  }), [candidates, byId, moveCandidate, rejectTarget, requestReject, confirmReject, cancelReject, toasts, toast, demo, tourStep, startTour])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}
