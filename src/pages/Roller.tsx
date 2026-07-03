import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ROLES } from '../data'
import { useStore } from '../store'
import type { Role } from '../types'

const TABS = [
  { id: 'kravprofil', label: 'Kravprofil' },
  { id: 'annonsering', label: 'Annonsering' },
  { id: 'intervjuplan', label: 'Intervjuplan' },
]

function ChipEditor({ initial, blue }: { initial: string[]; blue?: boolean }) {
  const [chips, setChips] = useState(initial)
  const [draft, setDraft] = useState('')
  const add = () => {
    const v = draft.trim()
    if (v) { setChips(c => [...c, v]); setDraft('') }
  }
  return (
    <div className="chip-row">
      {chips.map((c, i) => (
        <span key={`${c}-${i}`} className={`chip${blue ? ' blue' : ''}`}>
          {c}
          <span className="x" onClick={() => setChips(cs => cs.filter((_, j) => j !== i))}>×</span>
        </span>
      ))}
      <input
        className="add-chip-input"
        placeholder="+ lägg till"
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && add()}
        onBlur={add}
      />
    </div>
  )
}

function Kravprofil({ role }: { role: Role }) {
  const [lon, setLon] = useState(role.lonespann)
  const [start, setStart] = useState(role.startdatum)
  const [krit, setKrit] = useState(role.succekriterier.join('\n'))

  return (
    <div className="grid" style={{ gap: 14 }} data-tour="kravprofil">
      {role.kravprofilKomplett ? (
        <div className="banner-ok">✓ Kravprofilen är komplett och låst — alla bedömningar mäts mot denna.</div>
      ) : (
        <div className="banner-warn">Succékriterier saknas — kravprofilen kan inte låsas förrän de är ifyllda.</div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <h3 style={{ marginBottom: 9 }}>Must-have-kompetenser</h3>
          <ChipEditor initial={role.mustHave} />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 9 }}>Meriterande</h3>
          <ChipEditor initial={role.meriterande} blue />
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 9 }}>Lönespann</h3>
          <input className="editable-input" value={lon} onChange={e => setLon(e.target.value)} />
          <h3 style={{ margin: '13px 0 9px' }}>Startdatum</h3>
          <input className="editable-input" value={start} onChange={e => setStart(e.target.value)} />
          <h3 style={{ margin: '13px 0 9px' }}>Ansvarig chef</h3>
          <div><span className="chip">{role.chef} · {role.chefTitel}</span></div>
        </div>
        <div className="card">
          <h3 style={{ marginBottom: 9 }}>Succékriterier efter 6 mån</h3>
          <textarea
            className="editable-input"
            rows={5}
            style={{ resize: 'vertical' }}
            placeholder="Ett kriterium per rad — t.ex. 'Levererar självständigt inom 3 månader'"
            value={krit}
            onChange={e => setKrit(e.target.value)}
          />
          <div className="muted small" style={{ marginTop: 7 }}>
            Dessa kriterier följs upp i 6-månadersutvärderingen — det är så quality of hire-loopen sluts.
          </div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 9 }}>Scorecard-kriterier (används i alla bedömningar)</h3>
        <div className="chip-row">
          {role.kriterier.map(k => <span key={k} className="chip gray">{k}</span>)}
        </div>
      </div>
    </div>
  )
}

function Annonsering({ role }: { role: Role }) {
  const totalKostnad = role.annonsering.reduce((s, k) => s + k.kostnad, 0)
  const totalAns = role.annonsering.reduce((s, k) => s + k.ansokningar, 0)
  return (
    <div className="card" data-tour="annonsering">
      <h3 style={{ marginBottom: 10 }}>Kanaler & kostnad per ansökan</h3>
      <table className="tbl">
        <thead>
          <tr>
            <th>Kanal</th><th className="num">Kostnad</th><th className="num">Visningar</th>
            <th className="num">Ansökningar</th><th className="num">Kostnad/ansökan</th>
          </tr>
        </thead>
        <tbody>
          {role.annonsering.map(k => (
            <tr key={k.kanal}>
              <td><b>{k.kanal}</b></td>
              <td className="num">{k.kostnad.toLocaleString('sv-SE')} kr</td>
              <td className="num">{k.visningar.toLocaleString('sv-SE')}</td>
              <td className="num">{k.ansokningar}</td>
              <td className="num">
                <b>{k.ansokningar ? Math.round(k.kostnad / k.ansokningar).toLocaleString('sv-SE') : '—'} kr</b>
              </td>
            </tr>
          ))}
          <tr>
            <td><b>Totalt</b></td>
            <td className="num"><b>{totalKostnad.toLocaleString('sv-SE')} kr</b></td>
            <td className="num" />
            <td className="num"><b>{totalAns}</b></td>
            <td className="num"><b>{Math.round(totalKostnad / totalAns).toLocaleString('sv-SE')} kr</b></td>
          </tr>
        </tbody>
      </table>
      <div className="muted small" style={{ marginTop: 10 }}>
        Varje ansökan taggas automatiskt med sin källkanal — därför vet vi exakt vad varje kanal levererar.
      </div>
    </div>
  )
}

function Intervjuplan({ role }: { role: Role }) {
  return (
    <div className="card">
      <h3 style={{ marginBottom: 10 }}>Definierade steg — vem bedömer och mot vilken scorecard</h3>
      <table className="tbl">
        <thead>
          <tr><th>Steg</th><th>Längd</th><th>Bedömare</th><th>Scorecard</th></tr>
        </thead>
        <tbody>
          {role.intervjuplan.map((s, i) => (
            <tr key={s.namn}>
              <td><b>{i + 1}. {s.namn}</b></td>
              <td>{s.langd}</td>
              <td>{s.bedomare}</td>
              <td>{s.scorecard === '—' ? '—' : <span className="chip gray">{s.scorecard}</span>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="muted small" style={{ marginTop: 10 }}>
        Samma scorecard-kriterier i varje steg gör bedömningarna jämförbara — mellan kandidater och mellan bedömare.
      </div>
    </div>
  )
}

export function Roller() {
  const { roleId } = useParams()
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()
  const { candidates, demo } = useStore()
  const tab = searchParams.get('tab') ?? 'kravprofil'

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const c of candidates) {
      if (c.stage !== 'avslag' && c.roleId !== 'historisk') m[c.roleId] = (m[c.roleId] ?? 0) + 1
    }
    return m
  }, [candidates])

  const role = ROLES.find(r => r.id === roleId)

  if (!role) {
    return (
      <div className="grid" style={{ gap: 16 }}>
        <div className="page-head">
          <div>
            <h1>Roller</h1>
            <div className="sub">Varje roll börjar med en strukturerad kravprofil — måttstocken för hela processen.</div>
          </div>
          <button className="btn" onClick={demo}>+ Ny roll</button>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {ROLES.map(r => (
            <div key={r.id} className="role-list-item" onClick={() => navigate(`/roller/${r.id}`)}>
              <div className="role-icon">{r.id === 'backend' ? '💻' : r.id === 'ekonomi' ? '🧾' : '🎧'}</div>
              <div style={{ flex: 1 }}>
                <b>{r.titel}</b>
                <div className="muted small">{r.chef} · {r.chefTitel} · start {r.startdatum}</div>
              </div>
              {!r.kravprofilKomplett && <span className="chip warn">Succékriterier saknas</span>}
              <span className="chip">aktiv</span>
              <span className="chip blue">{counts[r.id] ?? 0} kandidater</span>
              <span className="muted">→</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="page-head">
        <div>
          <button className="btn small" onClick={() => navigate('/roller')} style={{ marginBottom: 8 }}>← Alla roller</button>
          <h1>{role.titel}</h1>
          <div className="sub">{role.chef} · {role.chefTitel} · lönespann {role.lonespann} · start {role.startdatum}</div>
        </div>
        <button className="btn" onClick={() => navigate(`/kandidater?roll=${role.id}`)}>
          Visa pipeline ({counts[role.id] ?? 0}) →
        </button>
      </div>

      <div className="tabs" style={{ borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setSearchParams({ tab: t.id })}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'kravprofil' && <Kravprofil key={role.id} role={role} />}
      {tab === 'annonsering' && <Annonsering role={role} />}
      {tab === 'intervjuplan' && <Intervjuplan role={role} />}
    </div>
  )
}
