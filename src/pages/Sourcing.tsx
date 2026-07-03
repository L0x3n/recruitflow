import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SOURCED_POOL } from '../data'
import { matchLabel, matchProfile, searchProfiles } from '../sourcing'
import type { RankedProfile } from '../sourcing'
import { useStore } from '../store'
import type { Role, SourcedProfile } from '../types'

const EXAMPLES = [
  'senior backendutvecklare i Stockholm med Kafka och open source',
  'ux-designer med designsystem och tillgänglighet',
  'data engineer som kan dbt och python',
  'b2b-säljare med saas-erfarenhet',
]

const SWEEP_SOURCES = ['GitHub', 'Portföljer', 'Konferenstalks', 'Forskningsartiklar', 'Stack Overflow', 'Meetups', 'LinkedIn', 'Dribbble']

const FRAG_ICON: Record<string, string> = {
  GitHub: '⌥', Portfölj: '◈', Konferens: '🎤', Forskning: '📄', LinkedIn: 'in',
  Blogg: '✎', 'Stack Overflow': '⌂', Meetup: '◎', Dribbble: '◐',
}

function ConfidenceBar({ pct }: { pct: number }) {
  const cls = pct >= 85 ? 'high' : pct >= 72 ? 'mid' : 'low'
  return <span className={`conf-bar ${cls}`}><span style={{ width: `${pct}%` }} /></span>
}

function SweepAnimation() {
  return (
    <div className="card sweep">
      <div className="sweep-title">
        <span className="sweep-spinner" /> Söker över hela webben & ditt nätverk…
      </div>
      <div className="sweep-sources">
        {SWEEP_SOURCES.map((s, i) => (
          <div key={s} className="sweep-src" style={{ animationDelay: `${i * 0.14}s` }}>
            <span className="sweep-check">✓</span> {s}
          </div>
        ))}
      </div>
      <div className="muted small" style={{ marginTop: 10 }}>
        Talentium-stil: profiler byggs ur fragment från många källor — inte inväntade ansökningar.
      </div>
    </div>
  )
}

function MatchBreakdown({ profile, role }: { profile: SourcedProfile; role: Role }) {
  const match = useMemo(() => matchProfile(profile, role), [profile, role])
  const cls = match.score >= 80 ? 'excellent' : match.score >= 65 ? 'strong' : match.score >= 50 ? 'ok' : 'weak'
  return (
    <div className="match-box">
      <div className="match-head">
        <div className={`match-score ${cls}`}>{match.score}%</div>
        <div>
          <b>{matchLabel(match.score)}</b> mot {role.titel}
          <div className="muted small">Förklarbar — varje bidrag syns, aldrig ett svart lådnummer</div>
        </div>
      </div>
      <div className="match-contribs">
        {match.contributions.map((c, i) => (
          <div key={i} className={`contrib ${c.delta >= 0 ? 'plus' : 'minus'}`}>
            <span className="contrib-delta">{c.delta >= 0 ? '+' : ''}{c.delta}</span>
            <span>{c.reason}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ProfileCard({ ranked, role }: { ranked: RankedProfile; role: Role | undefined }) {
  const { saveSourced, savedSourced, candidates } = useStore()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const p = ranked.profile
  const alreadySaved = savedSourced.includes(p.id) || candidates.some(c => c.id === `src-${p.id}`)

  const save = async () => {
    if (!role) return
    const id = await saveSourced(p.id, role.id)
    if (id) navigate(`/kandidater/${id}?roll=${role.id}`)
  }

  return (
    <div className="card source-card" data-testid={`sourced-${p.id}`}>
      <div className="source-head">
        <div className="source-avatar">{p.name.split(/\s+/).map(w => w[0]).join('').slice(0, 2)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <b>{p.name}</b>
            <span className="chip gray">{p.title}</span>
            <span className="muted small">📍 {p.location} · {p.years} år</span>
          </div>
          <div className="muted small" style={{ marginTop: 2 }}>
            Relevans {ranked.relevance}% · matchade: {ranked.hits.join(', ')}
          </div>
        </div>
        {role && (
          <div className={`match-chip ${matchProfile(p, role).score >= 65 ? 'good' : ''}`}>
            {matchProfile(p, role).score}%
          </div>
        )}
      </div>

      <p style={{ fontSize: 13, margin: '10px 0' }}>{p.summary}</p>

      <div className="chip-row" style={{ marginBottom: 8 }}>
        {p.skills.map(s => <span key={s} className="chip">{s}</span>)}
      </div>

      <div className="source-actions">
        <button className="btn small" onClick={() => setOpen(o => !o)} data-testid={`profile-toggle-${p.id}`}>
          {open ? '▲ Dölj profil' : '▼ Smart profil & match'}
        </button>
        {alreadySaved
          ? <span className="chip">✓ I pipelinen</span>
          : <button className="btn small primary" onClick={save} disabled={!role} data-testid={`save-${p.id}`}>
              + Spara till pipeline
            </button>}
      </div>

      {open && (
        <div className="source-detail">
          <h4>Smart profil — sammanslagen ur {p.fragments.length} källor</h4>
          <div className="muted small" style={{ marginBottom: 8 }}>Auto-uppdateras när personen byter jobb eller lär sig nytt.</div>
          {p.fragments.map((f, i) => (
            <div key={i} className="fragment">
              <span className="frag-src">{FRAG_ICON[f.source] ?? '•'} {f.source}</span>
              <span className="frag-detail">{f.detail}</span>
              <ConfidenceBar pct={f.confidence} />
              <span className="frag-pct">{f.confidence}%</span>
            </div>
          ))}
          <h4 style={{ marginTop: 12 }}>Tillväxtsignaler</h4>
          <ul className="growth">
            {p.growthSignals.map((g, i) => <li key={i}>{g}</li>)}
          </ul>
          {role && <MatchBreakdown profile={p} role={role} />}
        </div>
      )}
    </div>
  )
}

export function Sourcing() {
  const { roles } = useStore()
  const [query, setQuery] = useState('')
  const [roleId, setRoleId] = useState(roles[0]?.id ?? '')
  const [results, setResults] = useState<RankedProfile[] | null>(null)
  const [searching, setSearching] = useState(false)

  const role = roles.find(r => r.id === roleId)

  const runSearch = (q: string) => {
    setQuery(q)
    setSearching(true)
    setResults(null)
    window.setTimeout(() => {
      setResults(searchProfiles(q, SOURCED_POOL))
      setSearching(false)
    }, 1700)
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>AI-sourcing 🔍</h1>
          <div className="sub">
            Sök över hela webben och ditt nätverk med naturligt språk. Profiler byggs automatiskt ur fragment —
            matchade mot kravprofilen, förklarbart.
          </div>
        </div>
        <div>
          <label className="small muted">Sourca för roll</label>
          <select className="editable-input mini-select" value={roleId} onChange={e => setRoleId(e.target.value)} data-testid="source-role">
            {roles.filter(r => r.id !== 'historisk').map(r => <option key={r.id} value={r.id}>{r.titel}</option>)}
          </select>
        </div>
      </div>

      <div className="card">
        <div className="search-bar-lg">
          <span className="search-ico">⌕</span>
          <input
            placeholder='t.ex. "senior backendutvecklare i Stockholm med Kafka och open source"'
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && query.trim() && runSearch(query)}
            data-testid="source-query"
          />
          <button
            className={`btn primary${query.trim() ? '' : ' disabled'}`}
            disabled={!query.trim()}
            onClick={() => runSearch(query)}
            data-testid="source-search"
          >
            Sök över webben
          </button>
        </div>
        <div className="example-chips">
          <span className="muted small">Prova:</span>
          {EXAMPLES.map(ex => (
            <button key={ex} className="example-chip" onClick={() => runSearch(ex)}>{ex}</button>
          ))}
        </div>
      </div>

      {searching && <SweepAnimation />}

      {results && !searching && (
        <>
          <div className="muted small">
            {results.length} profiler funna över webben för ”{query}” — rankade på relevans, matchade mot {role?.titel}.
          </div>
          {results.length === 0 && (
            <div className="card muted">Inga träffar — prova bredare ord (t.ex. bara ”backend” eller ”design”).</div>
          )}
          {results.map(r => <ProfileCard key={r.profile.id} ranked={r} role={role} />)}
        </>
      )}

      {!results && !searching && (
        <div className="card muted small">
          Skriv en fri sökning ovan eller klicka på ett exempel. All data är fiktiv och sökningen körs mot en mockad talangpool.
        </div>
      )}
    </div>
  )
}
