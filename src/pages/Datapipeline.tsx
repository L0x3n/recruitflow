import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PIPE_NODE, PIPELINE_INSIGHTS, PIPELINE_SOURCES } from '../data'
import type { PipelineNode } from '../data'

// Dynamiskt koordinatsystem (px) — positioner räknas ur antalet noder.
const W = 1200
const H = 660
const MARGIN = 24
const GAP = 14
const SRC_Y = 20
const SRC_H = 66
const PIPE = { x: 70, y: 300, w: W - 140, h: 74 }
const OUT_Y = 540
const OUT_H = 70

const N_SRC = PIPELINE_SOURCES.length
const N_OUT = PIPELINE_INSIGHTS.length
const SRC_W = (W - MARGIN * 2 - GAP * (N_SRC - 1)) / N_SRC
const OUT_W = (W - MARGIN * 2 - GAP * (N_OUT - 1)) / N_OUT

const srcX = (i: number) => MARGIN + i * (SRC_W + GAP)
const outX = (i: number) => MARGIN + i * (OUT_W + GAP)
// fördela rör-anslutningar jämnt över rörets bredd
const pipeInX = (i: number) => PIPE.x + (PIPE.w * (i + 0.5)) / N_SRC
const pipeOutX = (i: number) => PIPE.x + (PIPE.w * (i + 0.5)) / N_OUT

const CHEF_INDEX = PIPELINE_SOURCES.findIndex(s => s.id === 'chefer')

interface Tip { node: PipelineNode; x: number; y: number }

export function Datapipeline() {
  const navigate = useNavigate()
  const [reality, setReality] = useState(false)
  const [tip, setTip] = useState<Tip | null>(null)

  const go = (n: PipelineNode) => {
    const [pathAndQuery, hash] = n.to.split('#')
    const sep = pathAndQuery.includes('?') ? '&' : '?'
    navigate(`${pathAndQuery}${sep}from=pipeline&fields=${encodeURIComponent(n.fields.join(', '))}${hash ? '#' + hash : ''}`)
  }
  const hover = (n: PipelineNode, x: number, y: number) => setTip({ node: n, x, y })

  const inPath = (i: number) => {
    const cx = srcX(i) + SRC_W / 2
    const px = pipeInX(i)
    return `M ${cx} ${SRC_Y + SRC_H} C ${cx} ${SRC_Y + SRC_H + 100}, ${px} ${PIPE.y - 80}, ${px} ${PIPE.y}`
  }
  const brokenPath = () => {
    const cx = srcX(CHEF_INDEX) + SRC_W / 2
    return `M ${cx} ${SRC_Y + SRC_H} C ${cx} ${SRC_Y + SRC_H + 60}, ${cx} ${SRC_Y + SRC_H + 90}, ${cx} ${SRC_Y + SRC_H + 120}`
  }
  const outPath = (i: number) => {
    const bx = pipeOutX(i)
    const cx = outX(i) + OUT_W / 2
    return `M ${bx} ${PIPE.y + PIPE.h} C ${bx} ${PIPE.y + PIPE.h + 60}, ${cx} ${OUT_Y - 60}, ${cx} ${OUT_Y}`
  }

  // Huvudloop: insikter → tillbaka upp till källorna (höger sida)
  const loopPath = `M ${outX(N_OUT - 1) + OUT_W} ${OUT_Y + OUT_H / 2} C ${W - 6} ${OUT_Y}, ${W - 6} ${SRC_Y + 40}, ${srcX(N_SRC - 1) + SRC_W - 30} ${SRC_Y + SRC_H + 6}`
  // Andra loopen: Lärande/QoH → Planering (plan → utfall → nästa plan), vänster sida
  const larIdx = PIPELINE_INSIGHTS.findIndex(n => n.id === 'larande')
  const planIdx = 0
  const loop2 = `M ${outX(larIdx) + OUT_W / 2} ${OUT_Y + OUT_H} C ${20} ${OUT_Y + 90}, ${20} ${SRC_Y - 40}, ${srcX(planIdx) + SRC_W / 2} ${SRC_Y}`

  const chefX = srcX(CHEF_INDEX) + SRC_W / 2

  return (
    <div className="pipeline-page" data-tour="pipeline-map">
      <div className="page-head">
        <div>
          <h1>Datapipeline — hela flödet på en karta</h1>
          <div className="sub">
            {reality
              ? <span style={{ color: '#C2410C', fontWeight: 650 }}>Verkligheten: chefsfeedback når aldrig pipen — datan läcker innan den blir strukturerad.</span>
              : 'Varje nod är klickbar och tar dig till exakt den skärm där datan skapas eller används. Två loopar: process ↻ och plan → utfall → nästa plan.'}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div className="pl-legend">
            <span><span className="dot-b" />rådata in</span>
            <span><span className="dot-g" />insikter ut</span>
          </div>
          <div className="reality-toggle" data-testid="reality-toggle">
            <button className={!reality ? 'on-perfect' : ''} onClick={() => setReality(false)}>Perfekt värld</button>
            <button className={reality ? 'on-reality' : ''} onClick={() => setReality(true)}>Visa verkligheten</button>
          </div>
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <div className="pipeline-canvas" style={{ width: W, height: H, margin: '0 auto' }}>
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            <defs>
              <marker id="arrow-loop" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#7C9C8E" />
              </marker>
              <marker id="arrow-loop2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#2563EB" />
              </marker>
            </defs>

            {/* Inflöden (blå) */}
            {PIPELINE_SOURCES.map((_, i) => {
              if (reality && i === CHEF_INDEX) return null
              return (
                <g key={i}>
                  <path d={inPath(i)} fill="none" stroke="#B6CDF5" strokeWidth={2.5} />
                  {[0, 1].map(k => (
                    <circle key={k} r={4} fill="#2563EB">
                      <animateMotion dur="3.4s" repeatCount="indefinite" begin={`${i * 0.45 + k * 1.7}s`} path={inPath(i)} />
                    </circle>
                  ))}
                </g>
              )
            })}

            {/* Chefsflödet i verklighetsläge: bruten, orange, droppar */}
            {reality && (
              <g>
                <path d={brokenPath()} fill="none" stroke="#F0913F" strokeWidth={2.5} strokeDasharray="7 6" />
                <text x={chefX} y={SRC_Y + SRC_H + 140} textAnchor="middle" fontSize={22} fontWeight={800} fill="#F0913F">✕</text>
                {[-14, 0, 14].map((dx, k) => (
                  <circle key={k} cx={chefX + dx} r={4} fill="#F0913F">
                    <animate attributeName="cy" values={`${SRC_Y + SRC_H + 150};${PIPE.y - 20}`} dur="1.6s" begin={`${k * 0.5}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="1.6s" begin={`${k * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                <text x={chefX} y={SRC_Y + SRC_H + 178} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#C2410C">
                  3 dagars svarstid · bortglömt i Slack
                </text>
              </g>
            )}

            {/* Utflöden (gröna) */}
            {PIPELINE_INSIGHTS.map((_, i) => (
              <g key={i}>
                <path d={outPath(i)} fill="none" stroke="#ABCEBB" strokeWidth={2.5} />
                {[0, 1].map(k => (
                  <circle key={k} r={4} fill="#1F5C46">
                    <animateMotion dur="3.4s" repeatCount="indefinite" begin={`${i * 0.55 + k * 1.7 + 0.3}s`} path={outPath(i)} />
                  </circle>
                ))}
              </g>
            ))}

            {/* Huvudloop */}
            <path d={loopPath} fill="none" stroke="#7C9C8E" strokeWidth={2} strokeDasharray="6 6" markerEnd="url(#arrow-loop)" />
            <text x={W - 14} y={(SRC_Y + OUT_Y) / 2} textAnchor="middle" fontSize={11} fill="#6B7A73" transform={`rotate(90 ${W - 14} ${(SRC_Y + OUT_Y) / 2})`}>
              insikter förbättrar processen
            </text>

            {/* Andra loopen: plan → utfall → plan */}
            <path d={loop2} fill="none" stroke="#2563EB" strokeWidth={2} strokeDasharray="2 5" markerEnd="url(#arrow-loop2)" opacity={0.8} />
            <text x={12} y={(SRC_Y + OUT_Y) / 2} textAnchor="middle" fontSize={11} fontWeight={700} fill="#2563EB" transform={`rotate(-90 12 ${(SRC_Y + OUT_Y) / 2})`}>
              utfallet formar nästa årsplan
            </text>

            {/* Radrubriker */}
            <text x={MARGIN} y={14} fontSize={11} fontWeight={700} fill="#6B7A73" letterSpacing="0.06em">KÄLLOR — RÅDATA IN</text>
            <text x={MARGIN} y={OUT_Y - 8} fontSize={11} fontWeight={700} fill="#6B7A73" letterSpacing="0.06em">INSIKTER UT</text>
          </svg>

          {/* Källnoder */}
          {PIPELINE_SOURCES.map((n, i) => (
            <div
              key={n.id}
              className={`pl-node src${reality && i === CHEF_INDEX ? ' broken' : ''}`}
              style={{ left: srcX(i), top: SRC_Y, width: SRC_W, height: SRC_H }}
              onClick={() => go(n)}
              onMouseEnter={() => hover(n, srcX(i), SRC_Y + SRC_H + 8)}
              onMouseLeave={() => setTip(null)}
              data-testid={`pl-node-${n.id}`}
            >
              <div className="pl-label">{n.label}{reality && i === CHEF_INDEX && ' ✕'}</div>
              <div className="pl-sub">{reality && i === CHEF_INDEX ? '3 av 5 bedömningar försvinner' : n.desc.split('—')[0]}</div>
            </div>
          ))}

          {/* Röret */}
          <div
            className="pl-pipe"
            style={{ left: PIPE.x, top: PIPE.y, width: PIPE.w, height: PIPE.h }}
            onClick={() => go(PIPE_NODE)}
            onMouseEnter={() => hover(PIPE_NODE, PIPE.x + PIPE.w / 2 - 125, PIPE.y + PIPE.h + 8)}
            onMouseLeave={() => setTip(null)}
            data-testid="pl-node-roret"
          >
            <span>Samla in</span><span>→</span>
            <span>Strukturera & tvätta</span><span>→</span>
            <span>Lagra</span>
          </div>
          <div style={{
            position: 'absolute', left: PIPE.x, top: PIPE.y + PIPE.h + 6, width: PIPE.w,
            textAlign: 'center', fontSize: 11.5, color: 'var(--green)', fontWeight: 700,
          }}>
            ✦ clean data skapas här
          </div>

          {/* Insiktsnoder */}
          {PIPELINE_INSIGHTS.map((n, i) => (
            <div
              key={n.id}
              className="pl-node out"
              style={{ left: outX(i), top: OUT_Y, width: OUT_W, height: OUT_H }}
              onClick={() => go(n)}
              onMouseEnter={() => hover(n, outX(i), OUT_Y - 128)}
              onMouseLeave={() => setTip(null)}
              data-testid={`pl-node-${n.id}`}
            >
              <div className="pl-label">{n.label}</div>
              <div className="pl-sub">{n.desc}</div>
            </div>
          ))}

          {/* Tooltip */}
          {tip && (
            <div className="pl-tooltip" style={{ left: Math.min(tip.x, W - 260), top: tip.y }}>
              <div className="tt-title">{tip.node.label}</div>
              <div>{tip.node.desc}</div>
              <ul>
                {tip.node.fields.map(f => <li key={f}>{f}</li>)}
              </ul>
              <div style={{ marginTop: 6, color: '#8FD4B2', fontWeight: 650 }}>Klicka för att öppna skärmen →</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
