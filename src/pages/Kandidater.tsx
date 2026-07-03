import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ROLES, STAGES, roleTitle, stageLabel } from '../data'
import { useStore } from '../store'
import type { Candidate, StageId } from '../types'

function ScorePill({ score }: { score?: number }) {
  if (score === undefined) return null
  return <span className={`score-pill${score < 4 ? ' low' : ''}`}>★ {score.toFixed(1).replace('.', ',')}</span>
}

function KanbanCard({ c, onOpen }: { c: Candidate; onOpen: () => void }) {
  const [dragging, setDragging] = useState(false)
  return (
    <div
      className={`kcard${dragging ? ' dragging' : ''}`}
      draggable
      onDragStart={e => { e.dataTransfer.setData('text/candidate', c.id); setDragging(true) }}
      onDragEnd={() => setDragging(false)}
      onClick={onOpen}
      data-testid={`kcard-${c.id}`}
    >
      <div className="kname">{c.name}</div>
      <div className="kmeta">
        <span className={`tag src-${c.source}`}>{c.source}</span>
        <ScorePill score={c.score} />
        <span className={`kdays${c.daysInStage >= 7 ? ' slow' : ''}`}>{c.daysInStage} d i steg</span>
      </div>
      {c.rejection && <div className="kreason">✕ {c.rejection.reason}</div>}
    </div>
  )
}

function Kanban({ roleId }: { roleId: string }) {
  const { candidates, moveCandidate, requestReject } = useStore()
  const navigate = useNavigate()
  const [dropCol, setDropCol] = useState<StageId | null>(null)
  const [showAvslag, setShowAvslag] = useState(false)

  const cols = useMemo(() => {
    const m = new Map<StageId, Candidate[]>()
    for (const s of STAGES) m.set(s.id, [])
    for (const c of candidates) {
      if (c.roleId === roleId) m.get(c.stage)?.push(c)
    }
    return m
  }, [candidates, roleId])

  const onDrop = (stage: StageId) => (e: React.DragEvent) => {
    e.preventDefault()
    setDropCol(null)
    const id = e.dataTransfer.getData('text/candidate')
    if (!id) return
    if (stage === 'avslag') requestReject(id)
    else moveCandidate(id, stage)
  }

  return (
    <div className="kanban" data-tour="kanban">
      {STAGES.map(s => {
        const collapsed = s.id === 'avslag' && !showAvslag
        const cards = cols.get(s.id) ?? []
        return (
          <div
            key={s.id}
            className={`kcol${s.id === 'avslag' ? ' avslag' : ''}${collapsed ? ' collapsed' : ''}${dropCol === s.id ? ' drop-ok' : ''}`}
            onDragOver={e => { e.preventDefault(); setDropCol(s.id) }}
            onDragLeave={() => setDropCol(d => (d === s.id ? null : d))}
            onDrop={onDrop(s.id)}
            data-testid={`kcol-${s.id}`}
          >
            <div
              className="kcol-head"
              style={s.id === 'avslag' ? { cursor: 'pointer' } : undefined}
              onClick={() => s.id === 'avslag' && setShowAvslag(v => !v)}
            >
              {s.label} <span className="count">{cards.length}</span>
              {s.id === 'avslag' && <span className="muted">{showAvslag ? '‹' : '›'}</span>}
            </div>
            {!collapsed && cards.map(c => (
              <KanbanCard key={c.id} c={c} onOpen={() => navigate(`/kandidater/${c.id}?roll=${roleId}`)} />
            ))}
          </div>
        )
      })}
    </div>
  )
}

// ---------- Kandidatpanel ----------

const DRAWER_TABS = [
  { id: 'oversikt', label: 'Översikt' },
  { id: 'bedomningar', label: 'Bedömningar' },
  { id: 'feedback', label: 'Feedback' },
  { id: 'dokument', label: 'Dokument' },
]

function ScorecardView({ c }: { c: Candidate }) {
  if (!c.scorecards.length) {
    return <div className="muted">Inga bedömningar ännu — kandidaten är tidigt i processen.</div>
  }
  return (
    <div>
      {c.scorecards.map((s, i) => {
        const avg = s.criteria.reduce((sum, cr) => sum + cr.score, 0) / s.criteria.length
        return (
          <div key={i} className="scorecard">
            <div className="sc-head">
              <div>
                <b>{s.stageLabel}</b>
                <div className="muted small">
                  {s.assessor} · {s.date} · via {s.via === 'röst' ? '🎤 röstmemo' : s.via === 'foto' ? '📷 foto av anteckningar' : '⌨️ text'}
                </div>
              </div>
              <ScorePill score={avg} />
            </div>
            {s.criteria.map(cr => (
              <div key={cr.name} className="sc-row">
                <span className="sc-name">{cr.name}</span>
                <span className="sc-dots">
                  {[1, 2, 3, 4, 5].map(n => <span key={n} className={`sc-dot${n <= cr.score ? ' on' : ''}`} />)}
                </span>
                <b style={{ width: 14, textAlign: 'right' }}>{cr.score}</b>
              </div>
            ))}
            <div className="sc-motiv">”{s.motivation}”</div>
          </div>
        )
      })}
      <div className="muted small">Alla kriterier kommer från kravprofilen — därför är bedömningarna jämförbara.</div>
    </div>
  )
}

function CandidateFeedback({ c }: { c: Candidate }) {
  const navigate = useNavigate()
  const items = c.timeline.filter(t => t.text.includes('scorecard') || t.text.includes('Feedback') || t.text.includes('feedback'))
  return (
    <div className="grid" style={{ gap: 10 }}>
      {items.length === 0 && <div className="muted">Ingen feedback ännu.</div>}
      {items.map((t, i) => (
        <div key={i} className="fb-item">
          <div className="fb-main">
            <b>{t.actor}</b>
            <div className="muted small">{t.ts}</div>
            <div className="small">{t.text}</div>
          </div>
        </div>
      ))}
      <button className="btn" onClick={() => navigate('/feedback')}>Öppna feedbackmodulen →</button>
    </div>
  )
}

function CandidateDrawer({ c }: { c: Candidate }) {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { demo } = useStore()
  const tab = searchParams.get('tab') ?? 'oversikt'
  const back = () => navigate(`/kandidater${c.roleId !== 'historisk' ? `?roll=${c.roleId}` : ''}`)

  return (
    <>
      <div className="drawer-backdrop" onClick={back} />
      <div className="drawer" data-testid="candidate-drawer">
        <div className="drawer-head">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
            <div>
              <h1>{c.name}</h1>
              <div className="sub" style={{ color: 'var(--muted)', fontSize: 13 }}>
                {c.historical?.roleLabel ?? roleTitle(c.roleId)} · ansökte {c.appliedDate}
              </div>
              <div style={{ display: 'flex', gap: 7, marginTop: 9, flexWrap: 'wrap' }}>
                <span className={`tag src-${c.source}`}>{c.source}</span>
                <span className="chip gray">{stageLabel(c.stage)}</span>
                <ScorePill score={c.score} />
              </div>
            </div>
            <button className="btn small" onClick={back}>✕ Stäng</button>
          </div>
          <div className="tabs">
            {DRAWER_TABS.map(t => (
              <button
                key={t.id}
                className={tab === t.id ? 'on' : ''}
                onClick={() => setSearchParams(p => { p.set('tab', t.id); return p })}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="drawer-body">
          {tab === 'oversikt' && (
            <div className="grid" style={{ gap: 14 }}>
              <div className="card" style={{ padding: 14 }}>
                <h3 style={{ marginBottom: 6 }}>CV-sammanfattning</h3>
                <p style={{ fontSize: 13 }}>{c.cvSummary}</p>
                <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }} className="small muted">
                  <span>✉ {c.email}</span>
                  <span>☎ {c.phone}</span>
                </div>
                <div style={{ marginTop: 10 }}>
                  <span className="chip">🔒 GDPR-samtycke t.o.m. {c.gdprConsentUntil}</span>
                </div>
              </div>
              {c.rejection && (
                <div className="card" style={{ padding: 14, borderColor: '#F3C6C6' }}>
                  <h3 style={{ marginBottom: 6, color: 'var(--red)' }}>Avslag — loggad orsak</h3>
                  <b>{c.rejection.reason}</b>
                  {c.rejection.note && <p className="small" style={{ marginTop: 4 }}>{c.rejection.note}</p>}
                </div>
              )}
              <div className="card" style={{ padding: 14 }}>
                <h3 style={{ marginBottom: 12 }}>Tidslinje — full spårbarhet</h3>
                <div className="timeline">
                  {[...c.timeline].reverse().map((t, i) => (
                    <div key={i} className="tl-item">
                      <div className="tl-ts">{t.ts}</div>
                      <div className="tl-text"><span className="tl-actor">{t.actor}</span> — {t.text}</div>
                    </div>
                  ))}
                </div>
                <div className="muted small">Varje händelse har tidsstämpel och aktör — inget försvinner i mailtrådar.</div>
              </div>
            </div>
          )}
          {tab === 'bedomningar' && <div data-tour="bedomningar"><ScorecardView c={c} /></div>}
          {tab === 'feedback' && <CandidateFeedback c={c} />}
          {tab === 'dokument' && (
            <div className="grid" style={{ gap: 12 }}>
              {['CV_' + c.name.replace(' ', '_') + '.pdf', 'Personligt_brev.pdf'].map(doc => (
                <div key={doc} className="doc-preview">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <b>📄 {doc}</b>
                    <button className="btn small" onClick={demo}>Ladda ner</button>
                  </div>
                  <div className="doc-line w60" />
                  <div className="doc-line w80" />
                  <div className="doc-line" />
                  <div className="doc-line w80" />
                  <div className="doc-line w40" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export function Kandidater() {
  const { candidateId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const { byId } = useStore()
  const roleId = searchParams.get('roll') ?? 'backend'
  const cand = candidateId ? byId(candidateId) : undefined

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <h1>Kandidater</h1>
          <div className="sub">Dra kort mellan kolumner — avslag kräver alltid en loggad orsak.</div>
        </div>
        <div className="role-switcher">
          {ROLES.map(r => (
            <button
              key={r.id}
              className={roleId === r.id ? 'on' : ''}
              onClick={() => setSearchParams(p => { p.set('roll', r.id); return p })}
            >
              {r.titel}
            </button>
          ))}
        </div>
      </div>
      <Kanban roleId={roleId} />
      {cand && <CandidateDrawer c={cand} />}
    </div>
  )
}
