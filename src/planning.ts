import type { Candidate, Offer, PlanRow, PlanWarning, Role } from './types'

// Ren beräkningsmotor för Workforce Planning — allt härleds ur live-state.

export type PrognosLage = 'klar' | 'i fas' | 'risk' | 'efter plan' | 'ej startad'

export interface RowStatus {
  row: PlanRow
  anstallda: number
  aktiva: number
  kvar: number
  tackning: number | null // aktiva kandidater per kvarvarande plats
  prognosStart: string | null // ISO-datum
  prognosLage: PrognosLage
  kostnadUtfall: number // rekryteringskostnad hittills (kanaler)
  lonUtfall: number | null // snittlön för accepterade erbjudanden mot raden
  budgetLage: 'ok' | 'över'
}

const addWeeks = (iso: string, weeks: number) => {
  const d = new Date(iso + 'T12:00:00')
  d.setDate(d.getDate() + weeks * 7)
  return d.toISOString().slice(0, 10)
}

const parseLon = (lon: string): number | null => {
  const m = lon.replace(/\s/g, '').match(/(\d{4,6})/)
  return m ? Number(m[1]) : null
}

export function computeRow(
  row: PlanRow, candidates: Candidate[], roles: Role[], offers: Offer[], todayIso: string,
): RowStatus {
  const role = row.koppladRollId ? roles.find(r => r.id === row.koppladRollId) : undefined
  const cands = role ? candidates.filter(c => c.roleId === role.id && !c.historical) : []
  const anstallda = cands.filter(c => c.stage === 'anstalld').length
  const aktiva = cands.filter(c => c.stage !== 'anstalld' && c.stage !== 'avslag').length
  const kvar = Math.max(0, row.antal - anstallda)
  const kostnadUtfall = role ? role.annonsering.reduce((s, k) => s + k.kostnad, 0) : 0

  const acceptedLons = offers
    .filter(o => o.status === 'accepterat')
    .filter(o => cands.some(c => c.id === o.candidateId))
    .map(o => parseLon(o.lon))
    .filter((x): x is number => x !== null)
  const lonUtfall = acceptedLons.length
    ? Math.round(acceptedLons.reduce((a, b) => a + b, 0) / acceptedLons.length)
    : null

  let prognosLage: PrognosLage
  let prognosStart: string | null = null
  let tackning: number | null = null

  if (kvar === 0) {
    prognosLage = 'klar'
  } else if (!role) {
    prognosLage = 'ej startad'
  } else {
    tackning = Math.round((aktiva / kvar) * 10) / 10
    const veckor = tackning >= 4 ? 4 : tackning >= 2 ? 7 : tackning > 0 ? 10 : 14
    prognosStart = addWeeks(todayIso, veckor)
    const malPlus30 = addWeeks(row.malStart, 4.3)
    prognosLage = prognosStart <= row.malStart ? 'i fas' : prognosStart <= malPlus30 ? 'risk' : 'efter plan'
  }

  return {
    row, anstallda, aktiva, kvar, tackning, prognosStart, prognosLage,
    kostnadUtfall, lonUtfall,
    budgetLage: kostnadUtfall > row.rekrbudget ? 'över' : 'ok',
  }
}

export function computePlan(
  rows: PlanRow[], candidates: Candidate[], roles: Role[], offers: Offer[], todayIso: string,
): RowStatus[] {
  return rows.map(r => computeRow(r, candidates, roles, offers, todayIso))
}

const kr = (n: number) => n.toLocaleString('sv-SE') + ' kr'

// Varningsmotorn — chef ser alla, rekryterare sina egna. Stabila id:n → kvitterbara.
export function evaluateWarnings(
  statuses: RowStatus[], candidates: Candidate[], todayIso: string,
): PlanWarning[] {
  const warnings: PlanWarning[] = []

  for (const s of statuses) {
    const { row } = s
    const namn = `${row.rollTitel} (${row.avdelning})`

    if (s.budgetLage === 'över') {
      warnings.push({
        id: `budget-${row.id}`, rule: 'budget', severity: 'hög', rowId: row.id, ansvarig: row.ansvarig,
        text: `Rekryteringsbudgeten för ${namn} är överskriden: ${kr(s.kostnadUtfall)} av ${kr(row.rekrbudget)}.`,
      })
    }

    if (s.prognosLage === 'efter plan') {
      warnings.push({
        id: `prognos-${row.id}`, rule: 'prognos', severity: 'hög', rowId: row.id, ansvarig: row.ansvarig,
        text: `${namn} beräknas tillsättas ${s.prognosStart} — efter målet ${row.malStart}.`,
      })
    } else if (s.prognosLage === 'risk') {
      warnings.push({
        id: `prognos-${row.id}`, rule: 'prognos', severity: 'medel', rowId: row.id, ansvarig: row.ansvarig,
        text: `${namn} riskerar försening: prognos ${s.prognosStart} mot mål ${row.malStart}.`,
      })
    }

    if (s.prognosLage === 'ej startad' && row.malStart <= addWeeks(todayIso, 8)) {
      warnings.push({
        id: `ejstartad-${row.id}`, rule: 'ejstartad', severity: 'hög', rowId: row.id, ansvarig: row.ansvarig,
        text: `${namn} har målstart ${row.malStart} men rekryteringen är inte startad${row.ansvarig ? '' : ' och raden är inte delegerad'}.`,
      })
    }

    if (s.kvar > 0 && s.tackning !== null && s.aktiva < 3 * s.kvar) {
      warnings.push({
        id: `tackning-${row.id}`, rule: 'tackning', severity: 'medel', rowId: row.id, ansvarig: row.ansvarig,
        text: `Pipeline-täckningen för ${namn} är låg: ${s.aktiva} aktiva kandidater för ${s.kvar} ${s.kvar === 1 ? 'plats' : 'platser'}.`,
      })
    }

    if (row.koppladRollId) {
      const stilla = candidates.filter(c =>
        c.roleId === row.koppladRollId && !c.historical &&
        c.stage !== 'anstalld' && c.stage !== 'avslag' && c.stage !== 'nya' &&
        c.daysInStage >= 8)
      if (stilla.length) {
        warnings.push({
          id: `inaktivitet-${row.id}`, rule: 'inaktivitet', severity: 'medel', rowId: row.id, ansvarig: row.ansvarig,
          text: `${stilla.length === 1 ? 'En kandidat' : `${stilla.length} kandidater`} för ${namn} har stått stilla i 8+ dagar (${stilla.map(c => c.name).join(', ')}).`,
        })
      }
    }
  }

  return warnings.sort((a, b) => (a.severity === 'hög' ? 0 : 1) - (b.severity === 'hög' ? 0 : 1))
}

// Prognos i klartext för UI:t
export const prognosLabel: Record<PrognosLage, string> = {
  'klar': '✓ Klar',
  'i fas': 'I fas',
  'risk': 'Risk',
  'efter plan': 'Efter plan',
  'ej startad': 'Ej startad',
}
