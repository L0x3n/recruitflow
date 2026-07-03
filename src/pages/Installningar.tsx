import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store'

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

export function Installningar() {
  const location = useLocation()
  const { demo } = useStore()
  const dmRef = useRef<HTMLDivElement>(null)
  const params = new URLSearchParams(location.search)
  const showDatamodell = params.get('panel') === 'datamodell'

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
        <div className="card">
          <h2 style={{ marginBottom: 10 }}>Profil</h2>
          <table className="tbl">
            <tbody>
              <tr><td className="muted">Namn</td><td>Eva Lindqvist</td></tr>
              <tr><td className="muted">Roll</td><td>Rekryterare</td></tr>
              <tr><td className="muted">E-post</td><td>eva.lindqvist@bolaget.se</td></tr>
              <tr><td className="muted">Notiser</td><td>Direkt vid chefsfeedback · dagligen för övrigt</td></tr>
            </tbody>
          </table>
          <button className="btn small" style={{ marginTop: 10 }} onClick={demo}>Redigera profil</button>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 10 }}>Team</h2>
          <table className="tbl">
            <tbody>
              <tr><td>Marcus Öhrn</td><td className="muted">Utvecklingschef · bedömare</td></tr>
              <tr><td>Karin Ahlgren</td><td className="muted">Ekonomichef · bedömare</td></tr>
              <tr><td>Peter Sandell</td><td className="muted">COO · bedömare</td></tr>
              <tr><td>Nadia Berg</td><td className="muted">Teamlead · bedömare</td></tr>
            </tbody>
          </table>
          <button className="btn small" style={{ marginTop: 10 }} onClick={demo}>Bjud in medlem</button>
        </div>
      </div>

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
