import type { Candidate, HeadhuntLink, Role, WorkforcePlan } from './types'

export type Dimension = 'roll' | 'avdelning' | 'kalla' | 'rekryterare'
export type Metric = 'antal' | 'anstallda' | 'snittscore' | 'konvertering' | 'avslag'

export const DIMENSIONS: { id: Dimension; label: string }[] = [
  { id: 'roll', label: 'Roll' },
  { id: 'avdelning', label: 'Avdelning' },
  { id: 'kalla', label: 'Källa' },
  { id: 'rekryterare', label: 'Rekryterare' },
]

export const METRICS: { id: Metric; label: string; unit: string }[] = [
  { id: 'antal', label: 'Antal kandidater', unit: 'st' },
  { id: 'anstallda', label: 'Anställda', unit: 'st' },
  { id: 'snittscore', label: 'Snittscore', unit: '' },
  { id: 'konvertering', label: 'Konvertering till anställd', unit: '%' },
  { id: 'avslag', label: 'Avslag', unit: 'st' },
]

export interface ReportRow { label: string; value: number; sub?: string }

interface Ctx { candidates: Candidate[]; roles: Role[]; plan: WorkforcePlan; headhuntLinks: HeadhuntLink[] }

function dimensionKey(c: Candidate, dim: Dimension, ctx: Ctx): string {
  if (dim === 'roll') return ctx.roles.find(r => r.id === c.roleId)?.titel ?? 'Tidigare'
  if (dim === 'kalla') return c.source
  if (dim === 'avdelning') {
    const row = ctx.plan.rows.find(r => r.koppladRollId === c.roleId)
    return row?.avdelning ?? 'Övrigt'
  }
  // rekryterare
  if (c.headhuntLinkId) {
    const link = ctx.headhuntLinks.find(l => l.id === c.headhuntLinkId)
    if (link) return link.recruiter
  }
  const row = ctx.plan.rows.find(r => r.koppladRollId === c.roleId && r.ansvarig)
  return row?.ansvarig ?? 'Ej tilldelad'
}

function metricValue(group: Candidate[], metric: Metric): number {
  const antal = group.length
  const anstallda = group.filter(c => c.stage === 'anstalld').length
  if (metric === 'antal') return antal
  if (metric === 'anstallda') return anstallda
  if (metric === 'avslag') return group.filter(c => c.stage === 'avslag').length
  if (metric === 'konvertering') return antal ? Math.round((anstallda / antal) * 100) : 0
  // snittscore
  const scored = group.filter(c => c.score !== undefined)
  return scored.length ? Math.round((scored.reduce((s, c) => s + (c.score ?? 0), 0) / scored.length) * 10) / 10 : 0
}

export function buildReport(dim: Dimension, metric: Metric, ctx: Ctx): ReportRow[] {
  const pool = ctx.candidates.filter(c => !c.historical)
  const groups = new Map<string, Candidate[]>()
  for (const c of pool) {
    const k = dimensionKey(c, dim, ctx)
    if (!groups.has(k)) groups.set(k, [])
    groups.get(k)!.push(c)
  }
  return [...groups.entries()]
    .map(([label, group]) => ({ label, value: metricValue(group, metric), sub: `${group.length} kandidater` }))
    .filter(r => r.value > 0 || metric === 'snittscore')
    .sort((a, b) => b.value - a.value)
}

export const formatMetric = (v: number, metric: Metric) => {
  const m = METRICS.find(x => x.id === metric)!
  return metric === 'snittscore' ? v.toFixed(1).replace('.', ',') : `${v}${m.unit ? ' ' + m.unit : ''}`
}
