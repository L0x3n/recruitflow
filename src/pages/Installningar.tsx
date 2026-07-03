import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store'

function ProfileCard({ startInEdit }: { startInEdit: boolean }) {
  const { profile, updateProfile } = useStore()
  const [editing, setEditing] = useState(startInEdit)
  const [draft, setDraft] = useState(profile)

  const startEdit = () => { setDraft(profile); setEditing(true) }
  const save = () => { updateProfile(draft); setEditing(false) }

  return (
    <div className="card" data-testid="profile-card">
      <h2 style={{ marginBottom: 10 }}>Profil</h2>
      {editing ? (
        <div className="grid" style={{ gap: 8 }}>
          <div>
            <label className="small muted">Namn</label>
            <input className="editable-input" value={draft.name} onChange={e => setDraft(d => ({ ...d, name: e.target.value }))} />
          </div>
          <div>
            <label className="small muted">Roll</label>
            <input className="editable-input" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
          </div>
          <div>
            <label className="small muted">E-post</label>
            <input className="editable-input" value={draft.email} onChange={e => setDraft(d => ({ ...d, email: e.target.value }))} />
          </div>
          <div>
            <label className="small muted">Notiser</label>
            <input className="editable-input" value={draft.notiser} onChange={e => setDraft(d => ({ ...d, notiser: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <button className="btn small" onClick={() => setEditing(false)}>Avbryt</button>
            <button
              className={`btn small primary${draft.name.trim() ? '' : ' disabled'}`}
              disabled={!draft.name.trim()}
              onClick={save}
            >
              Spara ✓
            </button>
          </div>
        </div>
      ) : (
        <>
          <table className="tbl">
            <tbody>
              <tr><td className="muted">Namn</td><td>{profile.name}</td></tr>
              <tr><td className="muted">Roll</td><td>{profile.title}</td></tr>
              <tr><td className="muted">E-post</td><td>{profile.email}</td></tr>
              <tr><td className="muted">Notiser</td><td>{profile.notiser}</td></tr>
            </tbody>
          </table>
          <button className="btn small" style={{ marginTop: 10 }} onClick={startEdit}>Redigera profil</button>
        </>
      )}
    </div>
  )
}

function TeamCard() {
  const { team, addMember } = useStore()
  const [inviting, setInviting] = useState(false)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')

  const invite = () => {
    if (!name.trim()) return
    addMember({ name: name.trim(), title: title.trim() || 'Bedömare' })
    setName(''); setTitle(''); setInviting(false)
  }

  return (
    <div className="card">
      <h2 style={{ marginBottom: 10 }}>Team</h2>
      <table className="tbl">
        <tbody>
          {team.map(m => (
            <tr key={m.name}><td>{m.name}</td><td className="muted">{m.title}</td></tr>
          ))}
        </tbody>
      </table>
      {inviting ? (
        <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
          <input className="editable-input" style={{ flex: 1, minWidth: 120 }} placeholder="Namn" value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && invite()} />
          <input className="editable-input" style={{ flex: 1, minWidth: 120 }} placeholder="Titel" value={title} onChange={e => setTitle(e.target.value)} onKeyDown={e => e.key === 'Enter' && invite()} />
          <button className="btn small" onClick={() => setInviting(false)}>Avbryt</button>
          <button className={`btn small primary${name.trim() ? '' : ' disabled'}`} disabled={!name.trim()} onClick={invite}>Lägg till</button>
        </div>
      ) : (
        <button className="btn small" style={{ marginTop: 10 }} onClick={() => setInviting(true)}>Bjud in medlem</button>
      )}
    </div>
  )
}

const DATAMODELL = [
  {
    entitet: 'Kandidat',
    falt: 'namn, kontakt, källkanal, CV, GDPR-samtycke (datum), aktuellt steg',
    format: 'strukturerad post, UTF-8, ISO 8601-datum',
    gallring: 'raderas 24 mån efter avslutad process om inte samtycke förnyas',
  },
  {
    entitet: 'Roll / Kravprofil',
    falt: 'must-have, meriterande, lönespann, succékriterier, scorecard-kriterier',
    format: 'versionerad — låses när rekryteringen startar',
    gallring: 'arkiveras 5 år (utfallsanalys)',
  },
  {
    entitet: 'Scorecard',
    falt: 'kriteriepoäng 1–5, motivering, bedömare, steg, kanal (röst/foto/text)',
    format: 'poäng mot kravprofilens kriterier — alltid jämförbar',
    gallring: 'följer kandidatens gallringsregel',
  },
  {
    entitet: 'Händelse (tidslinje)',
    falt: 'tidsstämpel, aktör, händelsetyp, objekt',
    format: 'append-only-logg — kan aldrig redigeras i efterhand',
    gallring: 'följer kandidatens gallringsregel',
  },
  {
    entitet: 'Erbjudande & beslut',
    falt: 'lön, datum, status, beslutsmotivering, signaturer',
    format: 'signerad post med tidsstämpel',
    gallring: 'arkiveras 2 år efter avslut (diskrimineringslagens preskription)',
  },
  {
    entitet: 'Utfall (quality of hire)',
    falt: '6-månadersbetyg, retention, chefskommentar, koppling till ursprunglig scorecard',
    format: 'kopplas via kandidat-id — loopen sluts',
    gallring: 'anonymiseras efter 5 år, aggregat behålls',
  },
]

function DemoApiCard() {
  const { settings, setSetting } = useStore()
  return (
    <div className="card">
      <h2 style={{ marginBottom: 6 }}>Demo & API</h2>
      <div className="muted small" style={{ marginBottom: 10 }}>
        Appen pratar med ett mockat API-lager (format efter SmartRecruiters/Teamtailor) med simulerad latens.
        Slå på felsimulering för att se hur appen hanterar ett API som ligger nere.
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={settings.apiFel}
          onChange={e => setSetting('apiFel', e.target.checked)}
          data-testid="api-fel-toggle"
        />
        <span>Simulera API-fel (alla ändringar svarar 503 tills du stänger av)</span>
      </label>
    </div>
  )
}

function AuditCard() {
  const { audit, can } = useStore()
  if (!can('audit.view')) return null
  const events = [...audit].reverse().slice(0, 30)
  return (
    <div className="card" data-testid="audit-log">
      <h2 style={{ marginBottom: 6 }}>Händelselogg (audit)</h2>
      <div className="muted small" style={{ marginBottom: 10 }}>
        Append-only — varje mutation via API:t loggas med aktör och tidsstämpel. Grunden för compliance-centret.
      </div>
      {events.length === 0 && <div className="muted small">Inga händelser ännu i den här sessionen.</div>}
      {events.length > 0 && (
        <table className="tbl">
          <thead><tr><th>Tid</th><th>Aktör</th><th>Händelse</th><th>Detaljer</th></tr></thead>
          <tbody>
            {events.map(e => (
              <tr key={e.id}>
                <td className="num" style={{ whiteSpace: 'nowrap' }}>{e.ts}</td>
                <td>{e.actor}</td>
                <td><b>{e.action}</b></td>
                <td>{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}

export function Installningar() {
  const location = useLocation()
  const dmRef = useRef<HTMLDivElement>(null)
  const params = new URLSearchParams(location.search)
  const showDatamodell = params.get('panel') === 'datamodell'
  const editProfile = params.get('edit') === 'profil'

  useEffect(() => {
    if (showDatamodell) {
      setTimeout(() => dmRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150)
    }
  }, [showDatamodell])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Inställningar</h1>
          <div className="sub">Konto, team och — viktigast av allt — datamodellen som gör allt annat möjligt.</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ProfileCard key={String(editProfile)} startInEdit={editProfile} />
        <TeamCard />
      </div>

      <DemoApiCard />
      <AuditCard />

      <div className="card" ref={dmRef} style={showDatamodell ? { borderColor: 'var(--green-mid)' } : undefined}>
        <h2 style={{ marginBottom: 4 }}>Datamodellen — röret i pipelinen</h2>
        <div className="muted small" style={{ marginBottom: 12 }}>
          Här definieras fält, format och gallringsregler. Att datan är strukturerad <i>vid källan</i> är
          hela skillnaden mellan en perfekt värld och Excel-kaos.
        </div>
        <table className="tbl">
          <thead>
            <tr><th>Entitet</th><th>Fält</th><th>Format</th><th>Gallring (GDPR)</th></tr>
          </thead>
          <tbody>
            {DATAMODELL.map(d => (
              <tr key={d.entitet}>
                <td><b>{d.entitet}</b></td>
                <td>{d.falt}</td>
                <td>{d.format}</td>
                <td>{d.gallring}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="banner-ok" style={{ marginTop: 12 }}>
          ✓ Gallringsregler körs automatiskt — GDPR-efterlevnad är inbyggd, inte en årlig panikövning.
        </div>
      </div>
    </div>
  )
}
