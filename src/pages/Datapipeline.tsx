import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PIPE_NODE, PIPELINE_INSIGHTS, PIPELINE_SOURCES } from '../data'
import type { PipelineNode } from '../data'

// Fast koordinatsystem (px) — noder och SVG delar samma canvas.
const W = 1150
const H = 620
const SRC_W = 196
const SRC_XS = [37, 257, 477, 697, 917]
const SRC_Y = 20
const SRC_H = 64
const PIPE = { x: 85, y: 280, w: 980, h: 74 }
const PIPE_TOPS = [185, 380, 575, 770, 965]
const OUT_W = 240
const OUT_XS = [135, 455, 775]
const OUT_Y = 520
const PIPE_BOTTOMS = [285, 575, 865]

const CHEF_INDEX = 2

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
    const cx = SRC_XS[i] + SRC_W / 2
    const px = PIPE_TOPS[i]
    return `M ${cx} ${SRC_Y + SRC_H} C ${cx} 180, ${px} 200, ${px} ${PIPE.y}`
  }
  const brokenPath = () => {
    const cx = SRC_XS[CHEF_INDEX] + SRC_W / 2
    return `M ${cx} ${SRC_Y + SRC_H} C ${cx} 130, ${cx} 155, ${cx} 185`
  }
  const outPath = (i: number) => {
    const bx = PIPE_BOTTOMS[i]
    const cx = OUT_XS[i] + OUT_W / 2
    return `M ${bx} ${PIPE.y + PIPE.h} C ${bx} 430, ${cx} 445, ${cx} ${OUT_Y}`
  }
  const loopPath = `M ${OUT_XS[2] + OUT_W} 552 C 1135 545, 1135 110, ${SRC_XS[4] + SRC_W - 40} ${SRC_Y + SRC_H + 8}`

  const chefX = SRC_XS[CHEF_INDEX] + SRC_W / 2

  return (
    <div className="pipeline-page" data-tour="pipeline-map">
      <div className="page-head">
        <div>
          <h1>Datapipeline — hela flödet på en karta</h1>
          <div className="sub">
            {reality
              ? <span style={{ color: '#C2410C', fontWeight: 650 }}>Verkligheten: chefsfeedback når aldrig pipen — datan läcker innan den blir strukturerad.</span>
              : 'Varje nod är klickbar och tar dig till exakt den skärm där datan skapas eller används.'}
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
            </defs>

            {/* Inflöden (blå) */}
            {PIPELINE_SOURCES.map((_, i) => {
              if (reality && i === CHEF_INDEX) return null
              return (
                <g key={i}>
                  <path d={inPath(i)} fill="none" stroke="#B6CDF5" strokeWidth={2.5} />
                  {[0, 1].map(k => (
                    <circle key={k} r={4} fill="#2563EB">
                      <animateMotion dur="3.4s" repeatCount="indefinite" begin={`${i * 0.55 + k * 1.7}s`} path={inPath(i)} />
                    </circle>
                  ))}
                </g>
              )
            })}

            {/* Chefsflödet i verklighetsläge: bruten, orange, droppar som aldrig når pipen */}
            {reality && (
              <g>
                <path d={brokenPath()} fill="none" stroke="#F0913F" strokeWidth={2.5} strokeDasharray="7 6" />
                <text x={chefX} y={207} textAnchor="middle" fontSize={22} fontWeight={800} fill="#F0913F">✕</text>
                {[-14, 0, 14].map((dx, k) => (
                  <circle key={k} cx={chefX + dx} r={4} fill="#F0913F">
                    <animate attributeName="cy" values="215;268" dur="1.6s" begin={`${k * 0.5}s`} repeatCount="indefinite" />
                    <animate attributeName="opacity" values="1;0" dur="1.6s" begin={`${k * 0.5}s`} repeatCount="indefinite" />
                  </circle>
                ))}
                <text x={chefX} y={252} textAnchor="middle" fontSize={11.5} fontWeight={700} fill="#C2410C">
                  3 dagars svarstid · bortglömt i Slack · aldrig strukturerat
                </text>
              </g>
            )}

            {/* Utflöden (gröna) */}
            {PIPELINE_INSIGHTS.map((_, i) => (
              <g key={i}>
                <path d={outPath(i)} fill="none" stroke="#ABCEBB" strokeWidth={2.5} />
                {[0, 1].map(k => (
                  <circle key={k} r={4} fill="#1F5C46">
                    <animateMotion dur="3.4s" repeatCount="indefinite" begin={`${i * 0.7 + k * 1.7 + 0.3}s`} path={outPath(i)} />
                  </circle>
                ))}
              </g>
            ))}

            {/* Återkopplingsloopen */}
            <path d={loopPath} fill="none" stroke="#7C9C8E" strokeWidth={2} strokeDasharray="6 6" markerEnd="url(#arrow-loop)" />
            <text x={1128} y={330} textAnchor="middle" fontSize={11} fill="#6B7A73" transform="rotate(90 1128 330)">
              utfallet förbättrar nästa kravprofil
            </text>

            {/* Radrubriker */}
            <text x={10} y={14} fontSize={11} fontWeight={700} fill="#6B7A73" letterSpacing="0.06em">KÄLLOR — RÅDATA IN</text>
            <text x={10} y={512} fontSize={11} fontWeight={700} fill="#6B7A73" letterSpacing="0.06em">INSIKTER UT</text>
          </svg>

          {/* Källnoder */}
          {PIPELINE_SOURCES.map((n, i) => (
            <div
              key={n.id}
              className={`pl-node src${reality && i === CHEF_INDEX ? ' broken' : ''}`}
              style={{ left: SRC_XS[i], top: SRC_Y, width: SRC_W, height: SRC_H }}
              onClick={() => go(n)}
              onMouseEnter={() => hover(n, SRC_XS[i], SRC_Y + SRC_H + 8)}
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
              style={{ left: OUT_XS[i], top: OUT_Y, width: OUT_W, height: SRC_H }}
              onClick={() => go(n)}
              onMouseEnter={() => hover(n, OUT_XS[i], OUT_Y - 128)}
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
