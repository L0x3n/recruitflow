import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { Candidate, FeedbackRequest, Role, ScorecardCriterion } from '../types'

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

// ---------- Chefens interaktiva vy ----------

type Phase = 'idle' | 'rec' | 'photo' | 'text' | 'preview'
type Channel = 'röst' | 'foto' | 'text'

const FALLBACK_CRITERIA = ['Fackkompetens', 'Erfarenhet', 'Samarbete & kommunikation', 'Problemlösning', 'Motivation & driv']

function PhoneInner({ req, cand, role }: { req: FeedbackRequest; cand: Candidate; role?: Role }) {
  const { answerFeedback } = useStore()
  const [phase, setPhase] = useState<Phase>('idle')
  const [channel, setChannel] = useState<Channel>('text')
  const [secs, setSecs] = useState(0)
  const [textDraft, setTextDraft] = useState('')
  const [scores, setScores] = useState<number[]>([])
  const [motivation, setMotivation] = useState('')

  const criteriaNames = role?.kriterier ?? FALLBACK_CRITERIA
  const first = cand.name.split(' ')[0]
  const chefFirst = req.till.split(' ')[0]

  useEffect(() => {
    if (phase !== 'rec') return
    const t = window.setInterval(() => setSecs(s => s + 1), 1000)
    return () => window.clearInterval(t)
  }, [phase])

  const toPreview = (ch: Channel, draftScores: number[], draftMotivation: string) => {
    setChannel(ch)
    setScores(draftScores)
    setMotivation(draftMotivation)
    setPhase('preview')
  }

  const stopRecording = () => toPreview(
    'röst',
    criteriaNames.map((_, i) => [4, 4, 5, 4, 4][i % 5]),
    `${first} löste uppgiften metodiskt och kommunicerade tydligt hela vägen — stark helhet, redo för nästa steg.`,
  )

  const interpretPhoto = () => toPreview(
    'foto',
    criteriaNames.map((_, i) => [4, 3, 4, 4, 4][i % 5]),
    `Anteckningar tolkade: ${first} visade gott tempo och struktur, några frågetecken på detaljnivå — godkänd vidare.`,
  )

  const structureText = () => toPreview('text', criteriaNames.map(() => 4), textDraft.trim())

  const send = () => {
    const criteria: ScorecardCriterion[] = criteriaNames.map((name, i) => ({ name, score: scores[i] ?? 4 }))
    const dur = `0:${String(Math.max(secs, 8)).padStart(2, '0')}`
    answerFeedback(req.id, channel, criteria, motivation, dur)
  }

  const reset = () => { setPhase('idle'); setSecs(0); setTextDraft('') }

  return (
    <div className="ph-body">
      {phase === 'idle' && (
        <>
          <div style={{ fontSize: 13 }}>
            Hej {chefFirst}! 👋<br />
            Hur presterade <b>{cand.name}</b> på <b>{req.stageLabel.replace(/^Nästa steg: /, '').toLowerCase()}</b>?
          </div>
          <div className="ph-btns">
            <button onClick={() => { setSecs(0); setPhase('rec') }}>🎤 Röst</button>
            <button onClick={() => setPhase('photo')}>📷 Foto</button>
            <button onClick={() => setPhase('text')}>⌨️ Text</button>
          </div>
          <div className="muted small" style={{ marginTop: 10 }}>
            Svaret struktureras automatiskt mot rollens scorecard-kriterier.
          </div>
        </>
      )}

      {phase === 'rec' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
            <span className="rec-dot" />
            <b style={{ fontSize: 13 }}>Spelar in… 0:{String(secs).padStart(2, '0')}</b>
          </div>
          <div className="rec-bars">
            {Array.from({ length: 24 }, (_, i) => <span key={i} style={{ animationDelay: `${(i % 6) * 0.13}s` }} />)}
          </div>
          <button className="btn small" style={{ marginTop: 12, width: '100%' }} onClick={stopRecording}>
            ⏹ Stoppa inspelningen
          </button>
        </>
      )}

      {phase === 'photo' && (
        <>
          <div className="photo-note">
            <div>✎ {first} — {req.stageLabel.replace(/^Nästa steg: /, '')}</div>
            <div>bra struktur, tydligt driv</div>
            <div>tempo ↑ · detaljer ?</div>
            <div>→ vidare till nästa steg!</div>
          </div>
          <button className="btn small" style={{ marginTop: 12, width: '100%' }} onClick={interpretPhoto}>
            🔍 Tolka anteckningarna
          </button>
        </>
      )}

      {phase === 'text' && (
        <>
          <textarea
            className="editable-input"
            rows={4}
            style={{ resize: 'vertical' }}
            placeholder={`Hur gick det för ${first}? Skriv fritt — strukturen ordnar RecruitFlow.`}
            value={textDraft}
            onChange={e => setTextDraft(e.target.value)}
          />
          <button
            className={`btn small${textDraft.trim().length >= 10 ? '' : ' disabled'}`}
            style={{ marginTop: 10, width: '100%' }}
            disabled={textDraft.trim().length < 10}
            onClick={structureText}
          >
            ✦ Strukturera svaret
          </button>
        </>
      )}

      {phase === 'preview' && (
        <>
          <div className="small" style={{ fontWeight: 700, marginBottom: 6 }}>
            {channel === 'röst' ? `🎤 Röstmemo 0:${String(Math.max(secs, 8)).padStart(2, '0')}` : channel === 'foto' ? '📷 Foto' : '⌨️ Text'} → strukturerad scorecard
          </div>
          {criteriaNames.map((name, i) => (
            <div key={name} className="sc-row" style={{ fontSize: 12 }}>
              <span className="sc-name">{name}</span>
              <span className="sc-dots">
                {[1, 2, 3, 4, 5].map(n => (
                  <span
                    key={n}
                    className={`sc-dot clickable${n <= (scores[i] ?? 4) ? ' on' : ''}`}
                    onClick={() => setScores(s => s.map((v, j) => j === i ? n : v))}
                  />
                ))}
              </span>
            </div>
          ))}
          <textarea
            className="editable-input"
            rows={3}
            style={{ marginTop: 8, fontSize: 12, resize: 'vertical' }}
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
          />
          <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
            <button className="btn small" onClick={reset}>↺ Börja om</button>
            <button className="btn small primary" style={{ flex: 1 }} onClick={send} data-testid="phone-send">
              Skicka svar ✓
            </button>
          </div>
          <div className="muted small" style={{ marginTop: 8 }}>
            Justera poängen genom att klicka på prickarna.
          </div>
        </>
      )}
    </div>
  )
}

function PhoneDemo() {
  const { feedback, byId, roles, roleTitleOf } = useStore()
  const pending = feedback.filter(f => f.status === 'väntande')
  const target = pending[0]
  const cand = target ? byId(target.candidateId) : undefined
  const role = cand ? roles.find(r => r.id === cand.roleId) : undefined

  return (
    <div className="phone-frame">
      <div className="ph-head">
        <b>Chefens vy</b> — länk via sms/mail, ingen inloggning
        {target && cand && (
          <div style={{ opacity: 0.85, marginTop: 2 }}>{roleTitleOf(cand.roleId)} · {pending.length} väntande</div>
        )}
      </div>
      {target && cand
        ? <PhoneInner key={target.id} req={target} cand={cand} role={role} />
        : (
          <div className="ph-body">
            <div style={{ fontSize: 13 }}>
              Inga väntande förfrågningar 🎉<br />
              <span className="muted small">Alla chefer har svarat — läckan är stängd på riktigt.</span>
            </div>
          </div>
        )}
    </div>
  )
}

// ---------- Sidan ----------

export function FeedbackPage() {
  const navigate = useNavigate()
  const { byId, feedback, remindFeedback, roleTitleOf } = useStore()
  const hero = feedback.find(f => f.id === 'f-johan-case')!
  const heroCand = byId(hero.candidateId)!
  const heroCard = heroCand.scorecards.find(s => s.stage === 'case')!

  const answered = feedback.filter(f => f.status === 'besvarad')
  const pending = feedback.filter(f => f.status === 'väntande')

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Feedback från chefer</h1>
          <div className="sub">Modulen som stänger läckan — chefen svarar via länk, utan inloggning, på under en minut. Testa själv i telefonen!</div>
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
        <PhoneDemo />

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
            {pending.length === 0 && <div className="muted small">Inga väntande — alla chefer har svarat. 🎉</div>}
            {pending.map(f => {
              const c = byId(f.candidateId)
              return (
                <div key={f.id} className="fb-item">
                  <div className="fb-main">
                    <b>{c?.name}</b> · <span className="muted small">{c ? roleTitleOf(c.roleId) : ''}</span>
                    <div className="muted small">{f.stageLabel} · till {f.till} · skickad {f.sentAt}</div>
                    {f.remindedAt && <div className="muted small">↻ Påmind {f.remindedAt.slice(11)}</div>}
                  </div>
                  <span className="fb-status väntande">väntande</span>
                  <button
                    className={`btn small${f.remindedAt ? ' disabled' : ''}`}
                    disabled={!!f.remindedAt}
                    onClick={() => remindFeedback(f.id)}
                  >
                    {f.remindedAt ? 'Påmind ✓' : 'Påminn'}
                  </button>
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
                    <b>{c?.name}</b> · <span className="muted small">{c ? roleTitleOf(c.roleId) : ''}</span>
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
