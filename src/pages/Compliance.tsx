import { useMemo, useState } from 'react'
import { useStore } from '../store'

// Härleder "AI-beslut" ur befintlig data för AI-transparens-panelen (AI Control Center-stil).
function useAiDecisions() {
  const { candidates, roleTitleOf } = useStore()
  return useMemo(() => {
    const out: { titel: string; beslut: string; forklaring: string }[] = []
    for (const c of candidates) {
      if (c.source === 'AI-sourcing') {
        out.push({
          titel: `Sourcing-match: ${c.name}`,
          beslut: `Föreslagen för ${roleTitleOf(c.roleId)} (score ${(c.score ?? 0).toFixed(1).replace('.', ',')})`,
          forklaring: 'Matchning mot kravprofilens must-have-kompetenser + tillväxtsignaler. Alla bidrag visas i kandidatens profil.',
        })
      }
    }
    for (const c of candidates) {
      const voice = c.scorecards.find(s => s.via === 'röst')
      if (voice) {
        out.push({
          titel: `Strukturerad feedback: ${c.name}`,
          beslut: `Röstmemo tolkat till scorecard (${voice.stageLabel})`,
          forklaring: 'Tal-till-text + strukturering mot rollens kriterier. Bedömaren kan alltid justera poängen manuellt.',
        })
      }
    }
    return out.slice(0, 6)
  }, [candidates, roleTitleOf])
}

export function Compliance() {
  const { audit, integrations, toggleIntegration, runRetention, candidates } = useStore()
  const [tab, setTab] = useState<'audit' | 'ai' | 'gdpr' | 'marketplace'>('audit')
  const aiDecisions = useAiDecisions()
  const events = [...audit].reverse()
  const avslagCount = candidates.filter(c => c.stage === 'avslag').length

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Compliance & kontroll 🛡️</h1>
          <div className="sub">Full transparens, auditbarhet och GDPR — inbyggt, inte en årlig panikövning. SmartRecruiters AI Control Center-stil.</div>
        </div>
      </div>

      <div className="tabs" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className={tab === 'audit' ? 'on' : ''} onClick={() => setTab('audit')}>Händelselogg</button>
        <button className={tab === 'ai' ? 'on' : ''} onClick={() => setTab('ai')}>AI-transparens</button>
        <button className={tab === 'gdpr' ? 'on' : ''} onClick={() => setTab('gdpr')}>GDPR-gallring</button>
        <button className={tab === 'marketplace' ? 'on' : ''} onClick={() => setTab('marketplace')}>Marketplace</button>
      </div>

      {tab === 'audit' && (
        <div className="card" data-testid="compliance-audit">
          <h3 style={{ marginBottom: 6 }}>Append-only händelselogg ({events.length})</h3>
          <div className="muted small" style={{ marginBottom: 10 }}>Varje mutation via API:t loggas med aktör och tidsstämpel. Kan aldrig redigeras i efterhand.</div>
          {events.length === 0 && <div className="muted small">Inga händelser ännu i den här sessionen.</div>}
          {events.length > 0 && (
            <table className="tbl">
              <thead><tr><th>Tid</th><th>Aktör</th><th>Händelse</th><th>Detaljer</th></tr></thead>
              <tbody>
                {events.slice(0, 40).map(e => (
                  <tr key={e.id}><td className="num" style={{ whiteSpace: 'nowrap' }}>{e.ts}</td><td>{e.actor}</td><td><b>{e.action}</b></td><td>{e.details}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {tab === 'ai' && (
        <div className="card" data-testid="compliance-ai">
          <h3 style={{ marginBottom: 6 }}>AI-beslut & förklaringar</h3>
          <div className="muted small" style={{ marginBottom: 12 }}>Varje AI-assisterat beslut är spårbart och förklarbart — och kan alltid överprövas av en människa.</div>
          {aiDecisions.length === 0 && <div className="muted small">Inga AI-beslut loggade ännu — kör en sourcing-sökning eller ta emot ett röstmemo.</div>}
          {aiDecisions.map((d, i) => (
            <div key={i} className="ai-transparency">
              <b>{d.titel}</b>
              <div className="small">{d.beslut}</div>
              <div className="muted small">Förklaring: {d.forklaring}</div>
            </div>
          ))}
        </div>
      )}

      {tab === 'gdpr' && (
        <div className="card" data-testid="compliance-gdpr">
          <h3 style={{ marginBottom: 6 }}>Gallringsregler (GDPR)</h3>
          <div className="muted small" style={{ marginBottom: 12 }}>Samtycken och gallring hanteras automatiskt. Kör en manuell gallringsgranskning nedan.</div>
          <table className="tbl" style={{ marginBottom: 12 }}>
            <thead><tr><th>Entitet</th><th>Gallringsregel</th></tr></thead>
            <tbody>
              <tr><td>Kandidat</td><td>Raderas 24 mån efter avslutad process om samtycke inte förnyas</td></tr>
              <tr><td>Scorecard & tidslinje</td><td>Följer kandidatens gallringsregel</td></tr>
              <tr><td>Erbjudande & beslut</td><td>Arkiveras 2 år (diskrimineringslagens preskription)</td></tr>
              <tr><td>Utfall (quality of hire)</td><td>Anonymiseras efter 5 år, aggregat behålls</td></tr>
            </tbody>
          </table>
          <button className="btn primary" onClick={runRetention} data-testid="run-retention">Kör gallringsgranskning nu</button>
          <div className="muted small" style={{ marginTop: 8 }}>{avslagCount} avslagna poster omfattas av granskningen.</div>
        </div>
      )}

      {tab === 'marketplace' && (
        <div className="card" data-testid="compliance-marketplace">
          <h3 style={{ marginBottom: 6 }}>Integrationer & marketplace</h3>
          <div className="muted small" style={{ marginBottom: 12 }}>Koppla på verktygen ni redan använder. ({integrations.filter(i => i.connected).length}/{integrations.length} anslutna)</div>
          <div className="integration-grid">
            {integrations.map(i => (
              <div key={i.id} className={`integration-card${i.connected ? ' on' : ''}`} data-testid={`integration-${i.id}`}>
                <span className="integration-ico">{i.ikon}</span>
                <div style={{ flex: 1 }}>
                  <b className="small">{i.namn}</b>
                  <div className="muted small">{i.kategori}</div>
                </div>
                <label className="switch">
                  <input type="checkbox" checked={i.connected} onChange={() => toggleIntegration(i.id)} data-testid={`integration-toggle-${i.id}`} />
                  <span className="slider" />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
