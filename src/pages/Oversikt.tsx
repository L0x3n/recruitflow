import { useNavigate } from 'react-router-dom'
import { Donut, Sparkline } from '../components/charts'
import { SOURCE_OF_HIRE } from '../data'
import { useStore } from '../store'

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

export function Oversikt() {
  const navigate = useNavigate()
  const { candidates } = useStore()
  const inPipeline = candidates.filter(c => c.roleId !== 'historisk' && c.stage !== 'avslag' && c.stage !== 'anstalld').length

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>God morgon, Eva 👋</h1>
          <div className="sub">Torsdag 3 juli 2026 · {inPipeline} aktiva kandidater · all data nedan kommer direkt ur pipelinen</div>
        </div>
      </div>

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

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
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
        <div className="card">
          <h2 style={{ marginBottom: 12 }}>Source of hire</h2>
          <Donut data={SOURCE_OF_HIRE} />
        </div>
      </div>
    </div>
  )
}
