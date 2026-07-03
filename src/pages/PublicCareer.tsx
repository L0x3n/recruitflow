import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'

// Publik karriärsida (Teamtailor-stil) — renderar de publicerade blocken + jobblista.
export function PublicCareer() {
  const { career, roles } = useStore()
  const navigate = useNavigate()
  const activeRoles = roles.filter(r => r.id !== 'historisk')

  if (!career.published) {
    return (
      <div className="public-page">
        <div className="public-body">
          <div className="public-card" style={{ textAlign: 'center' }}>
            <h1>Karriärsidan är inte publicerad ännu</h1>
            <p className="muted">Kom tillbaka snart — vi fyller på med lediga tjänster.</p>
            <button className="btn" style={{ marginTop: 14 }} onClick={() => navigate('/')}>Till inloggningen →</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="public-page" style={{ ['--accent' as string]: career.accent }}>
      <div className="public-topbar" style={{ background: career.accent }}>
        <div className="logo">
          <div className="logo-mark" style={{ background: 'rgba(255,255,255,0.18)' }}>{career.companyName[0]}</div>
          <div>
            <div className="logo-name" style={{ color: '#fff' }}>{career.companyName}</div>
            <div className="logo-sub" style={{ color: 'rgba(255,255,255,0.8)' }}>Karriär</div>
          </div>
        </div>
      </div>

      <div className="career-public">
        {career.blocks.filter(b => b.enabled).map(b => {
          if (b.type === 'hero') return (
            <div key={b.id} className="cpub-hero" style={{ background: career.accent }}>
              <h1>{b.title}</h1>
              <p>{b.text}</p>
            </div>
          )
          if (b.type === 'about') return (
            <div key={b.id} className="cpub-section"><h2>{b.title}</h2><p>{b.text}</p></div>
          )
          if (b.type === 'benefits') return (
            <div key={b.id} className="cpub-section">
              <h2>{b.title}</h2>
              <div className="cpub-benefits">{(b.items ?? []).map((it, i) => <div key={i} className="cpub-benefit">✓ {it}</div>)}</div>
            </div>
          )
          if (b.type === 'jobs') return (
            <div key={b.id} className="cpub-section" id="jobs">
              <h2>{b.title}</h2>
              <div className="cpub-jobs">
                {activeRoles.map(r => (
                  <button key={r.id} className="cpub-job" onClick={() => navigate(`/jobb?roll=${r.id}`)} data-testid={`career-job-${r.id}`}>
                    <div>
                      <b>{r.titel}</b>
                      <div className="muted small">{r.chef} · {r.chefTitel} · {r.lonespann}</div>
                    </div>
                    <span className="cp-btn sm" style={{ background: career.accent }}>Ansök →</span>
                  </button>
                ))}
              </div>
            </div>
          )
          if (b.type === 'quote') return (
            <div key={b.id} className="cpub-quote">”{b.text}”<div className="cp-quote-author">— {b.author}</div></div>
          )
          return null
        })}
        <div className="cpub-foot">Drivs av RecruitFlow · demo · all data är fiktiv</div>
      </div>
    </div>
  )
}
