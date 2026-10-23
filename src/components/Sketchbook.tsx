import { useEffect, useRef, useState, type ReactNode } from 'react'

/*
 * A separate "sketchbook" spread for my own drawings. As it scrolls into view a fountain pen
 * rises out of an ink pot, writes a flourish under the title, then keeps drawing an ink thread
 * down the margin as the reader moves through the drawings, and finally lies down at the end.
 */

interface Geometry {
  w: number
  h: number
  d: string
  swashEnd: number
  total: number
  samples: Float32Array // x, y, length triples
  splats: Array<[number, number, number]>
  pot: [number, number]
}

function buildPath(container: HTMLElement, pot: HTMLElement, title: HTMLElement): Omit<Geometry, 'swashEnd' | 'total' | 'samples'> & {
  swashMarker: [number, number]
} {
  const c = container.getBoundingClientRect()
  const pr = pot.getBoundingClientRect()
  const tr = title.getBoundingClientRect()
  const w = c.width
  const h = container.scrollHeight
  const px = pr.left - c.left + pr.width * 0.5
  const py = pr.top - c.top + pr.height * 0.22
  const tx0 = tr.left - c.left - 4
  const tx1 = Math.min(w - 40, tr.right - c.left + 26)
  const ty = tr.bottom - c.top + 8
  const mx = Math.max(18, px - 4)

  // 1. out of the pot and over to the start of the title
  let d = `M${px} ${py + 18} C${px - 2} ${py - 40} ${tx0 - 40} ${ty - 34} ${tx0} ${ty}`
  // 2. a wavy swash under the title
  const span = tx1 - tx0
  const waves = Math.max(3, Math.round(span / 90))
  for (let i = 1; i <= waves; i++) {
    const x = tx0 + (span * i) / waves
    const amp = 7 * (i % 2 === 0 ? 1 : -1) * (1 - i / (waves + 3))
    d += ` S${x - span / waves / 2} ${ty + amp + 2} ${x} ${ty + (i === waves ? -2 : 0)}`
  }
  // 3. a small loop at the end, then a long sweep back under the swash to the margin
  d += ` c18 -6 26 -24 12 -30 c-14 -6 -24 14 -10 28`
  const swashMarker: [number, number] = [tx1 + 2, ty - 2]
  d += ` C${tx1 - 10} ${ty + 22} ${tx0 + span * 0.6} ${ty + 15} ${tx0 + span * 0.22} ${ty + 17}`
  d += ` C${tx0 - 6} ${ty + 18} ${mx + 6} ${ty + 16} ${mx} ${ty + 46}`

  // 4. meander down the gutter with a little curl beside each drawing
  const loopsAt = Array.from(container.querySelectorAll<HTMLElement>('.timeline')).map(
    (el) => el.getBoundingClientRect().top - c.top + 34,
  )
  let y = ty + 46
  const end = h - 70
  let flip = 1
  while (y < end) {
    const next = Math.min(end, y + 120)
    const loop = loopsAt.find((ly) => ly > y && ly <= next)
    if (loop !== undefined) {
      d += ` C${mx + 14 * flip} ${loop - 40} ${mx + 16} ${loop - 10} ${mx + 4} ${loop}`
      d += ` c-12 8 -10 26 6 24 c14 -2 12 -22 -4 -22`
      d += ` C${mx - 10} ${loop + 30} ${mx - 8 * flip} ${loop + 50} ${mx} ${loop + 70}`
      y = loop + 70
    } else {
      d += ` C${mx + 12 * flip} ${y + 40} ${mx - 12 * flip} ${next - 40} ${mx} ${next}`
      y = next
    }
    flip *= -1
  }
  // 5. a closing flourish where the pen comes to rest
  d += ` c4 24 24 34 48 30 c16 -3 22 -16 12 -22`

  const splats: Array<[number, number, number]> = [
    [tx1 + 34, ty - 30, 2.6],
    [tx1 + 44, ty - 14, 1.6],
    [tx1 + 26, ty + 16, 1.2],
    [tx1 + 52, ty - 26, 1],
  ]
  return { w, h, d, splats, pot: [px, py], swashMarker }
}

function Pen() {
  // nib tip at the origin, pen body running up and to the right
  return (
    <g className="pen">
      <path className="pen__nib" d="M0 0 L7 -15 L12 -13 L5 0 Z" />
      <path className="pen__slit" d="M2 -3 L8 -13" />
      <circle className="pen__breather" cx="8" cy="-11" r="1.2" />
      <path className="pen__grip" d="M6 -16 L13 -12 L29 -42 L21 -46 Z" />
      <path className="pen__band" d="M21 -46 L29 -42 L31 -46 L23 -50 Z" />
      <path className="pen__body" d="M23 -50 L31 -46 L64 -108 C66 -113 61 -116 57 -112 Z" />
      <path className="pen__clip" d="M48 -86 L56 -82 L68 -104" />
      <path className="pen__shine" d="M27 -50 L56 -106" />
    </g>
  )
}

function InkPot() {
  return (
    <svg className="inkpot__svg" viewBox="0 0 64 60" aria-hidden="true">
      <ellipse className="inkpot__shadow" cx="32" cy="56" rx="26" ry="3.5" />
      <path className="inkpot__glass" d="M10 24 C6 30 6 50 12 54 L52 54 C58 50 58 30 54 24 Z" />
      <path className="inkpot__ink" d="M9 36 C8 44 9 51 13 53 L51 53 C55 51 56 44 55 36 C44 39 20 39 9 36 Z" />
      <rect className="inkpot__neck" x="22" y="14" width="20" height="11" rx="2" />
      <ellipse className="inkpot__mouth" cx="32" cy="14" rx="10" ry="2.6" />
      <path className="inkpot__label" d="M17 40 h30 v8 h-30 z" />
      <path className="inkpot__shine" d="M14 28 C12 36 12 44 15 50" />
    </svg>
  )
}

interface Props {
  title: string
  kicker?: string
  intro?: ReactNode
  children: ReactNode
}

export function Sketchbook({ title, kicker, intro, children }: Props) {
  const box = useRef<HTMLDivElement>(null)
  const potRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const pathA = useRef<SVGPathElement>(null)
  const pathB = useRef<SVGPathElement>(null)
  const pen = useRef<SVGGElement>(null)
  const [geo, setGeo] = useState<Geometry | null>(null)
  const [done, setDone] = useState(false)
  const [swashDone, setSwashDone] = useState(false)

  // measure and lay out the ink path
  useEffect(() => {
    const el = box.current
    if (!el || !potRef.current || !titleRef.current) return
    let raf = 0
    const measure = () => {
      raf = 0
      if (!potRef.current || !titleRef.current) return
      const base = buildPath(el, potRef.current, titleRef.current)
      const probe = document.createElementNS('http://www.w3.org/2000/svg', 'path')
      probe.setAttribute('d', base.d)
      const total = probe.getTotalLength()
      const n = Math.ceil(total / 4)
      const samples = new Float32Array((n + 1) * 3)
      let swashEnd = 0
      let best = Infinity
      for (let i = 0; i <= n; i++) {
        const len = (total * i) / n
        const p = probe.getPointAtLength(len)
        samples[i * 3] = p.x
        samples[i * 3 + 1] = p.y
        samples[i * 3 + 2] = len
        const dist = Math.hypot(p.x - base.swashMarker[0], p.y - base.swashMarker[1])
        if (dist < best && len < total * 0.5) {
          best = dist
          swashEnd = len
        }
      }
      // the swash phase ends where the sweep reaches the gutter
      const gutterStart = samples.findIndex((_, i) => i % 3 === 2 && samples[i] > swashEnd && samples[i - 2] < base.pot[0] + 50)
      const sweepEnd = gutterStart > 0 ? samples[gutterStart] : swashEnd
      setGeo({ ...base, swashEnd: sweepEnd, total, samples })
    }
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure)
    }
    const ro = new ResizeObserver(schedule)
    ro.observe(el)
    document.fonts.ready.then(schedule)
    schedule()
    return () => {
      ro.disconnect()
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  // scroll drives the pen
  useEffect(() => {
    const el = box.current
    if (!el || !geo) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const n = geo.samples.length / 3

    const at = (len: number) => {
      const i = Math.max(0, Math.min(n - 1, Math.round((len / geo.total) * (n - 1))))
      return [geo.samples[i * 3], geo.samples[i * 3 + 1]] as const
    }

    const apply = (len: number) => {
      const off = String(Math.max(0, geo.total - len))
      pathA.current?.style.setProperty('stroke-dashoffset', off)
      pathB.current?.style.setProperty('stroke-dashoffset', off)
      const finished = len >= geo.total - 2
      setDone(finished)
      setSwashDone(len >= geo.swashEnd - 2)
      const [x, y] = at(Math.max(0.5, len))
      const wobble = Math.sin(len * 0.05) * 4
      if (pen.current) {
        pen.current.style.transform = finished
          ? `translate(${x + 6}px, ${y + 6}px) rotate(58deg)`
          : `translate(${x}px, ${y}px) rotate(${wobble}deg)`
      }
    }

    if (reduce) {
      apply(geo.total)
      return
    }

    let raf = 0
    let shown = 0
    const update = () => {
      raf = 0
      const r = el.getBoundingClientRect()
      const vh = window.innerHeight
      const titleTop = (titleRef.current?.getBoundingClientRect().top ?? r.top) - r.top
      // phase 1: the title travels from 85% to 40% of the viewport
      const hp = Math.max(0, Math.min(1, (vh * 0.85 - (r.top + titleTop)) / (vh * 0.45)))
      let len = hp * geo.swashEnd
      if (hp >= 1) {
        // phase 2: the nib follows the reading line down the gutter
        const target = vh * 0.55 - r.top
        let i = Math.round((geo.swashEnd / geo.total) * (n - 1))
        while (i < n - 1 && geo.samples[i * 3 + 1] < target) i++
        len = Math.max(geo.swashEnd, geo.samples[i * 3 + 2])
      }
      // ease toward the target so fast scrolling still looks like writing
      shown += (len - shown) * 0.35
      if (Math.abs(len - shown) < 1) shown = len
      apply(shown)
      if (shown !== len) raf = requestAnimationFrame(update)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    const reveal = () => apply(geo.total)
    window.addEventListener('beforeprint', reveal)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('beforeprint', reveal)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [geo])

  return (
    <div ref={box} className={`sketchbook ${done ? 'is-done' : ''} ${swashDone ? 'is-signed' : ''}`}>
      {geo && (
        <svg className="ink" width={geo.w} height={geo.h} viewBox={`0 0 ${geo.w} ${geo.h}`} aria-hidden="true">
          <path ref={pathA} className="ink__line" d={geo.d} style={{ strokeDasharray: geo.total, strokeDashoffset: geo.total }} />
          <path
            ref={pathB}
            className="ink__line ink__line--edge"
            d={geo.d}
            style={{ strokeDasharray: geo.total, strokeDashoffset: geo.total }}
          />
          {geo.splats.map(([x, y, r], i) => (
            <circle key={i} className="ink__splat" cx={x} cy={y} r={r} style={{ transitionDelay: `${i * 90}ms` }} />
          ))}
          <g ref={pen} className="ink__pen" style={{ transform: `translate(${geo.pot[0]}px, ${geo.pot[1] + 18}px)` }}>
            <Pen />
          </g>
        </svg>
      )}
      <header className="sketchbook__head">
        <div ref={potRef} className="inkpot">
          <InkPot />
        </div>
        <div>
          {kicker && <p className="sketchbook__kicker">{kicker}</p>}
          <h4 ref={titleRef} className="sketchbook__title">
            {title}
          </h4>
        </div>
      </header>
      {intro && <div className="sketchbook__intro">{intro}</div>}
      <div className="sketchbook__pages">{children}</div>
    </div>
  )
}
