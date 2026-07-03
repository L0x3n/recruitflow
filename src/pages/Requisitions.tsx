import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../store'
import type { ApprovalStep, Requisition } from '../types'

const kr = (n: number) => n.toLocaleString('sv-SE') + ' kr'
const ROLE_LABEL: Record<string, string> = { chef: 'Rekryterande chef', ekonomi: 'Ekonomi', ledning: 'Ledning' }

function StepChip({ step }: { step: ApprovalStep }) {
  const cls = step.status === 'godkänd' ? 'chip' : step.status === 'avslagen' ? 'chip danger' : 'chip gray'
  const ico = step.status === 'godkänd' ? '✓' : step.status === 'avslagen' ? '✕' : '⋯'
  return (
    <div className="approval-step">
      <span className={cls}>{ico} {ROLE_LABEL[step.role]}</span>
      <div className="muted small">{step.approver}{step.ts ? ` · ${step.ts.slice(0, 10)}` : ''}</div>
      {step.comment && <div className="small" style={{ fontStyle: 'italic' }}>”{step.comment}”</div>}
    </div>
  )
}

function BudgetBadge({ req }: { req: Requisition }) {
  const { plan } = useStore()
  const row = req.planRowId ? plan.rows.find(r => r.id === req.planRowId) : undefined
  if (!row) return <span className="chip gray">ingen planrad kopplad</span>
  const budgeted = row.lonebudget * row.antal
  const requested = req.lonebudget * req.antal
  const fits = requested <= budgeted
  return (
    <span className={fits ? 'chip' : 'chip danger'}>
      {fits ? '✓ ryms i WFP-budget' : '⚠ över WFP-budget'} ({kr(requested)}/mån mot {kr(budgeted)})
    </span>
  )
}

function RequisitionCard({ req }: { req: Requisition }) {
  const { canApproveStep, decideRequisition, openRoleFromRequisition, roleTitleOf } = useStore()
  const navigate = useNavigate()
  const [comment, setComment] = useState('')
  const pending = req.steps.find(s => s.status === 'väntar')
  const iCanAct = pending && canApproveStep(pending.role)

  const openRole = async () => {
    const id = await openRoleFromRequisition(req.id)
    if (id) navigate(`/roller/${id}`)
  }

  return (
    <div className="card" data-testid={`req-${req.id}`}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
        <div>
          <h3>{req.antal}× {req.rollTitel} <span className="muted small">· {req.avdelning}</span></h3>
          <div className="muted small">Begärd av {req.requestedBy} · {req.created}</div>
        </div>
        <span className={req.status === 'godkänd' ? 'chip' : req.status === 'avslagen' ? 'chip danger' : 'chip warn'}>
          {req.status}
        </span>
      </div>

      <p style={{ fontSize: 13, margin: '10px 0' }}>{req.motivering}</p>
      <div style={{ marginBottom: 12 }}><BudgetBadge req={req} /></div>

      <div className="approval-chain">
        {req.steps.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <StepChip step={s} />
            {i < req.steps.length - 1 && <span className="trigger-arrow">→</span>}
          </div>
        ))}
      </div>

      {req.status === 'godkänd' && (
        <div className="conv-move" style={{ marginTop: 12, borderRadius: 10, borderTop: 'none', border: '1px solid #BFDACC' }}>
          <span className="small">✓ Fullt godkänd — nu kan rollen öppnas för rekrytering.</span>
          <button className="btn small primary" onClick={openRole} data-testid={`open-role-${req.id}`}>Öppna rollen →</button>
        </div>
      )}

      {iCanAct && req.status === 'under godkännande' && (
        <div className="req-action" data-testid={`req-action-${req.id}`}>
          <div className="small" style={{ marginBottom: 6 }}>
            Din tur att besluta ({ROLE_LABEL[pending!.role]}-steget):
          </div>
          <input className="editable-input" style={{ marginBottom: 8 }} placeholder="Kommentar (valfri)" value={comment} onChange={e => setComment(e.target.value)} />
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn small primary" onClick={() => decideRequisition(req.id, true, comment)} data-testid={`approve-${req.id}`}>✓ Godkänn</button>
            <button className="btn small" onClick={() => decideRequisition(req.id, false, comment)} data-testid={`reject-${req.id}`}>✕ Avslå</button>
          </div>
        </div>
      )}
      {pending && !iCanAct && req.status === 'under godkännande' && (
        <div className="muted small" style={{ marginTop: 8 }}>Väntar på {ROLE_LABEL[pending.role]} ({pending.approver}).</div>
      )}
    </div>
  )
}

function NewRequisition() {
  const { createRequisition, can } = useStore()
  const [open, setOpen] = useState(false)
  const [titel, setTitel] = useState('')
  const [avd, setAvd] = useState('')
  const [lon, setLon] = useState('')
  const [antal, setAntal] = useState('1')
  const [mot, setMot] = useState('')
  if (!can('operate')) return null

  const valid = titel.trim() && avd.trim() && Number(lon) > 0
  const submit = async () => {
    if (!valid) return
    await createRequisition({ rollTitel: titel.trim(), avdelning: avd.trim(), lonebudget: Number(lon), antal: Number(antal) || 1, motivering: mot.trim() })
    setOpen(false); setTitel(''); setAvd(''); setLon(''); setAntal('1'); setMot('')
  }

  if (!open) return <button className="btn primary" onClick={() => setOpen(true)} data-testid="new-req">+ Begär ny tjänst</button>
  return (
    <div className="card" data-testid="new-req-form">
      <h3 style={{ marginBottom: 10 }}>Begär ny tjänst</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 10px' }}>
        <div><label className="small muted">Rolltitel *</label><input className="editable-input" style={{ marginBottom: 8 }} value={titel} onChange={e => setTitel(e.target.value)} /></div>
        <div><label className="small muted">Avdelning *</label><input className="editable-input" style={{ marginBottom: 8 }} value={avd} onChange={e => setAvd(e.target.value)} /></div>
        <div><label className="small muted">Lönebudget kr/mån *</label><input type="number" className="editable-input" style={{ marginBottom: 8 }} value={lon} onChange={e => setLon(e.target.value)} /></div>
        <div><label className="small muted">Antal</label><input type="number" className="editable-input" style={{ marginBottom: 8 }} value={antal} onChange={e => setAntal(e.target.value)} /></div>
      </div>
      <label className="small muted">Motivering</label>
      <textarea className="editable-input" rows={2} style={{ marginBottom: 10, resize: 'vertical' }} value={mot} onChange={e => setMot(e.target.value)} />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button className="btn" onClick={() => setOpen(false)}>Avbryt</button>
        <button className={`btn primary${valid ? '' : ' disabled'}`} disabled={!valid} onClick={submit}>Skicka för godkännande</button>
      </div>
      <div className="muted small" style={{ marginTop: 8 }}>Din begäran godkänns automatiskt som chef och går vidare till Ekonomi → Ledning.</div>
    </div>
  )
}

export function Requisitions() {
  const { requisitions } = useStore()
  const pending = requisitions.filter(r => r.status === 'under godkännande')
  const decided = requisitions.filter(r => r.status !== 'under godkännande')

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Requisitions ✍️</h1>
          <div className="sub">Ingen roll öppnas utan godkänd requisition med budgettäckning. Kedja: chef → ekonomi → ledning.</div>
        </div>
        <NewRequisition />
      </div>

      <h3>Väntar på godkännande ({pending.length})</h3>
      {pending.map(r => <RequisitionCard key={r.id} req={r} />)}
      {pending.length === 0 && <div className="muted small">Inga öppna requisitions.</div>}

      {decided.length > 0 && (
        <>
          <h3 style={{ marginTop: 8 }}>Beslutade ({decided.length})</h3>
          {decided.map(r => <RequisitionCard key={r.id} req={r} />)}
        </>
      )}
    </div>
  )
}
