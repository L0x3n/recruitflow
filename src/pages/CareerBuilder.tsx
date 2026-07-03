import { useMemo, useState } from 'react'
import { STAGES } from '../data'
import { useStore } from '../store'
import type { CareerBlock, StageId, TriggerAction } from '../types'

const ACCENTS = ['#1F5C46', '#2563EB', '#7C3AED', '#B45309', '#BE185D', '#0F766E']

const BLOCK_LABEL: Record<string, string> = {
  hero: 'Hero (toppbanner)', about: 'Om oss', benefits: 'Förmåner', jobs: 'Jobblista', quote: 'Medarbetarcitat',
}

// ---------- Live-förhandsvisning ----------

function Preview() {
  const { career, roles } = useStore()
  const activeRoles = roles.filter(r => r.id !== 'historisk')
  return (
    <div className="career-preview" style={{ ['--accent' as string]: career.accent }}>
      {career.blocks.filter(b => b.enabled).map(b => {
        if (b.type === 'hero') return (
          <div key={b.id} className="cp-hero">
            <h2>{b.title}</h2>
            <p>{b.text}</p>
            <span className="cp-btn">Se lediga tjänster</span>
          </div>
        )
        if (b.type === 'about') return (
          <div key={b.id} className="cp-block"><h3>{b.title}</h3><p>{b.text}</p></div>
        )
        if (b.type === 'benefits') return (
          <div key={b.id} className="cp-block">
            <h3>{b.title}</h3>
            <div className="cp-benefits">{(b.items ?? []).map((it, i) => <span key={i} className="cp-benefit">✓ {it}</span>)}</div>
          </div>
        )
        if (b.type === 'jobs') return (
          <div key={b.id} className="cp-block">
            <h3>{b.title}</h3>
            {activeRoles.map(r => (
              <div key={r.id} className="cp-job"><b>{r.titel}</b><span className="muted small">{r.chef} · {r.lonespann}</span><span className="cp-btn sm">Ansök</span></div>
            ))}
          </div>
        )
        if (b.type === 'quote') return (
          <div key={b.id} className="cp-quote">”{b.text}”<div className="cp-quote-author">— {b.author}</div></div>
        )
        return null
      })}
    </div>
  )
}

// ---------- Blockredigerare ----------

function BlockEditor({ block, idx, total }: { block: CareerBlock; idx: number; total: number }) {
  const { updateCareerBlock, moveCareerBlock } = useStore()
  const [open, setOpen] = useState(false)
  return (
    <div className={`block-row${block.enabled ? '' : ' off'}`}>
      <div className="block-head">
        <label className="block-toggle">
          <input type="checkbox" checked={block.enabled} onChange={() => updateCareerBlock(block.id, { enabled: !block.enabled })} data-testid={`block-toggle-${block.id}`} />
          <b>{BLOCK_LABEL[block.type]}</b>
        </label>
        <div style={{ display: 'flex', gap: 5 }}>
          <button className="btn small" disabled={idx === 0} onClick={() => moveCareerBlock(block.id, -1)}>↑</button>
          <button className="btn small" disabled={idx === total - 1} onClick={() => moveCareerBlock(block.id, 1)}>↓</button>
          <button className="btn small" onClick={() => setOpen(o => !o)}>{open ? 'Klar' : 'Redigera'}</button>
        </div>
      </div>
      {open && (
        <div className="block-edit">
          {'title' in block && block.title !== undefined && (
            <input className="editable-input" style={{ marginBottom: 8 }} value={block.title} onChange={e => updateCareerBlock(block.id, { title: e.target.value })} placeholder="Rubrik" />
          )}
          {block.text !== undefined && (
            <textarea className="editable-input" rows={2} style={{ marginBottom: 8, resize: 'vertical' }} value={block.text} onChange={e => updateCareerBlock(block.id, { text: e.target.value })} placeholder="Text" />
          )}
          {block.items !== undefined && (
            <textarea className="editable-input" rows={3} style={{ resize: 'vertical' }} value={(block.items ?? []).join('\n')} onChange={e => updateCareerBlock(block.id, { items: e.target.value.split('\n').filter(Boolean) })} placeholder="En förmån per rad" />
          )}
          {block.author !== undefined && (
            <input className="editable-input" value={block.author} onChange={e => updateCareerBlock(block.id, { author: e.target.value })} placeholder="Citatets avsändare" />
          )}
          {block.type === 'jobs' && <div className="muted small">Jobblistan fylls automatiskt från aktiva roller.</div>}
        </div>
      )}
    </div>
  )
}

const ACTION_LABEL: Record<TriggerAction, string> = {
  mail: '✉ Skicka mail', feedback: '◉ Begär feedback', nurture: '♲ Lägg i talangpool', todo: '☑ Skapa to-do',
}

// ---------- Automation (triggers) ----------

function AutomationTab() {
  const { triggers, toggleTrigger, addTrigger } = useStore()
  const [when, setWhen] = useState<StageId>('intervju')
  const [action, setAction] = useState<TriggerAction>('mail')
  const [detail, setDetail] = useState('')

  const add = () => { if (detail.trim()) { addTrigger(when, action, detail.trim()); setDetail('') } }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="banner-ok">✦ Automation: definiera <b>NÄR</b> ett steg inträffar → <b>DÅ</b> gör systemet något. Kör automatiskt vid varje stegförflyttning och loggas i kandidatens tidslinje.</div>
      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Aktiva regler ({triggers.filter(t => t.active).length}/{triggers.length})</h3>
        <div className="grid" style={{ gap: 9 }}>
          {triggers.map(t => (
            <div key={t.id} className="trigger-row" data-testid={`trigger-${t.id}`}>
              <span className="trigger-when">NÄR: {STAGES.find(s => s.id === t.when)?.label ?? t.when}</span>
              <span className="trigger-arrow">→</span>
              <div style={{ flex: 1 }}>
                <b className="small">{ACTION_LABEL[t.action]}</b>
                <div className="muted small">{t.detail}</div>
              </div>
              <span className="chip gray">{t.firedCount}× körd</span>
              <label className="switch">
                <input type="checkbox" checked={t.active} onChange={() => toggleTrigger(t.id)} data-testid={`trigger-switch-${t.id}`} />
                <span className="slider" />
              </label>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 10 }}>Ny regel</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span className="small muted">NÄR</span>
          <select className="editable-input mini-select" value={when} onChange={e => setWhen(e.target.value as StageId)}>
            {STAGES.filter(s => s.id !== 'nya').map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <span className="small muted">DÅ</span>
          <select className="editable-input mini-select" value={action} onChange={e => setAction(e.target.value as TriggerAction)}>
            {(['mail', 'feedback', 'nurture', 'todo'] as TriggerAction[]).map(a => <option key={a} value={a}>{ACTION_LABEL[a]}</option>)}
          </select>
          <input className="editable-input" style={{ flex: 1, minWidth: 160 }} placeholder="Beskrivning/mall…" value={detail} onChange={e => setDetail(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()} />
          <button className={`btn small primary${detail.trim() ? '' : ' disabled'}`} disabled={!detail.trim()} onClick={add} data-testid="add-trigger">+ Lägg till</button>
        </div>
      </div>
    </div>
  )
}

// ---------- Talangpool & nurture ----------

function TalentPoolTab() {
  const { nurture, sendNurture, toggleNurture, candidates, roleTitleOf } = useStore()
  const pool = useMemo(
    () => candidates.filter(c => (c.stage === 'avslag' && (c.score ?? 0) >= 4) || c.rejection?.reason === 'Tackade nej'),
    [candidates],
  )

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Nurture-kampanjer</h3>
        <div className="muted small" style={{ marginBottom: 10 }}>Håll passiva och tidigare kandidater varma — fyll pipelinen för morgondagens roller.</div>
        <div className="grid" style={{ gap: 9 }}>
          {nurture.map(n => (
            <div key={n.id} className="fb-item" data-testid={`nurture-${n.id}`}>
              <div className="fb-main">
                <b>{n.namn}</b>
                <div className="muted small">{n.audience} · {n.medlemmar} medlemmar</div>
                <div className="muted small">{n.utskick} utskick · {n.oppningar} öppningar ({n.utskick ? Math.round((n.oppningar / (n.utskick * n.medlemmar)) * 100) : 0}% öppningsgrad)</div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={n.aktiv} onChange={() => toggleNurture(n.id)} />
                <span className="slider" />
              </label>
              <button className="btn small primary" onClick={() => sendNurture(n.id)} data-testid={`nurture-send-${n.id}`}>Skicka utskick</button>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>Talangpool ({pool.length})</h3>
        <div className="muted small" style={{ marginBottom: 10 }}>Starka avslag och kandidater som tackat nej — automatiskt insamlade via triggers.</div>
        {pool.length === 0 && <div className="muted small">Poolen är tom just nu.</div>}
        {pool.map(c => (
          <div key={c.id} className="fb-item" style={{ marginBottom: 8 }}>
            <div className="fb-main">
              <b>{c.name}</b> <span className="muted small">{roleTitleOf(c.roleId)}</span>
              <div className="muted small">{c.rejection?.reason ?? 'Avslag'}{c.score ? ` · score ${c.score.toFixed(1).replace('.', ',')}` : ''}</div>
            </div>
            <span className="chip">♲ i poolen</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function CareerBuilder() {
  const { career, updateCareerMeta, publishCareer, toast } = useStore()
  const [tab, setTab] = useState<'sida' | 'automation' | 'pool'>('sida')

  const publicUrl = `${window.location.origin}/karriar`
  const copyUrl = async () => { try { await navigator.clipboard.writeText(publicUrl); toast('Länk till karriärsidan kopierad') } catch { toast('Kunde inte kopiera') } }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Karriärsida & automation 🎨</h1>
          <div className="sub">Employer branding, publik jobbsida och automationsregler — Teamtailor-stil.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {career.published && <a className="btn small" href={publicUrl} target="_blank" rel="noreferrer">↗ Visa live</a>}
          <button className={`btn ${career.published ? '' : 'primary'}`} onClick={() => publishCareer(!career.published)} data-testid="publish-toggle">
            {career.published ? 'Avpublicera' : '✓ Publicera'}
          </button>
        </div>
      </div>

      <div className="tabs" style={{ borderBottom: '1px solid var(--border)' }}>
        <button className={tab === 'sida' ? 'on' : ''} onClick={() => setTab('sida')}>Karriärsida</button>
        <button className={tab === 'automation' ? 'on' : ''} onClick={() => setTab('automation')}>Automation</button>
        <button className={tab === 'pool' ? 'on' : ''} onClick={() => setTab('pool')}>Talangpool & nurture</button>
      </div>

      {tab === 'automation' && <AutomationTab />}
      {tab === 'pool' && <TalentPoolTab />}
      {tab === 'sida' && <>

      {career.published && (
        <div className="banner-ok" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          ✓ Live på <code className="hh-code">{publicUrl}</code>
          <button className="btn small" onClick={copyUrl}>⧉ Kopiera</button>
        </div>
      )}

      <div className="career-layout">
        <div className="grid" style={{ gap: 12 }}>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Varumärke</h3>
            <label className="small muted">Företagsnamn</label>
            <input className="editable-input" style={{ marginBottom: 10 }} value={career.companyName} onChange={e => updateCareerMeta({ companyName: e.target.value })} />
            <label className="small muted">Tagline</label>
            <input className="editable-input" style={{ marginBottom: 10 }} value={career.tagline} onChange={e => updateCareerMeta({ tagline: e.target.value })} />
            <label className="small muted">Temafärg</label>
            <div style={{ display: 'flex', gap: 7, marginTop: 5 }}>
              {ACCENTS.map(a => (
                <button key={a} onClick={() => updateCareerMeta({ accent: a })} data-testid={`accent-${a}`}
                  className={`accent-dot${career.accent === a ? ' on' : ''}`} style={{ background: a }} />
              ))}
            </div>
          </div>
          <div className="card">
            <h3 style={{ marginBottom: 10 }}>Block (dra med ↑↓)</h3>
            <div className="grid" style={{ gap: 8 }}>
              {career.blocks.map((b, i) => <BlockEditor key={b.id} block={b} idx={i} total={career.blocks.length} />)}
            </div>
          </div>
        </div>
        <div>
          <div className="muted small" style={{ marginBottom: 6 }}>Live-förhandsvisning</div>
          <Preview />
        </div>
      </div>
      </>}
    </div>
  )
}
