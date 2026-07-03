import { SOURCE_ECONOMY } from './data'
import { prognosLabel } from './planning'
import type { RowStatus } from './planning'
import type { Candidate, HeadhuntLink, PlanWarning, Requisition } from './types'

export interface CopilotAnswer {
  answer: string
  detail?: string[]
  link?: { to: string; label: string }
}

export interface CopilotCtx {
  planStatuses: RowStatus[]
  warnings: PlanWarning[]
  candidates: Candidate[]
  requisitions: Requisition[]
  headhuntLinks: HeadhuntLink[]
}

const kr = (n: number) => n.toLocaleString('sv-SE') + ' kr'
const has = (q: string, ...words: string[]) => words.some(w => q.includes(w))

export const COPILOT_EXAMPLES = [
  'Vilka roller riskerar försening?',
  'Vad är kostnaden för ogodkända requisitions?',
  'Vilken kanal ger bäst kvalitet per krona?',
  'Ligger vi i fas mot årsplanen?',
  'Vem fångar flest kandidater via headhunt?',
]

export function answerQuestion(question: string, ctx: CopilotCtx): CopilotAnswer {
  const q = question.toLowerCase()

  // Försening / risk
  if (has(q, 'försen', 'risk', 'efter plan', 'sen ', 'hinner')) {
    const risky = ctx.planStatuses.filter(s => s.prognosLage === 'risk' || s.prognosLage === 'efter plan' || s.prognosLage === 'ej startad')
    if (!risky.length) return { answer: 'Inga roller ligger i riskzonen just nu — allt är i fas eller klart.', link: { to: '/planering', label: 'Öppna planen' } }
    return {
      answer: `${risky.length} roll${risky.length > 1 ? 'er' : ''} riskerar att missa målstart:`,
      detail: risky.map(s => `${s.row.rollTitel} (${s.row.avdelning}) — ${prognosLabel[s.prognosLage].toLowerCase()}, mål ${s.row.malStart}${s.prognosStart ? `, prognos ${s.prognosStart}` : ''}`),
      link: { to: '/planering', label: 'Öppna planen' },
    }
  }

  // Ogodkända requisitions — kostnad
  if (has(q, 'requisition', 'ogodkän', 'godkänn', 'ny tjänst', 'nya tjänster')) {
    const pending = ctx.requisitions.filter(r => r.status === 'under godkännande')
    const monthly = pending.reduce((s, r) => s + r.lonebudget * r.antal, 0)
    return {
      answer: `${pending.length} requisition${pending.length !== 1 ? 'er' : ''} väntar på godkännande, till en samlad lönekostnad på ${kr(monthly)}/mån (${kr(monthly * 12)}/år).`,
      detail: pending.map(r => `${r.antal}× ${r.rollTitel} (${r.avdelning}) — ${kr(r.lonebudget)}/mån, väntar på ${r.steps.find(s => s.status === 'väntar')?.role ?? '—'}`),
      link: { to: '/requisitions', label: 'Öppna requisitions' },
    }
  }

  // Kanal-ROI
  if (has(q, 'kanal', 'källa', 'roi', 'krona', 'kostnad per', 'bäst') && !has(q, 'requisition')) {
    const ranked = [...SOURCE_ECONOMY].map(s => ({ ...s, per: s.kostnad / s.anstallda })).sort((a, b) => a.per - b.per)
    const best = ranked[0]
    return {
      answer: `${best.kanal} ger flest anställda per krona (${kr(Math.round(best.per))}/anställd). Referrals och interna kanaler slår de betalda.`,
      detail: ranked.map(s => `${s.kanal}: ${s.anstallda} anställda, ${kr(Math.round(s.per))}/anställd`),
      link: { to: '/analys', label: 'Öppna analys' },
    }
  }

  // Plan vs utfall
  if (has(q, 'i fas', 'årsplan', 'mål', 'hur går', 'läget', 'anställ', 'tillsatt')) {
    const mal = ctx.planStatuses.reduce((s, r) => s + r.row.antal, 0)
    const anst = ctx.planStatuses.reduce((s, r) => s + r.anstallda, 0)
    const efter = ctx.planStatuses.filter(s => s.prognosLage === 'efter plan').length
    const ejStart = ctx.planStatuses.filter(s => s.prognosLage === 'ej startad').length
    return {
      answer: `${anst} av ${mal} planerade tjänster är tillsatta. ${efter + ejStart === 0 ? 'Inga roller ligger efter plan.' : `${efter} ligger efter plan och ${ejStart} är inte startade.`}`,
      detail: ctx.planStatuses.map(s => `${s.row.rollTitel}: ${s.anstallda}/${s.row.antal} — ${prognosLabel[s.prognosLage].toLowerCase()}`),
      link: { to: '/ledningsfragor', label: 'Se ledningsfrågor' },
    }
  }

  // Headhunt-leaderboard
  if (has(q, 'headhunt', 'fångar', 'leaderboard', 'rekryterare', 'flest')) {
    const map = new Map<string, number>()
    for (const c of ctx.candidates) {
      if (c.source === 'Headhunt' && c.headhuntLinkId) {
        const link = ctx.headhuntLinks.find(l => l.id === c.headhuntLinkId)
        if (link) map.set(link.recruiter, (map.get(link.recruiter) ?? 0) + 1)
      }
    }
    const ranked = [...map.entries()].sort((a, b) => b[1] - a[1])
    if (!ranked.length) return { answer: 'Inga headhunt-ansökningar registrerade ännu.', link: { to: '/headhunt', label: 'Öppna headhunt' } }
    return {
      answer: `${ranked[0][0]} leder med ${ranked[0][1]} headhunt-ansökning${ranked[0][1] > 1 ? 'ar' : ''}.`,
      detail: ranked.map(([r, n]) => `${r}: ${n} ansökningar via länk`),
      link: { to: '/headhunt', label: 'Öppna leaderboard' },
    }
  }

  // Budget
  if (has(q, 'budget', 'över', 'kostnad', 'dyrt')) {
    const over = ctx.planStatuses.filter(s => s.budgetLage === 'över')
    if (!over.length) return { answer: 'Alla roller ligger inom sin rekryteringsbudget.', link: { to: '/planering', label: 'Öppna planen' } }
    return {
      answer: `${over.length} roll${over.length > 1 ? 'er' : ''} ligger över sin rekryteringsbudget:`,
      detail: over.map(s => `${s.row.rollTitel}: ${kr(s.kostnadUtfall)} av ${kr(s.row.rekrbudget)}`),
      link: { to: '/planering', label: 'Öppna planen' },
    }
  }

  // Fallback
  return {
    answer: 'Jag kan svara på frågor om planläget, förseningar, budget, requisitions, kanal-ROI och headhunting. Prova någon av exemplen nedan.',
  }
}
