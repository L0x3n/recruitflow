import { useEffect, useState } from 'react'
import { REJECTION_REASONS } from '../data'
import { useStore } from '../store'

export function RejectModal() {
  const { rejectTarget, byId, confirmReject, cancelReject } = useStore()
  const [reason, setReason] = useState('')
  const [note, setNote] = useState('')

  useEffect(() => {
    if (rejectTarget) { setReason(''); setNote('') }
  }, [rejectTarget])

  if (!rejectTarget) return null
  const isDemo = rejectTarget === 'demo'
  const cand = isDemo ? undefined : byId(rejectTarget)

  return (
    <div className="modal-backdrop">
      <div className="modal" data-tour="reject-modal">
        <h2>Välj avslagsorsak</h2>
        <div className="modal-sub">
          {isDemo
            ? 'Exempel från guidade turen — i en perfekt värld loggas varje avslag.'
            : <>Avslag för <b>{cand?.name}</b> kan inte sparas utan orsak — det är så datan hålls hel.</>}
        </div>
        <select value={reason} onChange={e => setReason(e.target.value)} data-testid="reject-reason">
          <option value="">— Välj orsak (obligatoriskt) —</option>
          {REJECTION_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <textarea
          rows={3}
          placeholder="Fritext (valfritt) — t.ex. detaljer eller återkoppling till kandidaten"
          value={note}
          onChange={e => setNote(e.target.value)}
        />
        <div className="modal-actions">
          {!isDemo && (
            <button className="btn" onClick={cancelReject}>Avbryt (kandidaten ligger kvar)</button>
          )}
          <button
            className={`btn primary${reason ? '' : ' disabled'}`}
            disabled={!reason}
            onClick={() => reason && confirmReject(reason, note)}
            data-testid="reject-confirm"
          >
            Logga avslag
          </button>
        </div>
      </div>
    </div>
  )
}
