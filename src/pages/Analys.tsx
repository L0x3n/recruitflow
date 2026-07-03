import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FUNNELS, SOURCE_ECONOMY, TIME_IN_STAGE } from '../data'
import { DIMENSIONS, METRICS, buildReport, formatMetric } from '../reports'
import type { Dimension, Metric } from '../reports'
import { useStore } from '../store'
import type { Candidate, StageId } from '../types'

const STAGE_RANK: Record<StageId, number> = {
  nya: 0, screening: 1, intervju: 2, case: 3, slutintervju: 4, referenser: 5, erbjudande: 6, anstalld: 7, avslag: -1,
}

// ---------- Rapportbyggare ----------

interface SavedReport { id: number; dim: Dimension; metric: Metric }

function ReportBuilder() {
  const { candidates, roles, plan, headhuntLinks, toast } = useStore()
  const [dim, setDim] = useState<Dimension>('kalla')
  const [metric, setMetric] = useState<Metric>('anstallda')
  const [saved, setSaved] = useState<SavedReport[]>([])
  const seq = useMemo(() => ({ n: 0 }), [])

  const rows = useMemo(
    () => buildReport(dim, metric, { candidates, roles, plan, headhuntLinks }),
    [dim, metric, candidates, roles, plan, headhuntLinks],
  )
  const max = Math.max(1, ...rows.map(r => r.value))
  const dimLabel = DIMENSIONS.find(d => d.id === dim)!.label
  const metricLabel = METRICS.find(m => m.id === metric)!.label

  const copy = async () => {
    const tsv = [[dimLabel, metricLabel], ...rows.map(r => [r.label, r.value])].map(r => r.join('\t')).join('\n')
    try { await navigator.clipboard.writeText(tsv); toast('Rapport kopierad') } catch { toast('Kunde inte kopiera') }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Bygg din rapport</h3>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label className="small muted">Dimension</label>
            <select className="editable-input mini-select" value={dim} onChange={e => setDim(e.target.value as Dimension)} data-testid="report-dim">
              {DIMENSIONS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="small muted">Mått</label>
            <select className="editable-input mini-select" value={metric} onChange={e => setMetric(e.target.value as Metric)} data-testid="report-metric">
              {METRICS.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
            </select>
          </div>
          <button className="btn small" onClick={copy}>⧉ Kopiera</button>
          <button className="btn small primary" onClick={() => { setSaved(s => [...s, { id: ++seq.n, dim, metric }]); toast('Rapportkort sparat') }} data-testid="report-save">
            + Spara som kort
          </button>
        </div>
      </div>

      <div className="card" data-testid="report-result">
        <h3 style={{ marginBottom: 4 }}>{metricLabel} per {dimLabel.toLowerCase()}</h3>
        <div className="muted small" style={{ marginBottom: 12 }}>Live ur pipelinen · {rows.length} grupper</div>
        {rows.length === 0 && <div className="muted small">Ingen data för den kombinationen.</div>}
        {rows.map(r => (
          <div key={r.label} className="bar-row">
            <div className="b-label">{r.label}</div>
            <div className="b-bar" style={{ width: `${Math.max(6, (r.value / max) * 60)}%` }}>{formatMetric(r.value, metric)}</div>
            <div className="muted small">{r.sub}</div>
          </div>
        ))}
      </div>

      {saved.length > 0 && (
        <div>
          <h3 style={{ marginBottom: 8 }}>Sparade kort ({saved.length})</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {saved.map(s => <SavedCard key={s.id} rep={s} onRemove={() => setSaved(x => x.filter(y => y.id !== s.id))} />)}
          </div>
        </div>
      )}
    </div>
  )
}

function SavedCard({ rep, onRemove }: { rep: SavedReport; onRemove: () => void }) {
  const { candidates, roles, plan, headhuntLinks } = useStore()
  const rows = useMemo(() => buildReport(rep.dim, rep.metric, { candidates, roles, plan, headhuntLinks }).slice(0, 5),
    [rep, candidates, roles, plan, headhuntLinks])
  const max = Math.max(1, ...rows.map(r => r.value))
  const dimLabel = DIMENSIONS.find(d => d.id === rep.dim)!.label
  const metricLabel = METRICS.find(m => m.id === rep.metric)!.label
  return (
    <div className="card" style={{ padding: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <b className="small">{metricLabel} / {dimLabel}</b>
        <button className="btn small" onClick={onRemove}>✕</button>
      </div>
      <div style={{ marginTop: 8 }}>
        {rows.map(r => (
          <div key={r.label} className="bar-row" style={{ marginBottom: 5 }}>
            <div className="b-label" style={{ width: 90, fontSize: 11 }}>{r.label}</div>
            <div className="b-bar" style={{ width: `${Math.max(8, (r.value / max) * 55)}%`, height: 18 }}>{formatMetric(r.value, rep.metric)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Tratt för roller som skapats i appen — härleds ur live-pipelinen.
function deriveFunnel(candidates: Candidate[], roleId: string) {
  const of = candidates.filter(c => c.roleId === roleId)
  const atLeast = (rank: number) => of.filter(c => STAGE_RANK[c.stage] >= rank).length
  return [
    { steg: 'Ansökningar', antal: of.length },
    { steg: 'Screening', antal: atLeast(1) },
    { steg: 'Intervju', antal: atLeast(2) },
    { steg: 'Erbjudande', antal: atLeast(6) },
    { steg: 'Anställd', antal: atLeast(7) },
  ]
}

export function Analys() {
  const navigate = useNavigate()
  const location = useLocation()
  const { candidates, roles } = useStore()
  const [roleId, setRoleId] = useState('backend')
  const [tab, setTab] = useState<'standard' | 'builder'>('standard')

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (location.hash === '#qoh' || params.get('scroll') === 'qoh') {
      setTimeout(() => document.getElementById('qoh')?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }, [location])

  const funnel = FUNNELS[roleId] ?? deriveFunnel(candidates, roleId)
  const max = funnel[0].antal || 1
  const hires = candidates.filter(c => c.historical)

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Analys</h1>
          <div className="sub">Allt här är biprodukter av ren processdata — ingen manuell rapportering.</div>
        </div>
      </div>

      <div className="tabs" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className={tab === 'standard' ? 'on' : ''} onClick={() => setTab('standard')}>Standardrapporter</button>
        <button className={tab === 'builder' ? 'on' : ''} onClick={() => setTab('builder')}>Rapportbyggare</button>
      </div>

      {tab === 'builder' && <ReportBuilder />}
      {tab === 'standard' && <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
            <h2>Tratt per roll</h2>
            <div className="role-switcher">
              {roles.map(r => (
                <button key={r.id} className={roleId === r.id ? 'on' : ''} onClick={() => setRoleId(r.id)} style={{ padding: '4px 10px', fontSize: 12 }}>
                  {r.titel.split('-')[0].split(' ')[0]}
                </button>
              ))}
            </div>
          </div>
          {funnel.map((f, i) => {
            const conv = i > 0 && funnel[i - 1].antal > 0
              ? Math.round((f.antal / funnel[i - 1].antal) * 100)
              : null
            return (
              <div key={f.steg} className="funnel-row">
                <div className="f-label">{f.steg}</div>
                <div className="f-bar" style={{ width: `${Math.max(8, (f.antal / max) * 100)}%` }}>{f.antal}</div>
                {conv !== null && <div className="f-conv">{conv} %</div>}
              </div>
            )
          })}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: 12 }}>Tid per steg (dagar)</h2>
          {TIME_IN_STAGE.map(t => (
            <div key={t.steg} className={`bar-row${t.flaskhals ? ' hot' : ''}`}>
              <div className="b-label">{t.steg}</div>
              <div className="b-bar" style={{ width: `${(t.dagar / 9) * 55}%` }}>{t.dagar} d</div>
              {t.flaskhals && <div className="b-note">← flaskhals</div>}
            </div>
          ))}
          <div className="muted small" style={{ marginTop: 10 }}>
            Case/Teknisk tar 9 dagar — värdet syns direkt eftersom varje stegförflyttning är tidsstämplad.
          </div>
        </div>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: 10 }}>Källa × kostnad (senaste 12 mån)</h2>
        <table className="tbl">
          <thead>
            <tr><th>Kanal</th><th className="num">Anställda</th><th className="num">Total kostnad</th><th className="num">Kostnad per anställd</th></tr>
          </thead>
          <tbody>
            {SOURCE_ECONOMY.map(s => (
              <tr key={s.kanal}>
                <td><b>{s.kanal}</b></td>
                <td className="num">{s.anstallda}</td>
                <td className="num">{s.kostnad.toLocaleString('sv-SE')} kr</td>
                <td className="num"><b>{Math.round(s.kostnad / s.anstallda).toLocaleString('sv-SE')} kr</b></td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="banner-ok" style={{ marginTop: 12 }}>
          ✓ LinkedIn ger flest anställda per krona av de betalda kanalerna — referrals slår allt.
        </div>
      </div>

      <div className="card" id="qoh" data-tour="qoh">
        <h2 style={{ marginBottom: 4 }}>Quality of hire — loopen sluts</h2>
        <div className="muted small" style={{ marginBottom: 12 }}>
          6-månadersutvärderingen kopplas tillbaka till den ursprungliga scorecarden. Nu vet vi vilka bedömningar som förutsäger prestation.
        </div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Person</th><th>Roll</th><th className="num">Scorecard vid urval</th>
              <th className="num">6-mån betyg (chef)</th><th>Retention</th><th>Ursprunglig bedömning</th>
            </tr>
          </thead>
          <tbody>
            {hires.map(h => (
              <tr key={h.id}>
                <td><b>{h.name}</b></td>
                <td>{h.historical!.roleLabel}</td>
                <td className="num">{h.historical!.originalScore.toFixed(1).replace('.', ',')}</td>
                <td className="num">
                  <b style={{ color: h.historical!.sixMonthRating >= 4.2 ? 'var(--green)' : 'var(--warn)' }}>
                    {h.historical!.sixMonthRating.toFixed(1).replace('.', ',')}
                  </b>
                </td>
                <td>
                  <span className={h.historical!.retention === 'Kvar' ? 'chip' : 'chip warn'}>
                    {h.historical!.retention}
                  </span>
                </td>
                <td>
                  <button className="btn small" onClick={() => navigate(`/kandidater/${h.id}?tab=bedomningar`)}>
                    Visa scorecards →
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="banner-ok" style={{ marginTop: 12 }}>
          ✓ Kandidater med scorecard ≥ 4,2 presterar 31 % bättre efter 6 mån (mockdata).
        </div>
      </div>
      </>}
    </div>
  )
}
