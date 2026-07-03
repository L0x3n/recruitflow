// Små SVG-diagram utan beroenden.

export function Sparkline({ data, color = '#1F5C46', width = 90, height = 26 }: {
  data: number[]; color?: string; width?: number; height?: number
}) {
  const min = Math.min(...data)
  const max = Math.max(...data)
  const span = max - min || 1
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * width},${height - 3 - ((v - min) / span) * (height - 6)}`)
    .join(' ')
  return (
    <svg width={width} height={height} className="spark">
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function Donut({ data, size = 170 }: {
  data: { label: string; value: number; color: string }[]; size?: number
}) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const r = size / 2 - 14
  const cx = size / 2
  const cy = size / 2
  let acc = 0
  const arcs = data.map(d => {
    const a0 = (acc / total) * Math.PI * 2 - Math.PI / 2
    acc += d.value
    const a1 = (acc / total) * Math.PI * 2 - Math.PI / 2
    const large = a1 - a0 > Math.PI ? 1 : 0
    const x0 = cx + r * Math.cos(a0)
    const y0 = cy + r * Math.sin(a0)
    const x1 = cx + r * Math.cos(a1)
    const y1 = cy + r * Math.sin(a1)
    return { d, path: `M ${x0} ${y0} A ${r} ${r} 0 ${large} 1 ${x1} ${y1}` }
  })
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
      <svg width={size} height={size}>
        {arcs.map(a => (
          <path key={a.d.label} d={a.path} fill="none" stroke={a.d.color} strokeWidth={22} />
        ))}
        <text x={cx} y={cy - 4} textAnchor="middle" fontSize={20} fontWeight={750} fill="#1A2B24">{total}%</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize={10.5} fill="#6B7A73">källfördelning</text>
      </svg>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 12.5 }}>
        {data.map(d => (
          <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: d.color, display: 'inline-block' }} />
            <span>{d.label}</span>
            <b style={{ marginLeft: 'auto' }}>{d.value}%</b>
          </div>
        ))}
      </div>
    </div>
  )
}

const RADAR_COLORS = ['#1F5C46', '#2563EB', '#8B5CF6']

export function Radar({ axes, series, size = 300 }: {
  axes: string[]
  series: { name: string; values: number[] }[]
  size?: number
}) {
  const cx = size / 2
  const cy = size / 2 + 6
  const r = size / 2 - 52
  const angle = (i: number) => (i / axes.length) * Math.PI * 2 - Math.PI / 2
  const pt = (i: number, v: number) => {
    const rr = (v / 5) * r
    return `${cx + rr * Math.cos(angle(i))},${cy + rr * Math.sin(angle(i))}`
  }
  return (
    <div>
      <svg width={size} height={size} style={{ display: 'block', margin: '0 auto' }}>
        {[1, 2, 3, 4, 5].map(lvl => (
          <polygon
            key={lvl}
            points={axes.map((_, i) => pt(i, lvl)).join(' ')}
            fill="none" stroke="#E3E9E6" strokeWidth={1}
          />
        ))}
        {axes.map((a, i) => {
          const x = cx + (r + 24) * Math.cos(angle(i))
          const y = cy + (r + 24) * Math.sin(angle(i))
          return (
            <g key={a}>
              <line x1={cx} y1={cy} x2={cx + r * Math.cos(angle(i))} y2={cy + r * Math.sin(angle(i))} stroke="#E3E9E6" />
              <text x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize={10.5} fill="#6B7A73">
                {a.length > 18 ? a.slice(0, 17) + '…' : a}
              </text>
            </g>
          )
        })}
        {series.map((s, si) => (
          <polygon
            key={s.name}
            points={s.values.map((v, i) => pt(i, v)).join(' ')}
            fill={RADAR_COLORS[si % 3] + '22'}
            stroke={RADAR_COLORS[si % 3]}
            strokeWidth={2}
          />
        ))}
      </svg>
      <div className="radar-legend">
        {series.map((s, si) => (
          <span key={s.name}>
            <span className="rl-dot" style={{ background: RADAR_COLORS[si % 3] }} />
            {s.name}
          </span>
        ))}
      </div>
    </div>
  )
}
