import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Frog } from './Motifs'
import { WaterCanvas } from './WaterCanvas'

function useReducedMotion() {
  const [reduce, setReduce] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReduce(mq.matches)
    const on = () => setReduce(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return reduce
}

/** Writes how far a band has travelled through the viewport (0 → 1) into --p. */
function useBandProgress<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const el = ref.current
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const p = 1 - (r.top + r.height) / (window.innerHeight + r.height)
      el.style.setProperty('--p', Math.max(0, Math.min(1, p)).toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return ref
}

function wavePath(width: number, y: number, amp: number, period: number) {
  let d = `M0 ${y}`
  for (let x = 0; x < width; x += period) {
    d += ` q${period / 4} ${-amp} ${period / 2} 0 t${period / 2} 0`
  }
  return d
}

/* ================================================================ pond with a frog */

const PADS = [
  { x: 150, y: 132, r: 74, flower: false },
  { x: 380, y: 158, r: 92, flower: true },
  { x: 640, y: 128, r: 70, flower: false },
  { x: 880, y: 160, r: 88, flower: false },
  { x: 1080, y: 130, r: 66, flower: true },
]

function LilyPad({ x, y, r, flower, i }: { x: number; y: number; r: number; flower: boolean; i: number }) {
  const ry = r * 0.26
  // a disc with a wedge cut out, squashed into perspective
  const a0 = -0.35 + i * 0.7
  const a1 = a0 + 0.42
  const p0 = [x + Math.cos(a0) * r, y + Math.sin(a0) * ry]
  const p1 = [x + Math.cos(a1) * r, y + Math.sin(a1) * ry]
  return (
    <g className="pad" style={{ animationDelay: `${-i * 1.3}s` } as CSSProperties}>
      <ellipse className="pad__shadow" cx={x + 4} cy={y + 5} rx={r} ry={ry} />
      <path
        className="pad__leaf"
        d={`M${x} ${y} L${p0[0]} ${p0[1]} A${r} ${ry} 0 1 0 ${p1[0]} ${p1[1]} Z`}
      />
      <path className="pad__vein" d={`M${x} ${y} l${-r * 0.6} ${-ry * 0.4} M${x} ${y} l${-r * 0.2} ${ry * 0.8} M${x} ${y} l${r * 0.5} ${ry * 0.6}`} />
      {flower && (
        <g className="lotus" transform={`translate(${x - r * 0.45} ${y - ry * 0.4})`}>
          {[-50, -25, 0, 25, 50].map((deg) => (
            <ellipse key={deg} cx="0" cy="-9" rx="5" ry="11" transform={`rotate(${deg})`} />
          ))}
          <circle cx="0" cy="-3" r="3.5" className="lotus__heart" />
        </g>
      )}
    </g>
  )
}

export function Pond() {
  const reduce = useReducedMotion()
  const [pad, setPad] = useState(1)
  const [ripple, setRipple] = useState<{ x: number; y: number; k: number } | null>(null)
  const [facing, setFacing] = useState(1)
  const frogRef = useRef<SVGGElement>(null)
  const visible = useRef(false)
  const hostRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = hostRef.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => (visible.current = e.isIntersecting))
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => {
      if (!visible.current || document.hidden) return
      setPad((cur) => {
        // on narrow screens the outer pads are cropped away, so stay on the middle three
        const lo = window.innerWidth < 700 ? 1 : 0
        const hi = window.innerWidth < 700 ? 3 : PADS.length - 1
        const step = cur <= lo ? 1 : cur >= hi ? -1 : Math.random() < 0.5 ? -1 : 1
        const next = Math.max(lo, Math.min(hi, cur + step))
        const from = PADS[cur]
        const to = PADS[next]
        setFacing(step)
        const g = frogRef.current
        if (g) {
          const fy = (p: (typeof PADS)[number]) => p.y - p.r * 0.14
          g.animate(
            [
              { transform: `translate(${from.x}px, ${fy(from)}px)` },
              { transform: `translate(${(from.x + to.x) / 2}px, ${Math.min(fy(from), fy(to)) - 70}px)`, offset: 0.5 },
              { transform: `translate(${to.x}px, ${fy(to)}px)` },
            ],
            { duration: 760, easing: 'cubic-bezier(.3,.1,.3,1)' },
          )
          window.setTimeout(() => setRipple({ x: to.x, y: to.y, k: Date.now() }), 700)
        }
        return next
      })
    }, 4200)
    return () => window.clearInterval(id)
  }, [reduce])

  const p = PADS[pad]
  return (
    <div ref={hostRef} className="pond" aria-hidden="true">
      <svg viewBox="0 0 1200 220" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="pond-water" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#cfe2dc" stopOpacity="0" />
            <stop offset="0.28" stopColor="#a7c9c0" stopOpacity="0.7" />
            <stop offset="1" stopColor="#3d7f86" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <rect x="0" y="40" width="1200" height="180" fill="url(#pond-water)" />
        <g className="pond__ripples">
          {[70, 96, 124, 152, 182, 206].map((y, i) => (
            <path
              key={y}
              d={wavePath(2400, y, 2 + i * 0.8, [100, 120, 150, 200, 240, 300][i])}
              style={{ animationDuration: `${26 + i * 7}s`, opacity: 0.25 + i * 0.08 } as CSSProperties}
            />
          ))}
        </g>
        <g className="reeds reeds--left">
          {[20, 34, 48, 62].map((x, i) => (
            <g key={x} className="reed" style={{ animationDelay: `${-i * 0.9}s` } as CSSProperties}>
              <path d={`M${x} 220 Q${x + 4} ${150 - i * 8} ${x - 6 + i * 3} ${70 - i * 10}`} />
              {i % 2 === 0 && <rect x={x - 9 + i * 3} y={86 - i * 10} width="7" height="30" rx="3.5" />}
            </g>
          ))}
        </g>
        <g className="reeds reeds--right">
          {[1132, 1148, 1164, 1182].map((x, i) => (
            <g key={x} className="reed" style={{ animationDelay: `${-i * 1.1}s` } as CSSProperties}>
              <path d={`M${x} 220 Q${x - 4} ${150 - i * 6} ${x + 5 - i * 2} ${80 - i * 8}`} />
              {i % 2 === 1 && <rect x={x + 1 - i * 2} y={96 - i * 8} width="7" height="30" rx="3.5" />}
            </g>
          ))}
        </g>
        {ripple && (
          <g key={ripple.k} className="pond__splash">
            {[0, 1, 2].map((i) => (
              <ellipse key={i} cx={ripple.x} cy={ripple.y + 4} rx="40" ry="9" style={{ animationDelay: `${i * 0.22}s` } as CSSProperties} />
            ))}
          </g>
        )}
        {PADS.map((pd, i) => (
          <LilyPad key={i} i={i} {...pd} />
        ))}
        <g ref={frogRef} className="pond__frog" style={{ transform: `translate(${p.x}px, ${p.y - p.r * 0.14}px)` }}>
          <g transform={`scale(${facing < 0 ? -1 : 1} 1) translate(-30 -46)`}>
            <Frog width={60} height={50} />
          </g>
        </g>
        <g className="dragonfly">
          <path d="M0 0h26" />
          <ellipse cx="9" cy="-5" rx="9" ry="3" transform="rotate(-20 9 -5)" />
          <ellipse cx="9" cy="5" rx="9" ry="3" transform="rotate(20 9 5)" />
          <ellipse cx="16" cy="-4" rx="7" ry="2.5" transform="rotate(-30 16 -4)" />
          <ellipse cx="16" cy="4" rx="7" ry="2.5" transform="rotate(30 16 4)" />
        </g>
      </svg>
    </div>
  )
}

/* ================================================================ misty forest */

function pine(x: number, base: number, h: number, w: number, tiers = 5) {
  let d = `M${x} ${base - h}`
  for (let i = 1; i <= tiers; i++) {
    const y = base - h + (h * i) / tiers
    const half = (w / 2) * (i / tiers)
    d += ` L${x + half} ${y} L${x + half * 0.45} ${y - (h / tiers) * 0.15}`
  }
  for (let i = tiers; i >= 1; i--) {
    const y = base - h + (h * i) / tiers
    const half = (w / 2) * (i / tiers)
    d += ` L${x - half * 0.45} ${y - (h / tiers) * 0.15} L${x - half} ${y}`
  }
  return d + ` L${x - 3} ${base} L${x + 3} ${base} Z`
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

function treeLayer(seed: number, count: number, base: number, hMin: number, hMax: number) {
  return Array.from({ length: count }, (_, i) => {
    const x = (i + hash(seed + i) * 0.8) * (1400 / count) - 60
    const h = hMin + hash(seed * 3 + i) * (hMax - hMin)
    return pine(x, base + hash(seed + i * 7) * 14, h, h * (0.42 + hash(i + seed) * 0.12), 4 + Math.round(hash(i * seed) * 3))
  }).join(' ')
}

const FAR = treeLayer(11, 34, 206, 60, 110)
const MID = treeLayer(23, 22, 236, 90, 160)
const NEAR = treeLayer(37, 12, 270, 150, 230)

export function ForestBand() {
  const ref = useBandProgress<HTMLDivElement>()
  return (
    <div ref={ref} className="forest-band" aria-hidden="true">
      <svg viewBox="0 0 1200 270" preserveAspectRatio="xMidYMax slice">
        <defs>
          <linearGradient id="forest-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8f5ec" stopOpacity="0" />
            <stop offset="0.5" stopColor="#dfe9e2" />
            <stop offset="1" stopColor="#cfe2dc" />
          </linearGradient>
          <linearGradient id="forest-mist" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f8f5ec" stopOpacity="0" />
            <stop offset="0.5" stopColor="#f8f5ec" stopOpacity="0.85" />
            <stop offset="1" stopColor="#f8f5ec" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="forest-ray" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff8e6" stopOpacity="0.85" />
            <stop offset="1" stopColor="#fff8e6" stopOpacity="0" />
          </linearGradient>
        </defs>
        <rect width="1200" height="270" fill="url(#forest-sky)" />
        <g className="rays">
          <path d="M760 0 L840 0 L560 270 L420 270 Z" fill="url(#forest-ray)" />
          <path d="M880 0 L920 0 L720 270 L650 270 Z" fill="url(#forest-ray)" />
          <path d="M600 0 L630 0 L330 270 L270 270 Z" fill="url(#forest-ray)" />
        </g>
        <path className="trees trees--far" d={FAR} />
        <rect className="mist mist--a" x="-200" y="140" width="1600" height="80" fill="url(#forest-mist)" />
        <path className="trees trees--mid" d={MID} />
        <rect className="mist mist--b" x="-200" y="186" width="1600" height="74" fill="url(#forest-mist)" />
        <path className="trees trees--near" d={NEAR} />
      </svg>
      <div className="leaves">
        {Array.from({ length: 9 }, (_, i) => (
          <svg
            key={i}
            viewBox="0 0 20 12"
            style={
              {
                left: `${6 + hash(i + 3) * 88}%`,
                animationDuration: `${11 + hash(i + 8) * 9}s, ${2.8 + hash(i) * 2}s`,
                animationDelay: `${-hash(i + 2) * 18}s, ${-hash(i + 4) * 3}s`,
                '--drift': `${(hash(i + 6) - 0.5) * 160}px`,
              } as CSSProperties
            }
          >
            <path d="M1 6C5 0 14 0 19 6C14 12 5 12 1 6Z" />
            <path d="M1 6H17" />
          </svg>
        ))}
      </div>
    </div>
  )
}

/* ================================================================ moonlit night shore */

export function NightShore() {
  return (
    <div className="night-shore" aria-hidden="true">
      <WaterCanvas className="night-shore__water" />
      <svg className="night-shore__rock" viewBox="0 0 260 150" preserveAspectRatio="xMaxYMax meet">
        <path className="rock" d="M30 150 C40 112 70 92 112 86 C150 80 190 88 214 104 C236 118 252 136 258 150 Z" />
        <g className="sitting-cat" transform="translate(126 18)">
          <path
            className="cat-body"
            d="M24 30 L19 6 L33 18 C39 16 45 16 51 18 L65 6 L60 30 C64 38 62 46 55 50 C66 58 70 68 68 76 L16 76 C14 68 18 58 29 50 C22 46 20 38 24 30 Z"
          />
          <path className="cat-tail" d="M64 72 C84 74 98 66 96 52 C95 44 90 40 86 42" />
          <g className="blink">
            <ellipse className="cat-eye" cx="35" cy="34" rx="3.6" ry="2.4" />
            <ellipse className="cat-eye" cx="50" cy="34" rx="3.6" ry="2.4" />
          </g>
        </g>
      </svg>
    </div>
  )
}

/** A strip of animated waves for the top or bottom edge of a dark band. */
export function WaveEdge({ position }: { position: 'top' | 'bottom' }) {
  const d = (y: number, amp: number) => `${wavePath(2880, y, amp, 240)} V60 H0 Z`
  return (
    <svg className={`wave-edge wave-edge--${position}`} viewBox="0 0 2880 60" preserveAspectRatio="none" aria-hidden="true">
      <path className="wave-edge__foam" d={d(26, 9)} />
      <path className="wave-edge__fill" d={d(34, 7)} />
    </svg>
  )
}

/* ================================================================ noise flowing into digits */

function gauss() {
  const u = Math.max(1e-7, Math.random())
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * Math.random())
}

const PER_DIGIT = 120

/**
 * Particles start as Gaussian noise and travel along straight lines to points sampled from
 * handwritten digits, x_t = (1 − t) x₀ + t x₁, then dissolve and start again.
 */
export function FlowDigits() {
  const ref = useRef<HTMLCanvasElement>(null)
  const labelRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let slots = 0
    let x0 = new Float32Array(0)
    let y0 = new Float32Array(0)
    let x1 = new Float32Array(0)
    let y1 = new Float32Array(0)
    let cycleStart = performance.now()
    let raf = 0
    let last = 0
    let onScreen = false
    const glyphs: Array<Array<[number, number]>> = []

    const buildGlyphs = () => {
      const S = 96
      const off = document.createElement('canvas')
      off.width = off.height = S
      const g = off.getContext('2d')
      if (!g) return
      for (let d = 0; d < 10; d++) {
        g.clearRect(0, 0, S, S)
        g.fillStyle = '#fff'
        g.font = `500 ${S * 1.02}px Caveat, 'Bradley Hand', cursive`
        g.textAlign = 'center'
        g.textBaseline = 'middle'
        g.fillText(String(d), S / 2, S * 0.56)
        const data = g.getImageData(0, 0, S, S).data
        const pts: Array<[number, number]> = []
        for (let y = 0; y < S; y += 2)
          for (let x = 0; x < S; x += 2) if (data[(y * S + x) * 4 + 3] > 120) pts.push([x / S - 0.5, y / S - 0.5])
        glyphs.push(pts)
      }
    }

    const newCycle = () => {
      slots = Math.max(4, Math.min(12, Math.floor(w / 92)))
      const n = slots * PER_DIGIT
      x0 = new Float32Array(n)
      y0 = new Float32Array(n)
      x1 = new Float32Array(n)
      y1 = new Float32Array(n)
      const cell = Math.min(h * 0.86, w / slots)
      for (let s = 0; s < slots; s++) {
        const pts = glyphs[Math.floor(Math.random() * 10)]
        const cx = (s + 0.5) * (w / slots)
        const cy = h * 0.5
        for (let k = 0; k < PER_DIGIT; k++) {
          const i = s * PER_DIGIT + k
          const p = pts[Math.floor(Math.random() * pts.length)] ?? [0, 0]
          x1[i] = cx + p[0] * cell
          y1[i] = cy + p[1] * cell
          x0[i] = cx + gauss() * cell * 0.3
          y0[i] = cy + gauss() * cell * 0.3
        }
      }
      cycleStart = performance.now()
    }

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      const r = canvas.getBoundingClientRect()
      w = r.width
      h = r.height
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      if (glyphs.length) newCycle()
    }

    const ease = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t))

    const draw = (now: number) => {
      const el = (now - cycleStart) / 1000
      // noise 0.8s · flow 3.2s (swept left to right) · hold 1.8s · dissolve 0.7s
      if (el > 6.5) newCycle()
      ctx.clearRect(0, 0, w, h)
      let shown = 0
      const fade = el > 5.8 ? Math.max(0, 1 - (el - 5.8) / 0.7) : Math.min(1, el / 0.3)
      for (let s = 0; s < slots; s++) {
        const t = ease((el - 0.8 - s * 0.12) / 2.2)
        if (s === 0) shown = t
        ctx.fillStyle = `rgba(237, 244, 239, ${(0.35 + 0.55 * t) * fade})`
        for (let k = 0; k < PER_DIGIT; k++) {
          const i = s * PER_DIGIT + k
          const x = (1 - t) * x0[i] + t * x1[i]
          const y = (1 - t) * y0[i] + t * y1[i]
          const size = 1.6 + t * 0.9
          ctx.fillRect(x, y, size, size)
        }
      }
      if (labelRef.current) labelRef.current.textContent = `t = ${shown.toFixed(2)}`
    }

    const tick = (now: number) => {
      raf = 0
      if (now - last > 32) {
        last = now
        draw(now)
      }
      if (onScreen && !document.hidden) raf = requestAnimationFrame(tick)
    }

    let cancelled = false
    document.fonts.ready.then(() => {
      if (cancelled) return
      buildGlyphs()
      resize()
      if (reduce) {
        cycleStart = performance.now() - 4500
        draw(performance.now())
        return
      }
      const io = new IntersectionObserver(([e]) => {
        const was = onScreen
        onScreen = e.isIntersecting
        // start each visit from pure noise
        if (onScreen && !was) newCycle()
        if (onScreen && !raf) raf = requestAnimationFrame(tick)
      })
      io.observe(canvas)
      cleanupIo = () => io.disconnect()
    })
    let cleanupIo = () => {}
    const ro = new ResizeObserver(() => glyphs.length && resize())
    ro.observe(canvas)
    return () => {
      cancelled = true
      cancelAnimationFrame(raf)
      ro.disconnect()
      cleanupIo()
    }
  }, [])

  return (
    <figure className="flow-digits" aria-hidden="true">
      <canvas ref={ref} />
      <figcaption>
        <span className="flow-digits__eq">x_t = (1 − t) x₀ + t x₁</span>
        <span className="flow-digits__t" ref={labelRef}>t = 0.00</span>
        <span className="flow-digits__note">noise → digits, illustrated</span>
      </figcaption>
    </figure>
  )
}
