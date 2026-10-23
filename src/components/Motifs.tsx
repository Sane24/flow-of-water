/* Original line drawings used as small editorial details. Nothing here is a model output. */

interface MotifProps {
  className?: string
  title?: string
}

function a11y(title?: string) {
  return title ? { role: 'img' as const, 'aria-label': title } : { 'aria-hidden': true as const }
}

export function Frog({ className = '', title }: MotifProps) {
  return (
    <svg className={`motif motif--frog ${className}`} viewBox="0 0 72 60" {...a11y(title)}>
      <path
        className="fill-soft"
        d="M9 33c0-10 10-15 27-15s27 5 27 15c0 13-11 20-27 20S9 46 9 33z"
      />
      <circle className="fill-paper" cx="22" cy="16" r="10.5" />
      <circle className="fill-paper" cx="50" cy="16" r="10.5" />
      <circle className="fill-ink" cx="23.5" cy="17" r="3.2" />
      <circle className="fill-ink" cx="48.5" cy="17" r="3.2" />
      <circle className="fill-paper-solid" cx="24.6" cy="15.8" r="1" />
      <circle className="fill-paper-solid" cx="49.6" cy="15.8" r="1" />
      <path className="line" d="M26 33.5c3.5 5 16.5 5 20 0" />
      <path className="line" d="M27 37.5l9-4 9 4" />
      <ellipse className="fill-blush" cx="16.5" cy="34.5" rx="3.6" ry="2.1" />
      <ellipse className="fill-blush" cx="55.5" cy="34.5" rx="3.6" ry="2.1" />
      <path className="line" d="M20 51.5c-3 2.5-7 3-9 2M52 51.5c3 2.5 7 3 9 2" />
    </svg>
  )
}

export function Butterfly({ className = '', title }: MotifProps) {
  const wing = (
    <g>
      <path
        className="fill-wing"
        d="M60 41C51 23 30 6 13 10 3 13 5 31 19 40c11 7 30 6 41 3z"
      />
      <path
        className="fill-wing fill-wing--low"
        d="M60 47c-12 3-29 11-33 22-3 9 7 15 16 9 9-6 15-18 17-27z"
      />
      <path className="vein" d="M60 42C47 33 32 21 15 13M60 43C46 39 30 37 14 33M59 44C45 45 32 43 22 40" />
      <path className="vein" d="M60 48C51 57 43 66 37 75M60 49c-8 4-17 9-26 16" />
      <circle className="fill-ink" cx="17" cy="17" r="1.6" />
      <circle className="fill-ink" cx="11.5" cy="24" r="1.2" />
      <circle className="fill-coral" cx="33" cy="72" r="1.8" />
    </g>
  )
  return (
    <svg className={`motif motif--butterfly ${className}`} viewBox="0 0 120 90" {...a11y(title)}>
      {wing}
      <g transform="translate(120 0) scale(-1 1)">{wing}</g>
      <ellipse className="fill-ink" cx="60" cy="47" rx="2.3" ry="13" />
      <path className="line" d="M59 35c-2-9-6-15-11-17M61 35c2-9 6-15 11-17" />
      <circle className="fill-ink" cx="47.6" cy="17.6" r="1.4" />
      <circle className="fill-ink" cx="72.4" cy="17.6" r="1.4" />
    </svg>
  )
}

export function Cat({ className = '', title }: MotifProps) {
  return (
    <svg className={`motif motif--cat ${className}`} viewBox="0 0 90 104" {...a11y(title)}>
      <path
        className="fill-night"
        d="M24 31 19 6l15 13c7-2.6 15-2.6 22 0L71 6l-5 25c4 9 1 16-6 20 9 8 13 18 13 30 0 14-8 21-17 21H34c-9 0-17-7-17-21 0-12 4-22 13-30-7-4-10-11-6-20z"
      />
      <path className="tail" d="M58 99c13 3 25-2 26-14 1-10-6-15-12-13" />
      <ellipse className="fill-eye" cx="35" cy="35" rx="4" ry="2.8" />
      <ellipse className="fill-eye" cx="55" cy="35" rx="4" ry="2.8" />
      <path className="pupil" d="M35 32.6v4.8M55 32.6v4.8" />
    </svg>
  )
}

export function Fern({ className = '', title, leaves = 9 }: MotifProps & { leaves?: number }) {
  // A gently curved stem with alternating leaflets placed along a cubic Bezier.
  const P = [
    [8, 118],
    [30, 82],
    [58, 46],
    [104, 10],
  ]
  const at = (t: number) => {
    const u = 1 - t
    const b = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t]
    const db = [-3 * u * u, 3 * u * u - 6 * u * t, 6 * u * t - 3 * t * t, 3 * t * t]
    const x = b.reduce((s, k, i) => s + k * P[i][0], 0)
    const y = b.reduce((s, k, i) => s + k * P[i][1], 0)
    const dx = db.reduce((s, k, i) => s + k * P[i][0], 0)
    const dy = db.reduce((s, k, i) => s + k * P[i][1], 0)
    return { x, y, a: (Math.atan2(dy, dx) * 180) / Math.PI }
  }
  const items = Array.from({ length: leaves }, (_, i) => {
    const t = 0.12 + (i / leaves) * 0.84
    const p = at(t)
    const side = i % 2 === 0 ? 1 : -1
    const len = 18 * (1 - t * 0.55)
    return { ...p, side, len, key: i }
  })
  return (
    <svg className={`motif motif--fern ${className}`} viewBox="0 0 112 124" {...a11y(title)}>
      <path className="line" d="M8 118C30 82 58 46 104 10" />
      {items.map((l) => (
        <g key={l.key} transform={`translate(${l.x} ${l.y}) rotate(${l.a + l.side * 52})`}>
          <path
            className="fill-leaf"
            d={`M0 0C${l.len * 0.3} ${-l.len * 0.22} ${l.len * 0.75} ${-l.len * 0.2} ${l.len} 0C${l.len * 0.75} ${l.len * 0.2} ${l.len * 0.3} ${l.len * 0.22} 0 0z`}
          />
          <path className="vein" d={`M0 0L${l.len * 0.85} 0`} />
        </g>
      ))}
    </svg>
  )
}

export function WaveRule({ className = '' }: { className?: string }) {
  return (
    <div className={`wave-rule ${className}`} aria-hidden="true">
      <span />
      <svg viewBox="0 0 64 14">
        <path d="M1 8c5-6 10-6 15 0s10 6 15 0 10-6 15 0 10 6 16 0" />
        <path d="M9 12c4-3 8-3 12 0M37 12c4-3 8-3 12 0" opacity=".55" />
      </svg>
      <span />
    </div>
  )
}

export function Lancet({ className = '' }: { className?: string }) {
  return (
    <svg className={`motif motif--lancet ${className}`} viewBox="0 0 60 104" aria-hidden="true">
      <path className="glass glass--a" d="M6 102V44C6 22 18 9 30 3c12 6 24 19 24 41v58z" />
      <path className="glass glass--b" d="M30 3c12 6 24 19 24 41H30z" />
      <path className="glass glass--c" d="M6 70h24v32H6z" />
      <path className="glass glass--d" d="M30 44h24v26H30z" />
      <circle className="glass glass--e" cx="30" cy="34" r="9" />
      <path className="lead" d="M6 102V44C6 22 18 9 30 3c12 6 24 19 24 41v58zM30 3v99M6 44h48M6 70h48M21 34h18" />
      <circle className="lead" cx="30" cy="34" r="9" />
    </svg>
  )
}

/** Topographic or current-like contour lines, generated once. */
export function Contours({ className = '', rings = 9, seed = 1 }: { className?: string; rings?: number; seed?: number }) {
  const paths = Array.from({ length: rings }, (_, r) => {
    const base = 18 + r * 11
    const pts: string[] = []
    for (let i = 0; i <= 96; i++) {
      const a = (i / 96) * Math.PI * 2
      const wob =
        Math.sin(a * 3 + seed + r * 0.35) * (2.4 + r * 0.5) +
        Math.sin(a * 5 - seed * 1.7 + r * 0.2) * (1.2 + r * 0.25) +
        Math.cos(a * 2 + seed * 0.6) * r * 0.9
      const rad = base + wob
      pts.push(`${(100 + Math.cos(a) * rad * 1.35).toFixed(1)},${(100 + Math.sin(a) * rad).toFixed(1)}`)
    }
    return `M${pts.join('L')}Z`
  })
  return (
    <svg className={`contours ${className}`} viewBox="0 0 200 200" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {paths.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  )
}
