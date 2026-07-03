import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FEEDBACK_REQUESTS, roleTitle } from '../data'
import { useStore } from '../store'

function FakeAudio({ duration }: { duration: string }) {
  const [playing, setPlaying] = useState(false)
  const [pct, setPct] = useState(0)
  const timer = useRef<number | null>(null)

  useEffect(() => () => { if (timer.current) window.clearInterval(timer.current) }, [])

  const toggle = () => {
    if (playing) {
      if (timer.current) window.clearInterval(timer.current)
      setPlaying(false)
      return
    }
    setPlaying(true)
    timer.current = window.setInterval(() => {
      setPct(p => {
        if (p >= 100) {
          if (timer.current) window.clearInterval(timer.current)
          setPlaying(false)
          return 0
        }
        return p + 2.5
      })
    }, 100)
  }

  return (
    <div className="audio-fake">
      <button className="play" onClick={toggle}>{playing ? '❚❚' : '▶'}</button>
      <div className="bar"><div style={{ width: `${pct}%` }} /></div>
      <span className="dur">{duration}</span>
    </div>
  )
}

export function FeedbackPage() {
  const navigate = useNavigate()
  const { byId, demo } = useStore()
  const hero = FEEDBACK_REQUESTS.find(f => f.id === 'f-johan-case')!
  const heroCand = byId(hero.candidateId)!
  const heroCard = heroCand.scorecards.find(s => s.stage === 'case')!

  const answered = FEEDBACK_REQUESTS.filter(f => f.status === 'besvarad')
  const pending = FEEDBACK_REQUESTS.filter(f => f.status === 'väntande')

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Feedback från chefer</h1>
          <div className="sub">Modulen som stänger läckan — chefen svarar via länk, utan inloggning, på under en minut.</div>
        </div>
      </div>

      <div className="fb-strip">
        <div className="fb-before">
          <b>✗ Förr</b>
          <div style={{ marginTop: 4, fontSize: 13 }}>3 dagars svarstid — bedömningen bortglömd i Slack, omöjlig att jämföra i efterhand.</div>
        </div>
        <div className="fb-after">
          <b>✓ Nu</b>
          <div style={{ marginTop: 4, fontSize: 13 }}>4 timmars svarstid — strukturerad, sparad och kopplad till kandidat, roll och steg.</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div className="phone-frame">
          <div className="ph-head">
            <b>Chefens vy</b> — länk via sms/mail, ingen inloggning
          </div>
          <div className="ph-body">
            <div style={{ fontSize: 13 }}>
              Hej Marcus! 👋<br />
              Hur presterade <b>Johan Ek</b> på tekniska intervjun för <b>Backend-utvecklare</b>?
            </div>
            <div className="ph-btns">
              <button onClick={demo}>🎤 Röst</button>
              <button onClick={demo}>📷 Foto</button>
              <button onClick={demo}>⌨️ Text</button>
            </div>
            <div className="muted small" style={{ marginTop: 10 }}>
              Svaret struktureras automatiskt mot rollens scorecard-kriterier.
            </div>
          </div>
        </div>

        <div className="card" style={{ flex: 1, minWidth: 380 }} data-tour="voice-memo">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
            <h2>Röstmemo 0:42 → strukturerad feedback på 30 sekunder</h2>
            <span className="chip">svarstid {hero.responseTime}</span>
          </div>
          <div className="muted small" style={{ margin: '4px 0 12px' }}>
            Marcus Öhrn · Teknisk intervju/Case · Johan Ek · Backend-utvecklare
          </div>
          <FakeAudio duration={hero.voice!.duration} />
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '12px 0 8px' }}>
            <span style={{ fontSize: 18 }}>↓</span>
            <span className="small muted">tolkas & struktureras automatiskt</span>
          </div>
          <div className="scorecard" style={{ marginBottom: 8 }}>
            {heroCard.criteria.map(cr => (
              <div key={cr.name} className="sc-row">
                <span className="sc-name">{cr.name}</span>
                <span className="sc-dots">
                  {[1, 2, 3, 4, 5].map(n => <span key={n} className={`sc-dot${n <= cr.score ? ' on' : ''}`} />)}
                </span>
                <b style={{ width: 14, textAlign: 'right' }}>{cr.score}</b>
              </div>
            ))}
            <div className="sc-motiv">Citat: ”{hero.voice!.quote}”</div>
          </div>
          <button className="btn small" onClick={() => navigate(`/kandidater/${hero.candidateId}?tab=bedomningar`)}>
            Visa i kandidatprofilen →
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div className="card">
          <h2 style={{ marginBottom: 10 }}>Väntande förfrågningar ({pending.length})</h2>
          <div className="grid" style={{ gap: 9 }}>
            {pending.map(f => {
              const c = byId(f.candidateId)
              return (
                <div key={f.id} className="fb-item">
                  <div className="fb-main">
                    <b>{c?.name}</b> · <span className="muted small">{roleTitle(c?.roleId ?? '')}</span>
                    <div className="muted small">{f.stageLabel} · till {f.till} · skickad {f.sentAt}</div>
                  </div>
                  <span className="fb-status väntande">väntande</span>
                  <button className="btn small" onClick={demo}>Påminn</button>
                </div>
              )
            })}
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginBottom: 10 }}>Besvarade ({answered.length})</h2>
          <div className="grid" style={{ gap: 9 }}>
            {answered.map(f => {
              const c = byId(f.candidateId)
              return (
                <div key={f.id} className="fb-item">
                  <div className="fb-main">
                    <b>{c?.name}</b> · <span className="muted small">{roleTitle(c?.roleId ?? '')}</span>
                    <div className="muted small">
                      {f.stageLabel} · {f.till} · via {f.channel === 'röst' ? '🎤 röst' : f.channel === 'foto' ? '📷 foto' : '⌨️ text'}
                    </div>
                  </div>
                  <span className="chip gray">{f.responseTime}</span>
                  <span className="fb-status besvarad">besvarad</span>
                  <button
                    className="btn small"
                    onClick={() => navigate(`/kandidater/${f.candidateId}?tab=bedomningar`)}
                  >
                    Öppna →
                  </button>
                </div>
              )
            })}
          </div>
          <div className="muted small" style={{ marginTop: 10 }}>
            Varje svar är kopplat till kandidat + roll + steg — inget flyter fritt i inkorgar.
          </div>
        </div>
      </div>
    </div>
  )
}
