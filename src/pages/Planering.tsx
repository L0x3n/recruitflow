import { useMemo, useRef, useState } from 'react'
import { RECRUITERS } from '../data'
import { prognosLabel } from '../planning'
import type { RowStatus } from '../planning'
import { useStore } from '../store'
import type { PlanRow } from '../types'

const kr = (n: number) => n.toLocaleString('sv-SE') + ' kr'

const PROGNOS_CLASS: Record<string, string> = {
  'klar': 'chip', 'i fas': 'chip', 'risk': 'chip warn', 'efter plan': 'chip danger', 'ej startad': 'chip gray',
}

// ---------- Import (CSV + Excel/.xlsx) ----------

const TEMPLATE_ROWS = [
  ['avdelning', 'roll', 'antal', 'lonebudget', 'rekrbudget', 'kvartal', 'malstart', 'ansvarig', 'kompetenser'],
  ['Marknad', 'Marknadskoordinator', '1', '42000', '25000', 'Q4 2026', '2026-11-01', 'Sofia Renberg', 'SEO/Content'],
  ['Utveckling', 'Data engineer', '2', '60000', '55000', 'Q1 2027', '2027-02-01', 'Eva Lindqvist', 'Python/SQL/dbt'],
]

interface ParsedSheet { headers: string[]; rows: string[][]; sheetNames?: string[] }

// Excel-datumcell → ISO (yyyy-mm-dd), tidszonssäkert (annars kan datum glida en dag).
function fmtDate(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

// Array-of-arrays → headers + rader. Hoppar över tomma inledande rader
// (vanligt i Excel-planer med logga/rubrik högst upp).
function normalizeAoa(aoa: unknown[][]): ParsedSheet {
  const clean = aoa.map(r => (r ?? []).map(c => {
    if (c == null) return ''
    if (c instanceof Date) return fmtDate(c)
    return String(c).trim()
  }))
  const headerIdx = clean.findIndex(r => r.filter(c => c !== '').length >= 2)
  if (headerIdx < 0) return { headers: [], rows: [] }
  const headers = clean[headerIdx]
  const rows = clean.slice(headerIdx + 1).filter(r => r.some(c => c !== ''))
  return { headers, rows }
}

function parseCsv(text: string): ParsedSheet {
  const lines = text.split(/\r?\n/).filter(l => l.trim())
  if (!lines.length) return { headers: [], rows: [] }
  const delim = (lines[0].match(/;/g)?.length ?? 0) >= (lines[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const split = (l: string) => l.split(delim).map(c => c.trim().replace(/^"|"$/g, ''))
  return normalizeAoa(lines.map(split))
}

const isExcel = (name: string) => /\.(xlsx|xls|xlsm)$/i.test(name)

// SheetJS laddas lazy (dynamisk import) → hålls utanför huvudbundlen.
async function parseExcel(file: File, sheetName?: string): Promise<ParsedSheet> {
  const XLSX = await import('xlsx')
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true })
  const names = wb.SheetNames
  const pick = sheetName && names.includes(sheetName) ? sheetName : names[0]
  // raw:true → datumceller kommer som Date-objekt (formateras i normalizeAoa), tal som tal.
  const aoa = XLSX.utils.sheet_to_json(wb.Sheets[pick], {
    header: 1, raw: true, defval: '',
  }) as unknown[][]
  return { ...normalizeAoa(aoa), sheetNames: names }
}

const num = (s: string) => Number(s.replace(/[^\d]/g, '')) || 0

const FIELDS: { key: string; label: string; guess: RegExp }[] = [
  { key: 'avdelning', label: 'Avdelning', guess: /avdelning|department|team/i },
  { key: 'rollTitel', label: 'Roll', guess: /roll|titel|title|position|befattning|tjänst|namn/i },
  { key: 'antal', label: 'Antal', guess: /antal|headcount|count|hc/i },
  { key: 'lonebudget', label: 'Lönebudget (kr/mån)', guess: /l[oö]n|salary/i },
  { key: 'rekrbudget', label: 'Rekryteringsbudget (kr)', guess: /rekr|recruit|budget/i },
  { key: 'malKvartal', label: 'Målkvartal', guess: /kvartal|quarter|q\b/i },
  { key: 'malStart', label: 'Målstart (datum)', guess: /start|datum|date/i },
  { key: 'ansvarig', label: 'Ansvarig rekryterare', guess: /ansvarig|rekryterare|recruiter|owner/i },
  { key: 'kompetenser', label: 'Kompetenser (valfri)', guess: /kompetens|skill/i },
]

function ImportTab() {
  const { addPlanRows, toast } = useStore()
  const [parsed, setParsed] = useState<ParsedSheet | null>(null)
  const [mapping, setMapping] = useState<Record<string, number>>({})
  const [done, setDone] = useState<number | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [activeSheet, setActiveSheet] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const applyParsed = (p: ParsedSheet) => {
    setParsed(p)
    const auto: Record<string, number> = {}
    FIELDS.forEach(field => {
      const i = p.headers.findIndex(h => field.guess.test(h))
      if (i >= 0) auto[field.key] = i
    })
    setMapping(auto)
  }

  const onFile = async (f: File) => {
    setDone(null)
    setFile(f)
    setActiveSheet('')
    try {
      if (isExcel(f.name)) {
        setLoading(true)
        const p = await parseExcel(f)
        setActiveSheet(p.sheetNames?.[0] ?? '')
        applyParsed(p)
      } else {
        applyParsed(parseCsv(await f.text()))
      }
    } catch {
      toast('Kunde inte läsa filen — kontrollera att det är en giltig CSV eller Excel-fil')
      setParsed(null)
    } finally {
      setLoading(false)
    }
  }

  const switchSheet = async (name: string) => {
    if (!file) return
    setActiveSheet(name)
    setLoading(true)
    try { applyParsed(await parseExcel(file, name)) } finally { setLoading(false) }
  }

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx')
    const ws = XLSX.utils.aoa_to_sheet(TEMPLATE_ROWS)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plan 2026')
    XLSX.writeFile(wb, 'planeringsmall.xlsx')
  }

  const ready = parsed && ['avdelning', 'rollTitel', 'antal'].every(k => mapping[k] !== undefined)

  const doImport = async () => {
    if (!parsed || !ready) return
    const get = (row: string[], key: string) => mapping[key] !== undefined ? (row[mapping[key]] ?? '') : ''
    const rows: Omit<PlanRow, 'id'>[] = parsed.rows.map(r => ({
      avdelning: get(r, 'avdelning') || 'Övrigt',
      rollTitel: get(r, 'rollTitel') || 'Ny roll',
      antal: num(get(r, 'antal')) || 1,
      kompetenser: get(r, 'kompetenser').split('/').map(s => s.trim()).filter(Boolean),
      lonebudget: num(get(r, 'lonebudget')),
      rekrbudget: num(get(r, 'rekrbudget')),
      malKvartal: get(r, 'malKvartal') || 'Q4 2026',
      malStart: get(r, 'malStart') || '2026-12-31',
      ansvarig: get(r, 'ansvarig'),
      prioritet: 'normal',
    }))
    const n = await addPlanRows(rows)
    if (n !== null) { setDone(n); setParsed(null); setFile(null); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="banner-ok">
        ✦ Migreringen bort från Excel: dra in er befintliga .xlsx-plan direkt — vi läser flikar, rubriker och datum
        automatiskt. Importera EN gång, sedan bor planen här kopplad till live-pipelinen i stället för döda celler.
      </div>
      <div className="card">
        <h3 style={{ marginBottom: 10 }}>1. Välj fil — Excel (.xlsx/.xls) eller CSV</h3>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.txt,.xlsx,.xls,.xlsm"
            data-testid="csv-input"
            onChange={e => e.target.files?.[0] && onFile(e.target.files[0])}
          />
          <button className="btn small" onClick={downloadTemplate}>⤓ Ladda ner Excel-mall</button>
          {loading && <span className="muted small">Läser filen…</span>}
        </div>
        {file && isExcel(file.name) && parsed?.sheetNames && parsed.sheetNames.length > 1 && (
          <div style={{ marginTop: 10 }}>
            <label className="small muted">Flik i arbetsboken</label>
            <select
              className="editable-input mini-select"
              value={activeSheet}
              onChange={e => switchSheet(e.target.value)}
              data-testid="sheet-select"
            >
              {parsed.sheetNames.map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>
        )}
        {done !== null && <div className="banner-ok" style={{ marginTop: 10 }}>✓ {done} rader importerade till planen.</div>}
      </div>

      {parsed && (
        <div className="card">
          <h3 style={{ marginBottom: 10 }}>2. Mappa kolumner ({parsed.rows.length} rader hittade)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {FIELDS.map(f => (
              <div key={f.key}>
                <label className="small muted">{f.label}</label>
                <select
                  className="editable-input"
                  value={mapping[f.key] ?? -1}
                  onChange={e => setMapping(m => ({ ...m, [f.key]: Number(e.target.value) }))}
                >
                  <option value={-1}>— ingen —</option>
                  {parsed.headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                </select>
              </div>
            ))}
          </div>
          <h3 style={{ margin: '14px 0 8px' }}>3. Förhandsgranska</h3>
          <table className="tbl">
            <thead><tr>{parsed.headers.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
            <tbody>
              {parsed.rows.slice(0, 5).map((r, i) => (
                <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>
              ))}
            </tbody>
          </table>
          <button
            className={`btn primary${ready ? '' : ' disabled'}`}
            disabled={!ready}
            style={{ marginTop: 12 }}
            onClick={doImport}
            data-testid="csv-import"
          >
            Importera {parsed.rows.length} rader →
          </button>
        </div>
      )}
    </div>
  )
}

// ---------- Scenarier ----------

const totalsOf = (rows: PlanRow[]) => ({
  antal: rows.reduce((s, r) => s + r.antal, 0),
  lon: rows.reduce((s, r) => s + r.antal * r.lonebudget, 0),
  rekr: rows.reduce((s, r) => s + r.rekrbudget, 0),
})

function ScenarioTab() {
  const { plan, scenarios, createScenario, updateScenarioRow, deleteScenario } = useStore()
  const [namn, setNamn] = useState('')
  const base = totalsOf(plan.rows)

  return (
    <div className="grid" style={{ gap: 14 }}>
      <div className="card">
        <h3 style={{ marginBottom: 8 }}>What-if — kopiera planen och dra i siffrorna</h3>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            className="editable-input"
            style={{ maxWidth: 280 }}
            placeholder='t.ex. "Om vi fryser Sälj Q1"'
            value={namn}
            onChange={e => setNamn(e.target.value)}
          />
          <button
            className={`btn primary${namn.trim() ? '' : ' disabled'}`}
            disabled={!namn.trim()}
            onClick={() => { createScenario(namn.trim()); setNamn('') }}
          >
            + Skapa scenario
          </button>
        </div>
      </div>

      {scenarios.map(sc => {
        const t = totalsOf(sc.rows)
        const d = { antal: t.antal - base.antal, lon: t.lon - base.lon, rekr: t.rekr - base.rekr }
        const sign = (n: number) => (n > 0 ? '+' : '') + n.toLocaleString('sv-SE')
        return (
          <div key={sc.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}>
              <h3>{sc.namn} <span className="muted small">skapat {sc.skapad}</span></h3>
              <button className="btn small" onClick={() => deleteScenario(sc.id)}>Radera</button>
            </div>
            <table className="tbl" style={{ marginTop: 8 }}>
              <thead>
                <tr><th>Roll</th><th className="num">Antal</th><th className="num">Lönebudget/mån</th><th className="num">Rekr.budget</th></tr>
              </thead>
              <tbody>
                {sc.rows.map(r => (
                  <tr key={r.id}>
                    <td>{r.rollTitel} <span className="muted small">({r.avdelning})</span></td>
                    <td className="num">
                      <input
                        type="number" className="editable-input num-input" defaultValue={r.antal} min={0}
                        onBlur={e => updateScenarioRow(sc.id, r.id, { antal: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="num">
                      <input
                        type="number" className="editable-input num-input wide" defaultValue={r.lonebudget} step={1000}
                        onBlur={e => updateScenarioRow(sc.id, r.id, { lonebudget: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td className="num">
                      <input
                        type="number" className="editable-input num-input wide" defaultValue={r.rekrbudget} step={5000}
                        onBlur={e => updateScenarioRow(sc.id, r.id, { rekrbudget: Number(e.target.value) || 0 })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="scenario-diff">
              <span>Jämfört med huvudplanen:</span>
              <span className="chip blue">{sign(d.antal)} personer</span>
              <span className="chip blue">{sign(d.lon)} kr/mån lönebudget</span>
              <span className="chip blue">{sign(d.rekr)} kr rekryteringsbudget</span>
            </div>
          </div>
        )
      })}
      {scenarios.length === 0 && <div className="muted small">Inga scenarier ännu — skapa ett ovan.</div>}
    </div>
  )
}

// ---------- Huvudtabellen ----------

function PlanTable({ statuses, canEdit }: { statuses: RowStatus[]; canEdit: boolean }) {
  const { roles, updatePlanRow, deletePlanRow } = useStore()

  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <table className="tbl plan-tbl">
        <thead>
          <tr>
            <th>Avdelning</th><th>Roll</th><th className="num">Mål</th><th className="num">Anställda</th>
            <th className="num">Aktiva kand.</th><th>Prognos</th><th>Målstart</th>
            <th className="num">Lönebudget/mån</th><th className="num">Rekr.budget</th><th className="num">Utfall</th>
            <th>Ansvarig</th>{canEdit && <th />}
          </tr>
        </thead>
        <tbody>
          {statuses.map(s => {
            const r = s.row
            return (
              <tr key={r.id} data-testid={`plan-row-${r.id}`}>
                <td>{r.avdelning}</td>
                <td>
                  <b>{r.rollTitel}</b>
                  <div style={{ marginTop: 2 }}>
                    {canEdit ? (
                      <select
                        className="editable-input mini-select"
                        value={r.koppladRollId ?? ''}
                        onChange={e => updatePlanRow(r.id, { koppladRollId: e.target.value || undefined })}
                      >
                        <option value="">ej kopplad till rekrytering</option>
                        {roles.map(role => <option key={role.id} value={role.id}>↳ {role.titel}</option>)}
                      </select>
                    ) : (
                      r.koppladRollId
                        ? <span className="chip gray">↳ {roles.find(x => x.id === r.koppladRollId)?.titel}</span>
                        : <span className="muted small">ej startad</span>
                    )}
                  </div>
                </td>
                <td className="num">
                  {canEdit
                    ? <input type="number" className="editable-input num-input" defaultValue={r.antal} min={0}
                        onBlur={e => updatePlanRow(r.id, { antal: Number(e.target.value) || 0 })} />
                    : <b>{r.antal}</b>}
                </td>
                <td className="num">{s.anstallda}</td>
                <td className="num">{s.aktiva}</td>
                <td>
                  <span className={PROGNOS_CLASS[s.prognosLage]}>{prognosLabel[s.prognosLage]}</span>
                  {s.prognosStart && s.prognosLage !== 'klar' && (
                    <div className="muted small">{s.prognosStart}</div>
                  )}
                </td>
                <td>
                  {canEdit
                    ? <input className="editable-input num-input wide" defaultValue={r.malStart}
                        onBlur={e => updatePlanRow(r.id, { malStart: e.target.value })} />
                    : r.malStart}
                  <div className="muted small">{r.malKvartal}</div>
                </td>
                <td className="num">
                  {canEdit
                    ? <input type="number" className="editable-input num-input wide" defaultValue={r.lonebudget} step={1000}
                        onBlur={e => updatePlanRow(r.id, { lonebudget: Number(e.target.value) || 0 })} />
                    : kr(r.lonebudget)}
                  {s.lonUtfall !== null && (
                    <div className={`small ${s.lonUtfall <= r.lonebudget ? 'muted' : 'over-budget'}`}>
                      utfall {kr(s.lonUtfall)}
                    </div>
                  )}
                </td>
                <td className="num">
                  {canEdit
                    ? <input type="number" className="editable-input num-input wide" defaultValue={r.rekrbudget} step={5000}
                        onBlur={e => updatePlanRow(r.id, { rekrbudget: Number(e.target.value) || 0 })} />
                    : kr(r.rekrbudget)}
                </td>
                <td className={`num${s.budgetLage === 'över' ? ' over-budget' : ''}`}>
                  {kr(s.kostnadUtfall)}{s.budgetLage === 'över' && ' ⚠'}
                </td>
                <td>
                  {canEdit ? (
                    <select
                      className="editable-input mini-select"
                      value={r.ansvarig}
                      onChange={e => updatePlanRow(r.id, { ansvarig: e.target.value })}
                      data-testid={`delegate-${r.id}`}
                    >
                      <option value="">— ej delegerad —</option>
                      {RECRUITERS.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  ) : (r.ansvarig || <span className="chip warn">ej delegerad</span>)}
                </td>
                {canEdit && (
                  <td><button className="btn small" onClick={() => deletePlanRow(r.id)} title="Ta bort rad">✕</button></td>
                )}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="muted small" style={{ marginTop: 10 }}>
        Anställda, aktiva kandidater, utfall och prognos hämtas live ur pipelinen — ingenting skrivs för hand.
      </div>
    </div>
  )
}

// ---------- Sidan ----------

export function Planering() {
  const { plan, planStatuses, can, currentUser } = useStore()
  const canEdit = can('wfp.edit')
  const ownOnly = can('wfp.viewOwn') && !can('wfp.view')
  const [tab, setTab] = useState<'plan' | 'import' | 'scenarier'>('plan')

  const visible = useMemo(
    () => ownOnly ? planStatuses.filter(s => s.row.ansvarig === currentUser?.name) : planStatuses,
    [planStatuses, ownOnly, currentUser],
  )

  const sum = useMemo(() => ({
    mal: visible.reduce((s, r) => s + r.row.antal, 0),
    anstallda: visible.reduce((s, r) => s + r.anstallda, 0),
    aktiva: visible.reduce((s, r) => s + r.aktiva, 0),
    rekrBudget: visible.reduce((s, r) => s + r.row.rekrbudget, 0),
    rekrUtfall: visible.reduce((s, r) => s + r.kostnadUtfall, 0),
    lonBudget: visible.reduce((s, r) => s + r.row.antal * r.row.lonebudget, 0),
  }), [visible])

  return (
    <div className="grid" style={{ gap: 16 }}>
      <div className="page-head">
        <div>
          <h1>{ownOnly ? 'Min planering' : `Planering — ${plan.namn}`}</h1>
          <div className="sub">
            {ownOnly
              ? `Raderna som ${currentUser?.name.split(' ')[0]} ansvarar för — mål, budget och prognos i realtid.`
              : 'Workforce planning utan Excel: mål, budget och prognos — kopplat direkt till pipelinen.'}
          </div>
        </div>
      </div>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}>
        <div className="kpi"><div className="kpi-label">Headcount-mål</div><div className="kpi-value">{sum.mal}</div><div className="kpi-trend">{sum.anstallda} anställda hittills</div></div>
        <div className="kpi"><div className="kpi-label">Aktiva kandidater</div><div className="kpi-value">{sum.aktiva}</div><div className="kpi-trend">mot {sum.mal - sum.anstallda} kvarvarande platser</div></div>
        <div className="kpi"><div className="kpi-label">Rekryteringsbudget</div><div className="kpi-value">{Math.round(sum.rekrBudget / 1000)} tkr</div><div className="kpi-trend">{Math.round(sum.rekrUtfall / 1000)} tkr använt</div></div>
        <div className="kpi"><div className="kpi-label">Lönebudget (nya)</div><div className="kpi-value">{Math.round(sum.lonBudget / 1000)} tkr/mån</div><div className="kpi-trend">vid full plan</div></div>
        <div className="kpi"><div className="kpi-label">Budgetläge</div>
          <div className="kpi-value">{visible.filter(s => s.budgetLage === 'över').length > 0 ? '⚠' : '✓'}</div>
          <div className="kpi-trend">{visible.filter(s => s.budgetLage === 'över').length} rader över budget</div>
        </div>
      </div>

      {canEdit && (
        <div className="tabs" style={{ borderBottom: '1px solid var(--border)' }}>
          <button className={tab === 'plan' ? 'on' : ''} onClick={() => setTab('plan')}>Planen</button>
          <button className={tab === 'import' ? 'on' : ''} onClick={() => setTab('import')}>Importera från Excel/CSV</button>
          <button className={tab === 'scenarier' ? 'on' : ''} onClick={() => setTab('scenarier')}>Scenarier (what-if)</button>
        </div>
      )}

      {tab === 'plan' && <PlanTable statuses={visible} canEdit={canEdit} />}
      {tab === 'import' && canEdit && <ImportTab />}
      {tab === 'scenarier' && canEdit && <ScenarioTab />}
    </div>
  )
}
