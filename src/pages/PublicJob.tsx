import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useStore } from '../store'

// Kandidatvänd publik jobbsida — ingen inloggning. Nås via headhunt-länk (?hh=...).
export function PublicJob() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { roles, headhuntLinks, registerHeadhuntClick, applyViaHeadhunt } = useStore()
  const hh = params.get('hh') ?? ''
  const link = headhuntLinks.find(l => l.id === hh)
  const registered = useRef(false)

  const [roleId, setRoleId] = useState(link?.roleId ?? params.get('roll') ?? roles.find(r => r.id !== 'historisk')?.id ?? '')
  const [name, setName] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (hh && link && !registered.current) {
      registered.current = true
      registerHeadhuntClick(hh)
    }
    if (link) setRoleId(link.roleId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hh])

  const role = useMemo(() => roles.find(r => r.id === roleId), [roles, roleId])

  const apply = async () => {
    if (!name.trim() || !role) return
    const id = await applyViaHeadhunt(hh, role.id, name, note)
    if (id) setDone(true)
  }

  return (
    <div className="public-page">
      <div className="public-topbar">
        <div className="logo">
          <div className="logo-mark">R</div>
          <div>
            <div className="logo-name" style={{ color: '#fff' }}>Bolaget AB</div>
            <div className="logo-sub">Lediga tjänster</div>
          </div>
        </div>
        {link && <div className="public-ref">Rekommenderad av {link.recruiter}</div>}
      </div>

      <div className="public-body">
        {done ? (
          <div className="public-card">
            <div className="public-done">✓</div>
            <h1>Tack, {name.split(' ')[0]}!</h1>
            <p>Din ansökan till <b>{role?.titel}</b> är mottagen{link ? ` och tillskriven ${link.recruiter}` : ''}. Vi hör av oss inom kort.</p>
            <p className="muted small" style={{ marginTop: 12 }}>
              (Demo: ansökan dök just upp i rekryterarens pipeline med källa ”Headhunt” och full spårbarhet.)
            </p>
            <button className="btn" style={{ marginTop: 14 }} onClick={() => navigate('/')}>Till inloggningen →</button>
          </div>
        ) : (
          <div className="public-card">
            {!link && (
              <div style={{ marginBottom: 14 }}>
                <label className="small muted">Välj tjänst</label>
                <select className="editable-input" value={roleId} onChange={e => setRoleId(e.target.value)}>
                  {roles.filter(r => r.id !== 'historisk').map(r => <option key={r.id} value={r.id}>{r.titel}</option>)}
                </select>
              </div>
            )}
            {role ? (
              <>
                <span className="chip">Öppen tjänst</span>
                <h1 style={{ marginTop: 8 }}>{role.titel}</h1>
                <div className="muted" style={{ marginBottom: 12 }}>{role.chef} · {role.chefTitel} · {role.lonespann} · start {role.startdatum}</div>

                <h3 style={{ marginBottom: 6 }}>Vi söker dig som har</h3>
                <div className="chip-row" style={{ marginBottom: 10 }}>
                  {role.mustHave.map(m => <span key={m} className="chip">{m}</span>)}
                </div>
                {role.meriterande.length > 0 && (
                  <>
                    <h3 style={{ marginBottom: 6 }}>Meriterande</h3>
                    <div className="chip-row" style={{ marginBottom: 14 }}>
                      {role.meriterande.map(m => <span key={m} className="chip blue">{m}</span>)}
                    </div>
                  </>
                )}

                <div className="public-form">
                  <h3 style={{ marginBottom: 8 }}>Ansök på 30 sekunder</h3>
                  <label className="small muted">Namn</label>
                  <input className="editable-input" style={{ marginBottom: 10 }} value={name} onChange={e => setName(e.target.value)} placeholder="För- och efternamn" data-testid="apply-name" />
                  <label className="small muted">Kort om dig (valfritt)</label>
                  <textarea className="editable-input" rows={3} style={{ marginBottom: 12, resize: 'vertical' }} value={note} onChange={e => setNote(e.target.value)} placeholder="Din bakgrund i en mening eller två…" data-testid="apply-note" />
                  <button className={`btn primary${name.trim() ? '' : ' disabled'}`} disabled={!name.trim()} onClick={apply} data-testid="apply-submit">
                    Skicka ansökan
                  </button>
                </div>
              </>
            ) : <p className="muted">Tjänsten hittades inte.</p>}
          </div>
        )}
      </div>
    </div>
  )
}
