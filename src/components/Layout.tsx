import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { CANDIDATES, DATA_BADGES, NOTIFICATIONS, ROLES, roleTitle } from '../data'
import { useStore } from '../store'
import { RejectModal } from './RejectModal'
import { Tour } from './Tour'

const NAV = [
  { to: '/', ico: '◫', label: 'Översikt' },
  { to: '/roller', ico: '▤', label: 'Roller' },
  { to: '/kandidater', ico: '⋮⋮', label: 'Kandidater' },
  { to: '/feedback', ico: '◉', label: 'Feedback' },
  { to: '/erbjudanden', ico: '✓', label: 'Erbjudanden' },
  { to: '/analys', ico: '∿', label: 'Analys' },
]

function GlobalSearch() {
  const [q, setQ] = useState('')
  const navigate = useNavigate()
  const wrapRef = useRef<HTMLDivElement>(null)

  const hits = useMemo(() => {
    const s = q.trim().toLowerCase()
    if (s.length < 2) return { cands: [], roles: [] }
    return {
      cands: CANDIDATES.filter(c => c.name.toLowerCase().includes(s)).slice(0, 6),
      roles: ROLES.filter(r => r.titel.toLowerCase().includes(s)),
    }
  }, [q])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setQ('')
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const open = hits.cands.length > 0 || hits.roles.length > 0
  return (
    <div className="search-wrap" ref={wrapRef}>
      <span className="search-ico">⌕</span>
      <input
        placeholder="Sök kandidater eller roller…"
        value={q}
        onChange={e => setQ(e.target.value)}
      />
      {open && (
        <div className="search-results">
          {hits.roles.map(r => (
            <button key={r.id} onClick={() => { setQ(''); navigate(`/roller/${r.id}`) }}>
              <span><b>{r.titel}</b></span>
              <span className="sr-sub">Roll · {r.chef}</span>
            </button>
          ))}
          {hits.cands.map(c => (
            <button key={c.id} onClick={() => { setQ(''); navigate(`/kandidater/${c.id}`) }}>
              <span><b>{c.name}</b></span>
              <span className="sr-sub">{roleTitle(c.roleId)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function Bell() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])
  return (
    <div className="bell-wrap" ref={ref}>
      <button className="bell" onClick={() => setOpen(o => !o)} aria-label="Notiser">
        🔔<span className="dot">3</span>
      </button>
      {open && (
        <div className="popover">
          <div className="pop-head">Notiser</div>
          {NOTIFICATIONS.map(n => (
            <button key={n.id} className="pop-item" onClick={() => { setOpen(false); navigate(n.to) }}>
              <div>{n.text}</div>
              <div className="pop-time">{n.time}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ArrivalBanner() {
  const location = useLocation()
  const [visible, setVisible] = useState(false)
  const params = new URLSearchParams(location.search)
  const fromPipeline = params.get('from') === 'pipeline'
  const fields = params.get('fields') ?? ''

  useEffect(() => {
    if (fromPipeline) {
      setVisible(true)
      const t = setTimeout(() => setVisible(false), 9000)
      return () => clearTimeout(t)
    }
    setVisible(false)
  }, [location.key, fromPipeline])

  if (!fromPipeline || !visible) return null
  return (
    <div className="arrival-banner" data-testid="arrival-banner">
      <span>🔗</span>
      <span>Du kom hit från datapipelinen — här skapas: <b>{fields}</b></span>
      <button className="close-x" onClick={() => setVisible(false)}>✕</button>
    </div>
  )
}

function DataBadge() {
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const badge = DATA_BADGES.find(b => b.prefix !== '/' && location.pathname.startsWith(b.prefix))
    ?? DATA_BADGES.find(b => b.prefix === '/')!
  useEffect(() => setOpen(false), [location.pathname])
  return (
    <div className="data-badge-wrap">
      {open && (
        <div className="data-badge-pop">
          <b style={{ fontSize: 13 }}>Data som skapas på den här skärmen</b>
          <ul>
            {badge.skapas.map(f => <li key={f}>{f}</li>)}
          </ul>
          <div className="muted small" style={{ marginTop: 8 }}>
            Allt skrivs strukturerat till datapipelinen — inget hamnar i mail eller Excel.
          </div>
        </div>
      )}
      <button className="data-badge" onClick={() => setOpen(o => !o)}>
        <span className="db-dot" />
        Data som skapas här
      </button>
    </div>
  )
}

function Toasts() {
  const { toasts } = useStore()
  if (!toasts.length) return null
  return (
    <div className="toasts">
      {toasts.map(t => <div key={t.id} className="toast">{t.text}</div>)}
    </div>
  )
}

export function Layout() {
  const { startTour } = useStore()
  const { demo } = useStore()
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="logo">
          <div className="logo-mark">R</div>
          <div>
            <div className="logo-name">RecruitFlow</div>
            <div className="logo-sub">Rekrytering i en perfekt värld</div>
          </div>
        </div>
        <nav>
          {NAV.map(n => (
            <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => isActive ? 'active' : ''}>
              <span className="ico">{n.ico}</span>{n.label}
            </NavLink>
          ))}
          <NavLink to="/datapipeline" className={({ isActive }) => `pipeline-link${isActive ? ' active' : ''}`}>
            <span className="ico">⛓</span>Datapipeline
          </NavLink>
          <NavLink to="/installningar" className={({ isActive }) => isActive ? 'active' : ''} style={{ marginTop: 'auto' }}>
            <span className="ico">⚙</span>Inställningar
          </NavLink>
        </nav>
        <div className="sidebar-foot">Demo · all data är fiktiv</div>
      </aside>

      <div className="main">
        <header className="topbar">
          <GlobalSearch />
          <div className="spacer" />
          <button className="btn primary" onClick={startTour}>✦ Guidad tur</button>
          <Bell />
          <button className="avatar-chip" onClick={demo}>
            <div className="avatar">EL</div>
            <div style={{ textAlign: 'left' }}>
              <div className="avatar-name">Eva Lindqvist</div>
              <div className="avatar-role">Rekryterare</div>
            </div>
          </button>
        </header>
        <div className="content">
          <ArrivalBanner />
          <Outlet />
        </div>
      </div>

      <DataBadge />
      <Toasts />
      <RejectModal />
      <Tour />
    </div>
  )
}
