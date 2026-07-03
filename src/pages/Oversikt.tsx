import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Donut, Sparkline } from '../components/charts'
import { SOURCE_OF_HIRE } from '../data'
import { prognosLabel } from '../planning'
import { useStore } from '../store'
import type { PlanWarning } from '../types'

const KPIS = [
  { label: 'Time-to-hire', value: '24 dagar', trend: '▼ 6 dagar', data: [34, 32, 31, 30, 28, 26, 24] },
  { label: 'Cost-per-hire', value: '38 500 kr', trend: '▼ 12 %', data: [46, 45, 44, 43, 41, 40, 38.5] },
  { label: 'Öppna roller', value: '3', trend: 'stabilt', data: [4, 4, 3, 5, 4, 3, 3] },
  { label: 'Kandidater i pipeline', value: '27', trend: '▲ 5 denna vecka', data: [14, 17, 19, 18, 22, 25, 27] },
  { label: 'Acceptansgrad', value: '87 %', trend: '▲ 4 p.e.', data: [74, 78, 80, 79, 83, 85, 87] },
  { label: 'Feedback-svarstid från chefer', value: '4 tim', trend: '▼ från 3 dagar', data: [72, 64, 48, 30, 16, 8, 4], hero: true },
]

const ACTIONS = [
  { ico: '⏳', text: '2 kandidater väntar på chefsfeedback (Backend-utvecklare)', to: '/feedback' },
  { ico: '⏰', text: 'Erbjudande till Sara Holm går ut imorgon', to: '/erbjudanden' },
  { ico: '⚠️', text: 'Kravprofil för Ekonomiassistent saknar succékriterier', to: '/roller/ekonomi?tab=kravprofil' },
]

const kr = (n: number) => n.toLocaleString('sv-SE') + ' kr'

function KpiGrid() {
  return (
    <div className="kpi-grid">
      {KPIS.map(k => (
        <div key={k.label} className={`kpi${k.hero ? ' hero' : ''}`}>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">{k.value}</div>
          <div className="kpi-trend">{k.trend}</div>
          <Sparkline data={k.hero ? [...k.data].reverse() : k.data} color={k.hero ? '#1F5C46' : '#7C9C8E'} />
          {k.hero && <div className="small" style={{ color: 'var(--green)', fontWeight: 700, marginTop: 4 }}>★ Läckan är stängd</div>}
        </div>
      ))}
    </div>
  )
}

function ActionList() {
  const navigate = useNavigate()
  return (
    <div className="card">
      <h2 style={{ marginBottom: 8 }}>Kräver åtgärd</h2>
      <div className="action-list">
        {ACTIONS.map(a => (
          <button key={a.text} onClick={() => navigate(a.to)}>
            <span>{a.ico}</span>
            <span>{a.text}</span>
            <span className="chev">→</span>
          </button>
        ))}
      </div>
    </div>
  )
}

function WarningItem({ w, ackable }: { w: PlanWarning; ackable: boolean }) {
  const { ackWarning } = useStore()
  const [acking, setAcking] = useState(false)
  const [comment, setComment] = useState('')
  return (
    <div className={`warning-item sev-${w.severity}`} data-testid={`warning-${w.id}`}>
      <div style={{ flex: 1 }}>
        <div className="warning-text">{w.text}</div>
        <div className="muted small">
          {w.ansvarig ? `Ansvarig: ${w.ansvarig}` : 'Ingen ansvarig utsedd'} · allvarlighet: {w.severity}
        </div>
        {acking && (
          <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
            <input
              className="editable-input"
              style={{ flex: 1 }}
              placeholder="Kommentar (valfri) — t.ex. åtgärd påbörjad"
              value={comment}
              onChange={e => setComment(e.target.value)}
            />
            <button className="btn small primary" onClick={() => ackWarning(w.id, comment)} data-testid="ack-confirm">Kvittera ✓</button>
            <button className="btn small" onClick={() => setAcking(false)}>Avbryt</button>
          </div>
        )}
      </div>
      {ackable && !acking && (
        <button className="btn small" onClick={() => setAcking(true)} data-testid={`ack-${w.id}`}>Kvittera</button>
      )}
    </div>
  )
}

function WarningCenter({ onlyOwn }: { onlyOwn?: boolean }) {
  const { warnings, warningAcks, can, currentUser } = useStore()
  const relevant = onlyOwn ? warnings.filter(w => w.ansvarig === currentUser?.name) : warnings
  const open = relevant.filter(w => !warningAcks.some(a => a.id === w.id))
  const acked = relevant.filter(w => warningAcks.some(a => a.id === w.id))

  return (
    <div className="card" data-testid="warning-center">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2>{onlyOwn ? 'Mina varningar' : 'Varningscentral'} ({open.length})</h2>
        {acked.length > 0 && <span className="muted small">{acked.length} kvitterade</span>}
      </div>
      <div className="muted small" style={{ marginBottom: 10 }}>
        Genereras automatiskt ur planen + pipelinen: täckning, inaktivitet, prognos, budget, ej startad.
      </div>
      <div className="grid" style={{ gap: 8 }}>
        {open.length === 0 && <div className="banner-ok">✓ Inga öppna varningar — allt ligger i fas.</div>}
        {open.map(w => <WarningItem key={w.id} w={w} ackable={can('warnings.ack')} />)}
      </div>
      {acked.length > 0 && (
        <details style={{ marginTop: 10 }}>
          <summary className="muted small" style={{ cursor: 'pointer' }}>Visa kvitterade ({acked.length})</summary>
          <div className="grid" style={{ gap: 6, marginTop: 8 }}>
            {acked.map(w => {
              const ack = warningAcks.find(a => a.id === w.id)!
              return (
                <div key={w.id} className="warning-item acked">
                  <div style={{ flex: 1 }}>
                    <div className="warning-text">{w.text}</div>
                    <div className="muted small">✓ Kvitterad av {ack.by} {ack.ts}{ack.comment ? ` — ”${ack.comment}”` : ''}</div>
                  </div>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}

// ---------- Rekryterarens vy ----------

function RecruiterHome() {
  const { currentUser, planStatuses } = useStore()
  const navigate = useNavigate()
  const mine = planStatuses.filter(s => s.row.ansvarig === currentUser?.name)
  const pott = mine.reduce((s, r) => s + r.row.rekrbudget, 0)
  const anvant = mine.reduce((s, r) => s + r.kostnadUtfall, 0)

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>God morgon, {currentUser?.name.split(' ')[0]} 👋</h1>
          <div className="sub">Dina mål och din budget — direkt ur årsplanen, uppdaterat mot pipelinen i realtid.</div>
        </div>
        <button className="btn" onClick={() => navigate('/planering')}>Min planering →</button>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi">
          <div className="kpi-label">Mina rekryteringsmål</div>
          <div className="kpi-value">{mine.reduce((s, r) => s + r.row.antal, 0)}</div>
          <div className="kpi-trend">{mine.reduce((s, r) => s + r.anstallda, 0)} anställda hittills</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Min budgetpott</div>
          <div className="kpi-value">{Math.round(pott / 1000)} tkr</div>
          <div className="kpi-trend">{Math.round(anvant / 1000)} tkr använt</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Aktiva kandidater</div>
          <div className="kpi-value">{mine.reduce((s, r) => s + r.aktiva, 0)}</div>
          <div className="kpi-trend">i mina processer</div>
        </div>
        <div className="kpi hero">
          <div className="kpi-label">Feedback-svarstid från chefer</div>
          <div className="kpi-value">4 tim</div>
          <div className="kpi-trend">▼ från 3 dagar</div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Mina mål ({mine.length} rader ur {`årsplanen`})</h2>
        <div className="goal-grid">
          {mine.map(s => (
            <div key={s.row.id} className="goal-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <b>{s.row.rollTitel}</b>
                <span className={s.prognosLage === 'efter plan' ? 'chip danger' : s.prognosLage === 'risk' ? 'chip warn' : 'chip'}>
                  {prognosLabel[s.prognosLage]}
                </span>
              </div>
              <div className="muted small">{s.row.avdelning} · mål {s.row.malStart}</div>
              <div className="progress" title={`${s.anstallda} av ${s.row.antal}`}>
                <div style={{ width: `${Math.min(100, (s.anstallda / Math.max(1, s.row.antal)) * 100)}%` }} />
              </div>
              <div className="small" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{s.anstallda}/{s.row.antal} anställda · {s.aktiva} aktiva</span>
                <span className={s.budgetLage === 'över' ? 'over-budget' : 'muted'}>{kr(s.kostnadUtfall)} / {kr(s.row.rekrbudget)}</span>
              </div>
            </div>
          ))}
          {mine.length === 0 && <div className="muted small">Inga delegerade planrader ännu — chefen delar ut mål i Planering.</div>}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <WarningCenter onlyOwn />
        <ActionList />
      </div>
    </div>
  )
}

// ---------- Chefens vy ----------

function ManagerHome() {
  const navigate = useNavigate()
  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>God morgon, Marcus 🎯</h1>
          <div className="sub">Rekryterande chef — planen, varningarna och svaren ledningen kommer att be om.</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn" onClick={() => navigate('/planering')}>Planering →</button>
          <button className="btn primary" onClick={() => navigate('/ledningsfragor')}>❖ Ledningsfrågor</button>
        </div>
      </div>
      <KpiGrid />
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <WarningCenter />
        <div className="grid" style={{ gap: 14 }}>
          <ActionList />
          <div className="card">
            <h2 style={{ marginBottom: 12 }}>Source of hire</h2>
            <Donut data={SOURCE_OF_HIRE} size={150} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ---------- Ledningens vy ----------

function ExecHome() {
  const navigate = useNavigate()
  const { planStatuses, warnings, warningAcks } = useStore()
  const open = warnings.filter(w => !warningAcks.some(a => a.id === w.id))

  const perAvdelning = useMemo(() => {
    const m = new Map<string, { mal: number; anstallda: number; aktiva: number }>()
    for (const s of planStatuses) {
      const e = m.get(s.row.avdelning) ?? { mal: 0, anstallda: 0, aktiva: 0 }
      e.mal += s.row.antal; e.anstallda += s.anstallda; e.aktiva += s.aktiva
      m.set(s.row.avdelning, e)
    }
    return [...m.entries()]
  }, [planStatuses])

  const totMal = planStatuses.reduce((s, r) => s + r.row.antal, 0)
  const totAnst = planStatuses.reduce((s, r) => s + r.anstallda, 0)

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Ledningsvy 📊</h1>
          <div className="sub">Hela rekryteringsläget i realtid — läsläge. Torsdag 3 juli 2026.</div>
        </div>
        <button className="btn primary" onClick={() => navigate('/ledningsfragor')}>❖ Ledningsfrågor</button>
      </div>

      <KpiGrid />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <h2 style={{ marginBottom: 4 }}>Årsplan {new Date().getFullYear()} — {totAnst} av {totMal} tillsatta</h2>
          <div className="muted small" style={{ marginBottom: 12 }}>Per avdelning, live ur planen och pipelinen.</div>
          {perAvdelning.map(([avd, v]) => (
            <div key={avd} style={{ marginBottom: 10 }}>
              <div className="small" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <b>{avd}</b>
                <span className="muted">{v.anstallda}/{v.mal} anställda · {v.aktiva} aktiva kandidater</span>
              </div>
              <div className="progress"><div style={{ width: `${Math.min(100, (v.anstallda / Math.max(1, v.mal)) * 100)}%` }} /></div>
            </div>
          ))}
          <button className="btn small" onClick={() => navigate('/planering')}>Öppna planen →</button>
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 4 }}>Riskläge</h2>
          <div className="muted small" style={{ marginBottom: 10 }}>
            {open.filter(w => w.severity === 'hög').length} höga · {open.filter(w => w.severity === 'medel').length} medel — kvitteras av rekryterande chef.
          </div>
          <div className="grid" style={{ gap: 8 }}>
            {open.slice(0, 4).map(w => <WarningItem key={w.id} w={w} ackable={false} />)}
            {open.length === 0 && <div className="banner-ok">✓ Inga öppna varningar.</div>}
          </div>
        </div>
      </div>
    </div>
  )
}

export function Oversikt() {
  const { currentUser } = useStore()
  if (currentUser?.role === 'rekryterare') return <RecruiterHome />
  if (currentUser?.role === 'ledning') return <ExecHome />
  return <ManagerHome />
}
