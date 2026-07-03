import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SEQUENCES } from '../data'
import { useStore } from '../store'
import type { OutreachThread } from '../types'

const CHANNEL_ICON: Record<string, string> = { mail: '✉', linkedin: 'in', sms: '💬' }
const STATUS_LABEL: Record<string, string> = { sekvens: 'sekvens', väntar: 'väntar svar', svarade: 'svarade' }

function seqName(id: string) { return SEQUENCES.find(s => s.id === id)?.namn ?? id }
function seqLen(id: string) { return SEQUENCES.find(s => s.id === id)?.steps.length ?? 0 }

// ---------- Rita-assistenten ----------

interface Suggestion { id: string; text: string; action: string; run: () => void }

function RitaPanel() {
  const { threads, candidates, savedSourced, advanceSequence, enrollSequence } = useStore()

  const suggestions = useMemo<Suggestion[]>(() => {
    const out: Suggestion[] = []
    // väntande trådar med fler sekvenssteg kvar
    for (const t of threads) {
      if (t.status === 'väntar' && t.sequenceStep < seqLen(t.sequenceId)) {
        out.push({
          id: `adv-${t.id}`,
          text: `${t.candidateName} har inte svarat — skicka steg ${t.sequenceStep + 1} i "${seqName(t.sequenceId)}"?`,
          action: `Skicka steg ${t.sequenceStep + 1}`,
          run: () => advanceSequence(t.id),
        })
      }
    }
    // sourcade kandidater i 'nya' utan tråd → starta outreach
    for (const pid of savedSourced) {
      const cand = candidates.find(c => c.id === `src-${pid}`)
      if (cand && cand.stage === 'nya' && !threads.some(t => t.candidateId === cand.id)) {
        out.push({
          id: `enroll-${cand.id}`,
          text: `${cand.name} sourcades men har ingen outreach ännu — starta en sekvens?`,
          action: 'Starta outreach',
          run: () => enrollSequence({ candidateId: cand.id, roleId: cand.roleId, sequenceId: 'seq-passiv' }),
        })
      }
    }
    return out.slice(0, 4)
  }, [threads, candidates, savedSourced, advanceSequence, enrollSequence])

  return (
    <div className="card rita-card">
      <div className="rita-head">
        <span className="rita-avatar">R</span>
        <div>
          <b>Rita</b> <span className="muted small">— din AI-assistent</span>
          <div className="muted small">Föreslår nästa steg. Du godkänner, Rita gör jobbet.</div>
        </div>
      </div>
      {suggestions.length === 0
        ? <div className="muted small" style={{ marginTop: 8 }}>Inga förslag just nu — allt är i fas. 🎉</div>
        : (
          <div className="grid" style={{ gap: 8, marginTop: 10 }}>
            {suggestions.map(s => (
              <div key={s.id} className="rita-suggestion" data-testid={`rita-${s.id}`}>
                <span style={{ flex: 1 }}>{s.text}</span>
                <button className="btn small primary" onClick={s.run}>{s.action}</button>
              </div>
            ))}
          </div>
        )}
    </div>
  )
}

// ---------- Konversation ----------

function Conversation({ thread }: { thread: OutreachThread }) {
  const { sendMessage, advanceSequence, moveFromThread, roleTitleOf } = useStore()
  const navigate = useNavigate()
  const [draft, setDraft] = useState('')
  const hasMoreSteps = thread.sequenceStep < seqLen(thread.sequenceId)
  const candidateReplied = thread.status === 'svarade'

  const send = () => { if (draft.trim()) { sendMessage(thread.id, draft); setDraft('') } }

  return (
    <div className="card conversation" data-testid="conversation">
      <div className="conv-head">
        <div>
          <b>{thread.candidateName}</b>
          <span className="muted small"> · {roleTitleOf(thread.roleId)} · {CHANNEL_ICON[thread.channel]} {thread.channel}</span>
          <div className="muted small">Sekvens: {seqName(thread.sequenceId)} · steg {thread.sequenceStep}/{seqLen(thread.sequenceId)}</div>
        </div>
        {thread.candidateId && (
          <button className="btn small" onClick={() => navigate(`/kandidater/${thread.candidateId}?roll=${thread.roleId}`)}>
            Öppna kandidat →
          </button>
        )}
      </div>

      <div className="conv-messages">
        {thread.messages.map(m => (
          <div key={m.id} className={`bubble ${m.from}`}>
            <div className="bubble-meta">{m.author} · {m.ts} · {CHANNEL_ICON[m.channel]} {m.channel}{m.opened ? ' · öppnat ✓' : ''}</div>
            <div>{m.text}</div>
          </div>
        ))}
      </div>

      {candidateReplied && thread.candidateId && (
        <div className="conv-move" data-testid="conv-move">
          <span className="small">💡 {thread.candidateName} svarade — flytta direkt i pipelinen:</span>
          <button className="btn small primary" onClick={() => moveFromThread(thread.id, 'intervju')}>→ Intervju</button>
          <button className="btn small" onClick={() => moveFromThread(thread.id, 'screening')}>→ Screening</button>
        </div>
      )}

      <div className="conv-reply">
        <textarea
          rows={2}
          placeholder={`Svara ${thread.candidateName.split(' ')[0]} via ${thread.channel}…`}
          value={draft}
          onChange={e => setDraft(e.target.value)}
          data-testid="reply-input"
        />
        <div className="conv-reply-actions">
          {hasMoreSteps && (
            <button className="btn small" onClick={() => advanceSequence(thread.id)} data-testid="advance-seq">
              ✦ Skicka nästa sekvenssteg (steg {thread.sequenceStep + 1})
            </button>
          )}
          <button className={`btn small primary${draft.trim() ? '' : ' disabled'}`} disabled={!draft.trim()} onClick={send} data-testid="send-msg">
            Skicka
          </button>
        </div>
      </div>
    </div>
  )
}

// ---------- Sidan ----------

export function Inbox() {
  const { threads, roleTitleOf } = useStore()
  const [activeId, setActiveId] = useState<string | null>(null)

  const sorted = useMemo(
    () => [...threads].sort((a, b) => b.lastActivity.localeCompare(a.lastActivity)),
    [threads],
  )
  const active = threads.find(t => t.id === activeId) ?? sorted[0]

  const counts = {
    svarade: threads.filter(t => t.status === 'svarade').length,
    väntar: threads.filter(t => t.status === 'väntar').length,
  }

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Inkorg 📨</h1>
          <div className="sub">
            Outreach, svar och pipeline i samma flöde — allt kopplat till kandidat och roll. {counts.svarade} svarade · {counts.väntar} väntar.
          </div>
        </div>
      </div>

      <RitaPanel />

      <div className="inbox-layout">
        <div className="thread-list">
          {sorted.map(t => {
            const last = t.messages[t.messages.length - 1]
            return (
              <button
                key={t.id}
                className={`thread-item${active?.id === t.id ? ' on' : ''}`}
                onClick={() => setActiveId(t.id)}
                data-testid={`thread-${t.id}`}
              >
                <div className="thread-top">
                  <b>{t.candidateName}</b>
                  <span className={`fb-status ${t.status === 'svarade' ? 'besvarad' : 'väntande'}`}>{STATUS_LABEL[t.status]}</span>
                </div>
                <div className="muted small">{roleTitleOf(t.roleId)} · {CHANNEL_ICON[t.channel]} {t.channel}</div>
                <div className="thread-preview">{last?.from === 'kandidat' ? '↩ ' : ''}{last?.text.slice(0, 62)}…</div>
              </button>
            )
          })}
        </div>
        {active && <Conversation thread={active} />}
      </div>
    </div>
  )
}
