import { Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar } from '../components/charts'
import { useStore } from '../store'

const TOP3 = ['c-johan', 'c-lisa', 'c-amir']
const CONFETTI_COLORS = ['#1F5C46', '#3D7A63', '#7FD4AF', '#2563EB', '#F5C542']

function Confetti() {
  return (
    <>
      {Array.from({ length: 14 }, (_, i) => (
        <span
          key={i}
          className="confetti-bit"
          style={{
            left: `${6 + i * 6.8}%`,
            background: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
            animationDelay: `${(i % 5) * 0.18}s`,
          }}
        />
      ))}
    </>
  )
}

export function Erbjudanden() {
  const navigate = useNavigate()
  const { byId, roles, offers, remindOffer, roleTitleOf } = useStore()
  const role = roles.find(r => r.id === 'backend')!
  const cands = TOP3.map(id => byId(id)!)

  // Medelpoäng per kriterium per kandidat (över alla scorecards)
  const avgFor = (candId: string, kriterium: string) => {
    const c = byId(candId)!
    const scores = c.scorecards.flatMap(s => s.criteria.filter(cr => cr.name === kriterium).map(cr => cr.score))
    return scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Erbjudanden & beslut</h1>
          <div className="sub">Jämförbara scorecards mot samma kravprofil → dokumenterade, försvarbara beslut.</div>
        </div>
      </div>

      <div className="card" data-tour="beslut">
        <h2 style={{ marginBottom: 4 }}>Beslutsvy — {role.titel}</h2>
        <div className="muted small" style={{ marginBottom: 14 }}>
          Topp 3 kandidater sida vid sida. Samma kriterierader från kravprofilen, poäng per bedömare.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18, alignItems: 'start' }}>
          <div className="compare-grid">
            <div className="cg-head">Kriterium (från kravprofilen)</div>
            {cands.map((c, i) => (
              <div key={c.id} className={`cg-head${i === 0 ? ' winner' : ''}`}>
                {c.name} {i === 0 && '🏆'}
                <div className="muted small" style={{ fontWeight: 500 }}>
                  {c.scorecards.length} scorecards · snitt {c.score?.toFixed(1).replace('.', ',')}
                </div>
              </div>
            ))}
            {role.kriterier.map(k => (
              <Fragment key={k}>
                <div>{k}</div>
                {cands.map((c, i) => {
                  const per = c.scorecards
                    .map(s => ({ who: s.assessor.split(' ')[0], v: s.criteria.find(cr => cr.name === k)?.score }))
                    .filter(x => x.v !== undefined)
                  return (
                    <div key={c.id + k} className={i === 0 ? 'winner' : ''}>
                      <b>{avgFor(c.id, k).toFixed(1).replace('.', ',')}</b>
                      <span className="muted small"> ({per.map(p => `${p.who} ${p.v}`).join(' · ')})</span>
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>

          <div>
            <Radar
              axes={role.kriterier}
              series={cands.map(c => ({
                name: c.name,
                values: role.kriterier.map(k => avgFor(c.id, k)),
              }))}
            />
          </div>
        </div>

        <div className="card" style={{ marginTop: 16, background: 'var(--bg)', boxShadow: 'none' }}>
          <h3 style={{ marginBottom: 6 }}>Beslutsmotivering</h3>
          <p style={{ fontSize: 13.5 }}>
            Johan Ek erbjuds tjänsten. Han hade processens högsta snitt (4,5) med särskild styrka i samarbete
            och problemlösning — de två kriterier som väger tyngst mot succékriterierna för rollen. Lisa Bergström
            var starkast på datamodellering och kvarstår som stark reserv; Amir Haddad var snabbast i caset men
            visade lägre driv i produktdiskussionen. Beslutet fattades enhälligt mot kravprofilens kriterier.
          </p>
          <div className="muted small" style={{ marginTop: 8 }}>
            Signerat: <b>Marcus Öhrn</b> (rekryterande chef) · <b>Eva Lindqvist</b> (rekryterare) — 2026-06-25 16:40
          </div>
        </div>
        <div className="banner-ok" style={{ marginTop: 10 }}>✓ Beslutet är dokumenterat och försvarbart.</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {offers.map(o => {
          const c = byId(o.candidateId)!
          const accepted = o.status === 'accepterat'
          return (
            <div key={o.id} className={`offer-card${accepted ? ' accepted' : ''}`}>
              {accepted && <Confetti />}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <h2>{c.name}</h2>
                <span className={accepted ? 'chip' : 'chip warn'}>
                  {accepted ? `✓ Accepterat ${o.acceptedDate}` : `⏰ Väntar — går ut ${o.expiryDate}`}
                </span>
              </div>
              <div className="muted small" style={{ marginBottom: 10 }}>{roleTitleOf(c.roleId)}</div>
              <table className="tbl">
                <tbody>
                  <tr><td className="muted">Skickat</td><td className="num">{o.sentDate}</td></tr>
                  <tr><td className="muted">Giltigt t.o.m.</td><td className="num">{o.expiryDate}</td></tr>
                  <tr><td className="muted">Lön</td><td className="num"><b>{o.lon}</b></td></tr>
                  <tr><td className="muted">Startdatum</td><td className="num">{o.startDate}</td></tr>
                </tbody>
              </table>
              {!accepted && (
                <button
                  className={`btn small${o.remindedAt ? ' disabled' : ''}`}
                  style={{ marginTop: 10 }}
                  disabled={!!o.remindedAt}
                  onClick={() => remindOffer(o.id)}
                >
                  {o.remindedAt ? `Påminnelse skickad ${o.remindedAt.slice(11)} ✓` : 'Skicka påminnelse'}
                </button>
              )}
              <button
                className="btn small"
                style={{ marginTop: 10, marginLeft: accepted ? 0 : 8 }}
                onClick={() => navigate(`/kandidater/${c.id}?tab=oversikt`)}
              >
                Öppna kandidat →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
