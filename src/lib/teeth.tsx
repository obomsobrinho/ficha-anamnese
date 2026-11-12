// Tooth helpers and drawings ported 1:1 from the prototype (buildChart, sideView).
import type { ReactElement } from 'react'

type ToothType = 'inc' | 'can' | 'pm' | 'mol'

export function toothName(n: number) {
  const pos = n % 10
  const q = Math.floor(n / 10)
  const dec = q >= 5
  const perm = ['', 'Incisivo central', 'Incisivo lateral', 'Canino', '1º pré-molar', '2º pré-molar', '1º molar', '2º molar', '3º molar']
  const decN = ['', 'Incisivo central decíduo', 'Incisivo lateral decíduo', 'Canino decíduo', '1º molar decíduo', '2º molar decíduo']
  const side = ({ 1: 'superior direito', 2: 'superior esquerdo', 3: 'inferior esquerdo', 4: 'inferior direito' } as Record<number, string>)[dec ? q - 4 : q]
  return (dec ? decN : perm)[pos] + ' ' + side
}
export function toothType(n: number): ToothType {
  const pos = n % 10
  if (pos <= 2) return 'inc'
  if (pos === 3) return 'can'
  if (n >= 50) return 'mol'
  return pos <= 5 ? 'pm' : 'mol'
}
export function isUpper(n: number) {
  const q = Math.floor(n / 10)
  return q === 1 || q === 2 || q === 5 || q === 6
}
export function rootCount(n: number) {
  const pos = n % 10
  const up = isUpper(n)
  const ty = toothType(n)
  if (ty === 'mol') return up ? 3 : 2
  if (ty === 'pm' && pos === 4 && up) return 2
  return 1
}
export function rootLabel(n: number) {
  const c = rootCount(n)
  return c === 1 ? '1 raiz' : c + ' raízes'
}

export type Dentition = 'perm' | 'dec'
export type Mark = 'trat' | 'done'

export function ToothChart({
  dent,
  sel,
  onPick,
  compact = false,
  marks = {},
}: {
  dent: Dentition
  sel: number[] | number | null
  onPick: (n: number) => void
  compact?: boolean
  marks?: Record<number, Mark>
}) {
  const cmp = compact
  const cx = 175, a = 130, b = cmp ? 118 : 172, cyU = cmp ? 150 : 228, cyL = cmp ? 190 : 272, H = cmp ? 340 : 500
  const mid = (cyU + cyL) / 2
  const W =
    dent === 'perm'
      ? { U: { 1: 8.5, 2: 6.5, 3: 7.5, 4: 7, 5: 6.5, 6: 10, 7: 9, 8: 8.5 }, L: { 1: 5.5, 2: 6, 3: 7, 4: 7, 5: 7, 6: 11, 7: 10.5, 8: 10 } }
      : { U: { 1: 6.5, 2: 5.2, 3: 7, 4: 7.3, 5: 8.2 }, L: { 1: 4.2, 2: 4.5, 3: 5.5, 4: 7.8, 5: 9.8 } }
  const r = (x: number, y: number) => {
    const out: number[] = []
    const st = x < y ? 1 : -1
    for (let i = x; i !== y + st; i += st) out.push(i)
    return out
  }
  const arches: [boolean, number[]][] =
    dent === 'perm'
      ? [[true, [...r(18, 11), ...r(21, 28)]], [false, [...r(48, 41), ...r(31, 38)]]]
      : [[true, [...r(55, 51), ...r(61, 65)]], [false, [...r(85, 81), ...r(71, 75)]]]
  const f = (v: number) => v.toFixed(1)
  const kids: ReactElement[] = []

  arches.forEach(([up, seq]) => {
    const cy = up ? cyU : cyL, N = 400
    const pts: [number, number][] = []
    const cum = [0]
    for (let j = 0; j <= N; j++) {
      const t = Math.PI - (Math.PI * j) / N
      pts.push([cx + a * Math.cos(t), up ? cy - b * Math.sin(t) : cy + b * Math.sin(t)])
      if (j) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]))
    }
    const T = cum[N]
    const at = (s: number) => {
      s = Math.max(0, Math.min(T, s))
      let j = 1
      while (j < N && cum[j] < s) j++
      const u = (s - cum[j - 1]) / (cum[j] - cum[j - 1] || 1), p0 = pts[j - 1], p1 = pts[j]
      const p: [number, number] = [p0[0] + (p1[0] - p0[0]) * u, p0[1] + (p1[1] - p0[1]) * u]
      const L = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) || 1
      const tg: [number, number] = [(p1[0] - p0[0]) / L, (p1[1] - p0[1]) / L]
      let nrm: [number, number] = [-tg[1], tg[0]]
      if (nrm[0] * (p[0] - cx) + nrm[1] * (p[1] - cy) < 0) nrm = [tg[1], -tg[0]]
      return { p, tg, n: nrm }
    }
    const tab = (W as Record<'U' | 'L', Record<number, number>>)[up ? 'U' : 'L']
    const wt = seq.map((n) => Math.pow(tab[n % 10], 0.7))
    const m = 6, g = 3
    const k = (T - 2 * m - g * (seq.length - 1)) / wt.reduce((x, y) => x + y, 0)
    let cur = m
    seq.forEach((n, i) => {
      const wpx = wt[i] * k, s0 = cur, s1 = cur + wpx
      cur = s1 + g
      const { p, tg, n: nr } = at((s0 + s1) / 2)
      const ty = toothType(n)
      const on = Array.isArray(sel) ? sel.includes(n) : n === sel
      const mk = marks[n]
      const d = Math.min(40, wpx * { inc: 0.62, can: 0.9, pm: 1.15, mol: 0.95 }[ty]), w = wpx
      const deg = (Math.atan2(tg[1], tg[0]) * 180) / Math.PI, filled = on || mk
      const fill = on ? '#A3604B' : mk === 'trat' ? (cmp ? '#A3604B' : '#E9CFC3') : mk === 'done' ? (cmp ? '#BDB0A8' : '#E2DAD4') : '#FFFCF6'
      const stroke = on || mk === 'trat' ? '#A3604B' : mk === 'done' ? '#A89A92' : cmp ? '#D7BFB3' : '#B5715C'
      const st = { fill, stroke, strokeWidth: 1.2 }
      const gr = { stroke: on || (cmp && mk) ? '#FFFCF6' : stroke, strokeWidth: 0.9, strokeLinecap: 'round' as const, opacity: filled ? 0.9 : 0.7 }
      const rx = { inc: d * 0.45, can: Math.min(w, d) / 2, pm: w * 0.42, mol: w * 0.3 }[ty]
      const shape = [<rect key="b" x={f(-w / 2)} y={f(-d / 2)} width={f(w)} height={f(d)} rx={f(rx)} style={st} />]
      if (ty === 'mol')
        shape.push(<path key="g" d={`M${f(-w * 0.28)} 0H${f(w * 0.28)}M0 ${f(-d * 0.26)}V${f(d * 0.26)}`} style={gr} fill="none" />)
      else {
        const gw = ty === 'can' ? 0.12 : 0.26
        shape.push(<path key="g" d={`M${f(-w * gw)} 0H${f(w * gw)}`} style={gr} fill="none" />)
      }
      const off = d / 2 + (cmp ? 15 : 10), lp = [p[0] + nr[0] * off, p[1] + nr[1] * off]
      const g2 = [
        <g key="s" transform={`translate(${f(p[0])} ${f(p[1])}) rotate(${f(deg)})`}>
          {shape}
        </g>,
      ]
      if (!cmp || mk)
        g2.push(
          <text
            key="t"
            x={f(lp[0])}
            y={f(lp[1])}
            textAnchor="middle"
            dominantBaseline="central"
            style={{
              fontSize: cmp ? 17 : on ? 12 : 10,
              fontWeight: on || mk ? 600 : 400,
              fill: mk === 'done' ? '#6E625C' : on || mk ? '#7A4433' : '#8B7F79',
              fontFamily: 'Jost, sans-serif',
            }}
          >
            {String(n)}
          </text>,
        )
      if (!cmp || mk) {
        const hit: [number, number][] = []
        const hs0 = i === 0 ? 0 : s0 - g / 2, hs1 = i === seq.length - 1 ? T : s1 + g / 2
        const out = cmp ? 34 : 30, inn = cmp ? 20 : 44
        for (let q = 0; q <= 5; q++) {
          const e = at(hs0 + ((hs1 - hs0) * q) / 5)
          hit.push([e.p[0] + e.n[0] * out, e.p[1] + e.n[1] * out])
        }
        for (let q = 5; q >= 0; q--) {
          const e = at(hs0 + ((hs1 - hs0) * q) / 5)
          hit.push([e.p[0] - e.n[0] * inn, e.p[1] - e.n[1] * inn])
        }
        g2.push(
          <polygon
            key="h"
            points={hit.map((q) => f(q[0]) + ',' + f(q[1])).join(' ')}
            onClick={() => onPick(n)}
            style={{ fill: '#000', fillOpacity: 0, cursor: 'pointer', pointerEvents: 'all' }}
          />,
        )
      }
      kids.push(<g key={n}>{g2}</g>)
    })
  })
  const lab = { fontSize: cmp ? 13 : 10, letterSpacing: 1.6, fill: '#8B7F79', fontFamily: 'Jost, sans-serif' }
  return (
    <svg viewBox={`0 0 350 ${H}`} style={{ width: '100%', height: 'auto', display: 'block', touchAction: 'manipulation', overflow: 'visible' }}>
      {kids}
      <text x={cx} y={cmp ? 16 : 12} textAnchor="middle" style={lab}>SUP.</text>
      <text x={cx} y={H - 4} textAnchor="middle" style={lab}>INF.</text>
      <text x={2} y={mid + 4} style={lab}>DIR.</text>
      <text x={348} y={mid + 4} textAnchor="end" style={lab}>ESQ.</text>
      <line x1={60} x2={290} y1={mid} y2={mid} stroke="#E3D6CE" strokeDasharray="3 4" />
    </svg>
  )
}

export function ToothSide({ n, height = 150 }: { n: number; height?: number }) {
  const ty = toothType(n), up = isUpper(n), dec = n >= 50, nr = rootCount(n), sc = dec ? 0.82 : 1
  const Wc = { inc: 30, can: 34, pm: 38, mol: up ? 58 : 62 }[ty] * sc
  const CH = { inc: 44, can: 46, pm: 38, mol: 36 }[ty] * sc
  const RL = { inc: 62, can: 78, pm: 64, mol: 56 }[ty] * (dec ? 0.62 : 1)
  const cw = Wc * (ty === 'mol' ? 0.84 : 0.72)
  const k = ty === 'mol' ? (up ? 2 : 3) : 1
  const f = (v: number) => v.toFixed(1)
  let top = `M${f(-cw / 2)} ${f(CH)} Q${f((-Wc / 2) * 1.04)} ${f(CH * 0.7)} ${f(-Wc / 2)} ${f(CH * 0.3)}`
  if (ty === 'can') top += ` L0 0 L${f(Wc / 2)} ${f(CH * 0.3)}`
  else
    for (let i = 0; i < k; i++) {
      const xa = -Wc / 2 + (Wc * i) / k, xb = -Wc / 2 + (Wc * (i + 1)) / k
      top += ` Q${f((xa + xb) / 2)} ${f(ty === 'inc' ? CH * 0.18 : -CH * 0.16)} ${f(xb)} ${f(CH * (i === k - 1 ? 0.3 : 0.2))}`
    }
  top += ` Q${f((Wc / 2) * 1.04)} ${f(CH * 0.7)} ${f(cw / 2)} ${f(CH)} Z`
  const bases = nr === 1 ? [0] : nr === 2 ? [-cw * 0.25, cw * 0.25] : [-cw * 0.3, 0, cw * 0.3]
  const rw = nr === 1 ? cw * 0.8 : nr === 2 ? cw * 0.44 : cw * 0.34, spl = dec ? 2.2 : 1.5
  const st = { fill: '#FFFCF6', stroke: '#A3604B', strokeWidth: 1.4, strokeLinejoin: 'round' as const }
  const tot = CH + RL + 16
  const tf = up ? `translate(60 ${f(tot - 8)}) scale(1 -1)` : 'translate(60 8)'
  return (
    <svg viewBox={`0 0 120 ${f(tot)}`} style={{ height, width: 'auto', display: 'block' }}>
      <g transform={tf}>
        {bases.map((bx, i) => {
          const ax = bx * spl, y1 = CH - 2, y2 = CH + RL
          return (
            <g key={'r' + i}>
              <path
                d={`M${f(bx - rw / 2)} ${f(y1)} C${f(bx - rw / 2)} ${f(CH + RL * 0.55)} ${f(ax - rw * 0.14)} ${f(CH + RL * 0.92)} ${f(ax)} ${f(y2)} C${f(ax + rw * 0.14)} ${f(CH + RL * 0.92)} ${f(bx + rw / 2)} ${f(CH + RL * 0.55)} ${f(bx + rw / 2)} ${f(y1)} Z`}
                style={st}
              />
              <path d={`M${f(bx * 0.7)} ${f(CH * 0.85)} Q${f(bx)} ${f(CH + RL * 0.5)} ${f(ax)} ${f(y2 - 5)}`} fill="none" stroke="#B5715C" strokeWidth={1} strokeDasharray="2 2.5" />
            </g>
          )
        })}
        <path d={top} style={{ ...st, fill: '#A3604B' }} />
        <rect x={f(-cw * 0.26)} y={f(CH * 0.45)} width={f(cw * 0.52)} height={f(CH * 0.42)} rx={f(cw * 0.14)} fill="none" stroke="#FFFCF6" strokeWidth={1} opacity={0.8} />
      </g>
    </svg>
  )
}
