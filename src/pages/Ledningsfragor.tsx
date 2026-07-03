import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { COPILOT_EXAMPLES, answerQuestion } from '../copilot'
import type { CopilotAnswer } from '../copilot'
import { SOURCE_ECONOMY, TIME_IN_STAGE } from '../data'
import { prognosLabel } from '../planning'
import { useStore } from '../store'

const kr = (n: number) => n.toLocaleString('sv-SE') + ' kr'

// ---------- Copilot-Q&A ----------

function Copilot() {
  const { planStatuses, warnings, candidates, requisitions, headhuntLinks } = useStore()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [answer, setAnswer] = useState<CopilotAnswer | null>(null)
  const [asked, setAsked] = useState('')

  const ask = (question: string) => {
    if (!question.trim()) return
    setAsked(question)
    setAnswer(answerQuestion(question, { planStatuses, warnings, candidates, requisitions, headhuntLinks }))
    setQ('')
  }

  return (
    <div className="card copilot-card">
      <div className="rita-head" style={{ marginBottom: 10 }}>
        <span className="rita-avatar">R</span>
        <div>
          <b>Fråga Rita</b> <span className="muted small">— ledningscopilot</span>
          <div className="muted small">Ställ frågor i naturligt språk. Svaren räknas live ur pipelinen — så du alltid kan stå till svars.</div>
        </div>
      </div>
      <div className="search-bar-lg">
        <span className="search-ico">⌕</span>
        <input
          placeholder="t.ex. Vilka roller riskerar försening?"
          value={q}
          onChange={e => setQ(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && ask(q)}
          data-testid="copilot-input"
        />
        <button className={`btn primary${q.trim() ? '' : ' disabled'}`} disabled={!q.trim()} onClick={() => ask(q)} data-testid="copilot-ask">Fråga</button>
      </div>
      <div className="example-chips">
        {COPILOT_EXAMPLES.map(ex => <button key={ex} className="example-chip" onClick={() => ask(ex)}>{ex}</button>)}
      </div>

      {answer && (
        <div className="copilot-answer" data-testid="copilot-answer">
          <div className="muted small" style={{ marginBottom: 4 }}>Du frågade: ”{asked}”</div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{answer.answer}</div>
          {answer.detail && (
            <ul className="small" style={{ margin: '8px 0 0 16px' }}>
              {answer.detail.map((d, i) => <li key={i}>{d}</li>)}
            </ul>
          )}
          {answer.link && (
            <button className="btn small" style={{ marginTop: 10 }} onClick={() => navigate(answer.link!.to)}>{answer.link.label} →</button>
          )}
        </div>
      )}
    </div>
  )
}

function CopyButton({ rows, label }: { rows: (string | number)[][]; label: string }) {
  const { toast } = useStore()
  const copy = async () => {
    const tsv = rows.map(r => r.join('\t')).join('\n')
    try {
      await navigator.clipboard.writeText(tsv)
      toast(`Underlaget "${label}" kopierat — klistra in i mail eller presentation`)
    } catch {
      toast('Kunde inte kopiera — markera tabellen manuellt')
    }
  }
  return <button className="btn small" onClick={copy}>⧉ Kopiera underlag</button>
}

export function Ledningsfragor() {
  const navigate = useNavigate()
  const { planStatuses, warnings, warningAcks, plan } = useStore()
  const open = warnings.filter(w => !warningAcks.some(a => a.id === w.id))

  // 1. Kostnad per anställning per avdelning
  const costPerAvd = useMemo(() => {
    const m = new Map<string, { kostnad: number; anstallda: number }>()
    for (const s of planStatuses) {
      const e = m.get(s.row.avdelning) ?? { kostnad: 0, anstallda: 0 }
      e.kostnad += s.kostnadUtfall; e.anstallda += s.anstallda
      m.set(s.row.avdelning, e)
    }
    return [...m.entries()].filter(([, v]) => v.kostnad > 0 || v.anstallda > 0)
  }, [planStatuses])

  // 2. Plan vs utfall
  const tot = useMemo(() => ({
    mal: planStatuses.reduce((s, r) => s + r.row.antal, 0),
    anstallda: planStatuses.reduce((s, r) => s + r.anstallda, 0),
    aktiva: planStatuses.reduce((s, r) => s + r.aktiva, 0),
    iFas: planStatuses.filter(s => s.prognosLage === 'i fas' || s.prognosLage === 'klar').length,
    risk: planStatuses.filter(s => s.prognosLage === 'risk').length,
    efter: planStatuses.filter(s => s.prognosLage === 'efter plan').length,
    ejStartad: planStatuses.filter(s => s.prognosLage === 'ej startad').length,
  }), [planStatuses])

  // 3. Riskroller med orsaker
  const riskRows = useMemo(() =>
    planStatuses
      .map(s => ({ s, orsaker: open.filter(w => w.rowId === s.row.id).map(w => w.text) }))
      .filter(x => x.orsaker.length > 0),
  [planStatuses, open])

  // 6. Budget
  const budget = useMemo(() => ({
    total: planStatuses.reduce((s, r) => s + r.row.rekrbudget, 0),
    utfall: planStatuses.reduce((s, r) => s + r.kostnadUtfall, 0),
    over: planStatuses.filter(s => s.budgetLage === 'över'),
  }), [planStatuses])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>Ledningsfrågor ❖</h1>
          <div className="sub">
            Frågorna ledningsgruppen ställer — besvarade board-ready, live ur pipelinen. Varje kort går att kopiera rakt in i en presentation.
          </div>
        </div>
      </div>

      <Copilot />

      <div className="lf-grid">
        <div className="card lf-card" data-testid="lf-kostnad">
          <div className="lf-head">
            <h2>”Vad kostar en anställning per avdelning?”</h2>
            <CopyButton label="Kostnad per anställning"
              rows={[['Avdelning', 'Rekr.kostnad', 'Anställda', 'Kostnad/anställning'],
                ...costPerAvd.map(([avd, v]) => [avd, v.kostnad, v.anstallda, v.anstallda ? Math.round(v.kostnad / v.anstallda) : '—'])]} />
          </div>
          <table className="tbl">
            <thead><tr><th>Avdelning</th><th className="num">Rekr.kostnad</th><th className="num">Anställda</th><th className="num">Kostnad/anställning</th></tr></thead>
            <tbody>
              {costPerAvd.map(([avd, v]) => (
                <tr key={avd}>
                  <td><b>{avd}</b></td>
                  <td className="num">{kr(v.kostnad)}</td>
                  <td className="num">{v.anstallda}</td>
                  <td className="num"><b>{v.anstallda ? kr(Math.round(v.kostnad / v.anstallda)) : 'pågår'}</b></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card lf-card" data-testid="lf-plan">
          <div className="lf-head">
            <h2>”Ligger vi i fas mot årsplanen?”</h2>
            <CopyButton label="Plan vs utfall"
              rows={[['Mått', 'Värde'], ['Headcount-mål', tot.mal], ['Anställda', tot.anstallda], ['Aktiva kandidater', tot.aktiva],
                ['Rader i fas/klara', tot.iFas], ['Rader i risk', tot.risk], ['Rader efter plan', tot.efter], ['Ej startade', tot.ejStartad]]} />
          </div>
          <div className="lf-verdict">
            {tot.efter + tot.ejStartad === 0
              ? <span className="chip">✓ Ja — inga rader efter plan</span>
              : <span className="chip warn">Delvis — {tot.efter} efter plan, {tot.ejStartad} ej startade</span>}
          </div>
          <div className="progress big"><div style={{ width: `${Math.min(100, (tot.anstallda / Math.max(1, tot.mal)) * 100)}%` }} /></div>
          <div className="small muted" style={{ marginTop: 6 }}>
            {tot.anstallda} av {tot.mal} tillsatta · {tot.aktiva} aktiva kandidater i arbete ·
            {' '}{tot.iFas} rader i fas · {tot.risk} i risk · {tot.efter} efter plan · {tot.ejStartad} ej startade
          </div>
        </div>

        <div className="card lf-card" data-testid="lf-risk">
          <div className="lf-head">
            <h2>”Vilka roller riskerar försening — och varför?”</h2>
            <CopyButton label="Riskroller"
              rows={[['Roll', 'Prognos', 'Orsaker'],
                ...riskRows.map(x => [x.s.row.rollTitel, prognosLabel[x.s.prognosLage], x.orsaker.join(' | ')])]} />
          </div>
          {riskRows.length === 0 && <div className="banner-ok">✓ Inga riskroller just nu.</div>}
          <div className="grid" style={{ gap: 8 }}>
            {riskRows.map(x => (
              <div key={x.s.row.id} className="warning-item sev-medel" style={{ alignItems: 'flex-start' }}>
                <div>
                  <b>{x.s.row.rollTitel}</b> <span className="chip gray">{prognosLabel[x.s.prognosLage]}</span>
                  <ul className="small" style={{ margin: '6px 0 0 16px' }}>
                    {x.orsaker.map((o, i) => <li key={i}>{o}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card lf-card" data-testid="lf-budget">
          <div className="lf-head">
            <h2>”Hur mår rekryteringsbudgeten?”</h2>
            <CopyButton label="Budgetläge"
              rows={[['Mått', 'Värde'], ['Total budget', budget.total], ['Använt', budget.utfall],
                ['Kvar', budget.total - budget.utfall], ...budget.over.map(s => [`ÖVER: ${s.row.rollTitel}`, `${s.kostnadUtfall} av ${s.row.rekrbudget}`])]} />
          </div>
          <div className="lf-verdict">
            {budget.over.length === 0
              ? <span className="chip">✓ Inom budget</span>
              : <span className="chip danger">⚠ {budget.over.length} rad{budget.over.length > 1 ? 'er' : ''} över budget</span>}
          </div>
          <div className="progress big"><div style={{ width: `${Math.min(100, (budget.utfall / Math.max(1, budget.total)) * 100)}%` }} /></div>
          <div className="small muted" style={{ margin: '6px 0 8px' }}>{kr(budget.utfall)} använt av {kr(budget.total)}</div>
          {budget.over.map(s => (
            <div key={s.row.id} className="small over-budget">
              ⚠ {s.row.rollTitel}: {kr(s.kostnadUtfall)} av {kr(s.row.rekrbudget)}
            </div>
          ))}
        </div>

        <div className="card lf-card" data-testid="lf-roi">
          <div className="lf-head">
            <h2>”Vilken kanal ger bäst ROI?”</h2>
            <CopyButton label="Kanal-ROI"
              rows={[['Kanal', 'Anställda', 'Kostnad', 'Kostnad/anställd'],
                ...SOURCE_ECONOMY.map(s => [s.kanal, s.anstallda, s.kostnad, Math.round(s.kostnad / s.anstallda)])]} />
          </div>
          <table className="tbl">
            <thead><tr><th>Kanal</th><th className="num">Anställda</th><th className="num">Kostnad/anställd</th></tr></thead>
            <tbody>
              {SOURCE_ECONOMY.map(s => (
                <tr key={s.kanal}>
                  <td><b>{s.kanal}</b></td>
                  <td className="num">{s.anstallda}</td>
                  <td className="num">{kr(Math.round(s.kostnad / s.anstallda))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="small muted" style={{ marginTop: 8 }}>Referrals slår allt · LinkedIn bäst av betalda kanaler.</div>
        </div>

        <div className="card lf-card" data-testid="lf-tempo">
          <div className="lf-head">
            <h2>”Hur snabbt anställer vi — och var fastnar det?”</h2>
            <CopyButton label="Tempo & flaskhals"
              rows={[['Mått', 'Värde'], ['Time-to-hire', '24 dagar (▼6)'],
                ...TIME_IN_STAGE.map(t => [t.steg, `${t.dagar} d${t.flaskhals ? ' (flaskhals)' : ''}`])]} />
          </div>
          <div className="lf-verdict"><span className="chip">Time-to-hire: 24 dagar (▼ 6)</span></div>
          {TIME_IN_STAGE.map(t => (
            <div key={t.steg} className={`bar-row${t.flaskhals ? ' hot' : ''}`}>
              <div className="b-label">{t.steg}</div>
              <div className="b-bar" style={{ width: `${(t.dagar / 9) * 50}%` }}>{t.dagar} d</div>
              {t.flaskhals && <div className="b-note">← flaskhals</div>}
            </div>
          ))}
          <button className="btn small" style={{ marginTop: 8 }} onClick={() => navigate('/analys')}>Full analys →</button>
        </div>
      </div>

      <div className="banner-ok">
        ✓ Alla svar hämtas live ur {plan.namn} + pipelinen — chefen behöver aldrig mer säga ”jag återkommer efter helgen”.
      </div>
    </div>
  )
}
