import { Fragment, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Radar } from '../components/charts'
import { useStore } from '../store'
import type { OfferDraft } from '../types'

const TOP3 = ['c-johan', 'c-lisa', 'c-amir']
const CONFETTI_COLORS = ['#1F5C46', '#3D7A63', '#7FD4AF', '#2563EB', '#F5C542']
const kr = (n: number) => n.toLocaleString('sv-SE') + ' kr'

// Parsar "52 000 – 62 000 kr/mån" → [52000, 62000]
function parseSpan(span: string): [number, number] | null {
  const nums = span.replace(/\s/g, '').match(/\d{4,6}/g)
  if (!nums || nums.length < 2) return null
  return [Number(nums[0]), Number(nums[1])]
}

// ---------- Signaturplatta (canvas) ----------

function SignaturePad({ onSign }: { onSign: (dataUrl: string) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const [hasInk, setHasInk] = useState(false)

  useEffect(() => {
    const cv = ref.current!
    const ctx = cv.getContext('2d')!
    ctx.strokeStyle = '#16241E'; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  }, [])

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect()
    return { x: e.clientX - r.left, y: e.clientY - r.top }
  }
  const down = (e: React.PointerEvent) => { drawing.current = true; const ctx = ref.current!.getContext('2d')!; const p = pos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y) }
  const move = (e: React.PointerEvent) => { if (!drawing.current) return; const ctx = ref.current!.getContext('2d')!; const p = pos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); if (!hasInk) setHasInk(true) }
  const up = () => { drawing.current = false }
  const clear = () => { const cv = ref.current!; cv.getContext('2d')!.clearRect(0, 0, cv.width, cv.height); setHasInk(false) }

  return (
    <div>
      <canvas
        ref={ref} width={380} height={120} className={`sign-pad${hasInk ? ' signed' : ''}`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}
        data-testid="sign-pad"
      />
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <button className="btn small" onClick={clear}>Rensa</button>
        <button className={`btn small primary${hasInk ? '' : ' disabled'}`} disabled={!hasInk} onClick={() => onSign(ref.current!.toDataURL())} data-testid="sign-confirm">
          ✓ Signera & acceptera
        </button>
      </div>
    </div>
  )
}

// ---------- Offer management + e-sign ----------

function OfferSection() {
  const { candidates, offerDrafts, roles, roleTitleOf, createOffer, sendOffer, signOffer, can } = useStore()
  const [candId, setCandId] = useState('')
  const [lon, setLon] = useState('')
  const [start, setStart] = useState('2026-09-01')
  const [signing, setSigning] = useState<string | null>(null)

  const eligible = candidates.filter(c =>
    !c.historical && ['slutintervju', 'referenser', 'erbjudande'].includes(c.stage) && !offerDrafts.some(o => o.candidateId === c.id))
  const selected = candidates.find(c => c.id === candId)
  const selectedRole = selected ? roles.find(r => r.id === selected.roleId) : undefined
  const span = selectedRole ? parseSpan(selectedRole.lonespann) : null
  const lonNum = Number(lon)
  const inSpan = !span || (lonNum >= span[0] && lonNum <= span[1])

  const create = async () => {
    if (!selected || !selectedRole || !lonNum) return
    await createOffer(selected.id, selectedRole.id, lonNum, start)
    setCandId(''); setLon('')
  }

  if (!can('operate')) return null

  return (
    <div className="card" data-testid="offer-section">
      <h2 style={{ marginBottom: 4 }}>Skapa & signera erbjudande</h2>
      <div className="muted small" style={{ marginBottom: 12 }}>Lön valideras mot rollens spann. Kandidaten signerar digitalt (e-sign).</div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 8 }}>
        <div>
          <label className="small muted">Kandidat</label>
          <select className="editable-input mini-select" value={candId} onChange={e => setCandId(e.target.value)} data-testid="offer-cand">
            <option value="">— välj —</option>
            {eligible.map(c => <option key={c.id} value={c.id}>{c.name} ({roleTitleOf(c.roleId)})</option>)}
          </select>
        </div>
        <div>
          <label className="small muted">Lön kr/mån {span && <span className="muted">({kr(span[0])}–{kr(span[1])})</span>}</label>
          <input type="number" className="editable-input num-input wide" value={lon} onChange={e => setLon(e.target.value)} data-testid="offer-lon" />
        </div>
        <div>
          <label className="small muted">Startdatum</label>
          <input className="editable-input num-input wide" value={start} onChange={e => setStart(e.target.value)} />
        </div>
        <button className={`btn primary${selected && lonNum && inSpan ? '' : ' disabled'}`} disabled={!selected || !lonNum || !inSpan} onClick={create} data-testid="offer-create">
          Skapa utkast
        </button>
      </div>
      {selected && lonNum > 0 && !inSpan && <div className="small over-budget">⚠ {kr(lonNum)} ligger utanför spannet {span && `${kr(span[0])}–${kr(span[1])}`} — justera innan du skapar.</div>}

      {offerDrafts.length > 0 && (
        <div className="grid" style={{ gap: 10, marginTop: 14 }}>
          {offerDrafts.map(o => <OfferDraftRow key={o.id} o={o} signing={signing} setSigning={setSigning} onSend={sendOffer} onSign={signOffer} />)}
        </div>
      )}
    </div>
  )
}

function OfferDraftRow({ o, signing, setSigning, onSend, onSign }: {
  o: OfferDraft; signing: string | null; setSigning: (id: string | null) => void
  onSend: (id: string) => void; onSign: (id: string, sig: string) => void
}) {
  const { byId, roleTitleOf } = useStore()
  const cand = byId(o.candidateId)
  return (
    <div className="offer-draft" data-testid={`offer-draft-${o.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        <div>
          <b>{cand?.name}</b> <span className="muted small">{cand ? roleTitleOf(cand.roleId) : ''}</span>
          <div className="muted small">{kr(o.lon)}/mån · start {o.startDate}</div>
        </div>
        <span className={`offer-status ${o.status}`}>{o.status}</span>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {o.status === 'utkast' && <button className="btn small primary" onClick={() => onSend(o.id)} data-testid={`offer-send-${o.id}`}>Skicka till kandidat</button>}
        {o.status === 'skickat' && signing !== o.id && <button className="btn small primary" onClick={() => setSigning(o.id)} data-testid={`offer-open-sign-${o.id}`}>✍ Öppna kandidatens signeringsvy</button>}
        {o.status === 'signerat' && (
          <span className="chip" style={{ position: 'relative' }}>
            ✓ Signerat {o.signedDate}
            {o.signature && <img src={o.signature} alt="signatur" style={{ height: 30, marginLeft: 8, verticalAlign: 'middle', filter: 'contrast(1.2)' }} />}
          </span>
        )}
      </div>
      {signing === o.id && o.status === 'skickat' && (
        <div style={{ marginTop: 12, padding: 12, background: 'var(--bg)', borderRadius: 11 }}>
          <div className="small" style={{ marginBottom: 8 }}>📱 <b>Kandidatens vy:</b> {cand?.name}, du har fått ett erbjudande på {kr(o.lon)}/mån. Signera för att acceptera:</div>
          <SignaturePad onSign={sig => { onSign(o.id, sig); setSigning(null) }} />
        </div>
      )}
    </div>
  )
}

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
          <div className="sub">Jämförbara scorecards mot samma kravprofil → dokumenterade, försvarbara beslut. Skapa & signera erbjudanden digitalt.</div>
        </div>
      </div>

      <OfferSection />

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
