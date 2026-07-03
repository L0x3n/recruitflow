import { useMemo, useState } from 'react'
import { useStore } from '../store'
import type { Candidate, HeadhuntLink } from '../types'

const STAGE_RANK: Record<string, number> = {
  nya: 0, screening: 1, intervju: 2, case: 3, slutintervju: 4, referenser: 5, erbjudande: 6, anstalld: 7, avslag: -1,
}

function linkUrl(id: string) {
  return `${window.location.origin}/jobb?hh=${id}`
}

function CopyLink({ id }: { id: string }) {
  const { toast } = useStore()
  const copy = async () => {
    try { await navigator.clipboard.writeText(linkUrl(id)); toast('Länk kopierad') }
    catch { toast('Kunde inte kopiera') }
  }
  return <button className="btn small" onClick={copy} data-testid={`copy-${id}`}>⧉ Kopiera</button>
}

function LinkRow({ link, apps }: { link: HeadhuntLink; apps: Candidate[] }) {
  const { roleTitleOf } = useStore()
  const reached = apps.filter(c => STAGE_RANK[c.stage] >= 2).length
  const conv = link.clicks ? Math.round((apps.length / link.clicks) * 100) : 0
  return (
    <tr>
      <td><code className="hh-code">{link.id}</code></td>
      <td>{roleTitleOf(link.roleId)}</td>
      <td className="num">{link.clicks}</td>
      <td className="num">{apps.length}</td>
      <td className="num">{conv}%</td>
      <td className="num">{reached}</td>
      <td><CopyLink id={link.id} /> <a className="btn small" href={linkUrl(link.id)} target="_blank" rel="noreferrer">↗ Öppna</a></td>
    </tr>
  )
}

function CreateLink() {
  const { roles, createHeadhuntLink } = useStore()
  const [roleId, setRoleId] = useState(roles.find(r => r.id !== 'historisk')?.id ?? '')
  const [created, setCreated] = useState<string | null>(null)

  const make = async () => {
    const id = await createHeadhuntLink(roleId)
    if (id) setCreated(id)
  }

  return (
    <div className="card">
      <h3 style={{ marginBottom: 8 }}>Skapa ny headhunt-länk</h3>
      <div className="muted small" style={{ marginBottom: 10 }}>
        En unik, spårbar länk per roll. Dela på LinkedIn, i mejl eller på en mässa — varje ansökan tillskrivs dig.
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="editable-input mini-select" value={roleId} onChange={e => setRoleId(e.target.value)} data-testid="hh-role">
          {roles.filter(r => r.id !== 'historisk').map(r => <option key={r.id} value={r.id}>{r.titel}</option>)}
        </select>
        <button className="btn primary" onClick={make} data-testid="hh-create">+ Skapa länk</button>
      </div>
      {created && (
        <div className="hh-created" data-testid="hh-created">
          <span>✓ Ny länk:</span>
          <code className="hh-code">{linkUrl(created)}</code>
          <CopyLink id={created} />
          <a className="btn small primary" href={linkUrl(created)} target="_blank" rel="noreferrer">↗ Testa den</a>
        </div>
      )}
    </div>
  )
}

// Leaderboard: per rekryterare
function Leaderboard() {
  const { headhuntLinks, candidates, can } = useStore()
  const rows = useMemo(() => {
    const map = new Map<string, { clicks: number; apps: Candidate[] }>()
    for (const l of headhuntLinks) {
      const e = map.get(l.recruiter) ?? { clicks: 0, apps: [] }
      e.clicks += l.clicks
      map.set(l.recruiter, e)
    }
    for (const c of candidates) {
      if (c.source === 'Headhunt' && c.headhuntLinkId) {
        const link = headhuntLinks.find(l => l.id === c.headhuntLinkId)
        if (link) map.get(link.recruiter)?.apps.push(c)
      }
    }
    return [...map.entries()]
      .map(([recruiter, e]) => {
        const scored = e.apps.filter(c => c.score !== undefined)
        const avg = scored.length ? scored.reduce((s, c) => s + (c.score ?? 0), 0) / scored.length : null
        return {
          recruiter, clicks: e.clicks, apps: e.apps.length,
          reached: e.apps.filter(c => STAGE_RANK[c.stage] >= 2).length,
          hired: e.apps.filter(c => c.stage === 'anstalld').length,
          avg,
        }
      })
      .sort((a, b) => b.apps - a.apps)
  }, [headhuntLinks, candidates])

  if (!can('exec.view')) return null

  return (
    <div className="card" data-testid="leaderboard">
      <h2 style={{ marginBottom: 4 }}>Headhunt-leaderboard 🏆</h2>
      <div className="muted small" style={{ marginBottom: 12 }}>Vem fångar flest — och med vilken kvalitet? Räknas mot rekryterarnas mål.</div>
      <table className="tbl">
        <thead>
          <tr><th>Rekryterare</th><th className="num">Klick</th><th className="num">Ansökningar</th><th className="num">Nått intervju+</th><th className="num">Anställda</th><th className="num">Snittscore</th></tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.recruiter}>
              <td>{i === 0 ? '🥇 ' : i === 1 ? '🥈 ' : ''}<b>{r.recruiter}</b></td>
              <td className="num">{r.clicks}</td>
              <td className="num"><b>{r.apps}</b></td>
              <td className="num">{r.reached}</td>
              <td className="num">{r.hired}</td>
              <td className="num">{r.avg !== null ? r.avg.toFixed(1).replace('.', ',') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Headhunt() {
  const { headhuntLinks, candidates, currentUser, can, roleTitleOf } = useStore()

  const appsForLink = (id: string) => candidates.filter(c => c.headhuntLinkId === id)

  // rekryterare ser sina egna länkar; chef/ledning ser alla
  const myLinks = can('exec.view')
    ? headhuntLinks
    : headhuntLinks.filter(l => l.recruiter === currentUser?.name)

  const totalApps = myLinks.reduce((s, l) => s + appsForLink(l.id).length, 0)
  const totalClicks = myLinks.reduce((s, l) => s + l.clicks, 0)

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Headhunting-länkar 🎯</h1>
          <div className="sub">
            Spårbara länkar per rekryterare och roll. Varje klick och ansökan tillskrivs rätt person — inga anonyma tips.
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="kpi"><div className="kpi-label">{can('exec.view') ? 'Länkar totalt' : 'Mina länkar'}</div><div className="kpi-value">{myLinks.length}</div></div>
        <div className="kpi"><div className="kpi-label">Klick</div><div className="kpi-value">{totalClicks}</div></div>
        <div className="kpi"><div className="kpi-label">Ansökningar via länk</div><div className="kpi-value">{totalApps}</div><div className="kpi-trend">konv {totalClicks ? Math.round((totalApps / totalClicks) * 100) : 0}%</div></div>
      </div>

      {can('operate') && <CreateLink />}

      <div className="card">
        <h3 style={{ marginBottom: 10 }}>{can('exec.view') ? 'Alla länkar' : 'Mina länkar'}</h3>
        {myLinks.length === 0
          ? <div className="muted small">Inga länkar ännu — skapa en ovan.</div>
          : (
            <table className="tbl">
              <thead>
                <tr><th>Länk-id</th><th>Roll</th><th className="num">Klick</th><th className="num">Ansökningar</th><th className="num">Konv.</th><th className="num">Nått intervju+</th><th /></tr>
              </thead>
              <tbody>
                {myLinks.map(l => <LinkRow key={l.id} link={l} apps={appsForLink(l.id)} />)}
              </tbody>
            </table>
          )}
        <div className="muted small" style={{ marginTop: 10 }}>
          Tips: {roleTitleOf('backend')}-länken funkar även som QR på mässor (kopiera url:en till valfri QR-generator).
        </div>
      </div>

      <Leaderboard />
    </div>
  )
}
