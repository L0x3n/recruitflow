import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FUNNELS, SOURCE_ECONOMY, TIME_IN_STAGE } from '../data'
import { useStore } from '../store'
import type { Candidate, StageId } from '../types'

const STAGE_RANK: Record<StageId, number> = {
  nya: 0, screening: 1, intervju: 2, case: 3, slutintervju: 4, referenser: 5, erbjudande: 6, anstalld: 7, avslag: -1,
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
    </div>
  )
}
