import { useEffect, useRef, type CSSProperties } from 'react'
import { Butterfly } from './Motifs'

/*
 * Page-wide ambient layer. A fixed canvas behind the report draws a slow current of ink
 * streamlines in the margins; it changes character with the section in view (sea-glass
 * currents, moss currents in the forest sections, motes of colored light by the stained glass,
 * drifting pixels in the Part B lab). Butterflies occasionally fly up through the margins.
 * Nothing is drawn over the text column, and it is never printed.
 */

type Theme = 'current' | 'forest' | 'glass' | 'lab' | 'night'

interface Look {
  rgb: [number, number, number]
  trail: number
  dot: number
  pixel: number
  alpha: number
}

const LOOKS: Record<Theme, Look> = {
  current: { rgb: [42, 103, 112], trail: 1, dot: 0, pixel: 0, alpha: 0.5 },
  forest: { rgb: [85, 112, 79], trail: 1, dot: 0.25, pixel: 0, alpha: 0.5 },
  glass: { rgb: [199, 118, 96], trail: 0, dot: 0, pixel: 0, alpha: 0 },
  lab: { rgb: [36, 49, 56], trail: 0.35, dot: 0, pixel: 1, alpha: 0.45 },
  night: { rgb: [42, 103, 112], trail: 0, dot: 0, pixel: 0, alpha: 0 },
}

const GLASS = ['199,118,96', '232,196,106', '42,103,112', '114,141,112', '167,201,192']

const TRAIL = 60

function readTheme(): Theme {
  const line = window.innerHeight * 0.45
  let best: Theme = 'current'
  let bestH = Infinity
  document.querySelectorAll<HTMLElement>('[data-ambient]').forEach((el) => {
    const r = el.getBoundingClientRect()
    if (r.top <= line && r.bottom >= line && r.height < bestH) {
      bestH = r.height
      best = el.dataset.ambient as Theme
    }
  })
  return best
}

interface Column {
  cx: number
  half: number
  left: number
}

/** True when a drawn butterfly (the hero's, or the one beside §3.4) is on screen. */
function residentButterflyVisible() {
  const vh = window.innerHeight
  return Array.from(document.querySelectorAll('.hero__butterfly, .section__motif .motif--butterfly')).some((el) => {
    const r = el.getBoundingClientRect()
    return r.bottom > 0 && r.top < vh
  })
}

function readColumn(): Column {
  const report = document.querySelector('.report')
  const r = report?.getBoundingClientRect()
  if (!r) return { cx: window.innerWidth / 2, half: 330, left: 0 }
  return { cx: r.left + r.width / 2, half: Math.min(r.width / 2 - 16, 340), left: r.left }
}

interface Particle {
  x: number
  y: number
  age: number
  life: number
  speed: number
  hue: number
  xs: Float32Array
  ys: Float32Array
  n: number
  head: number
}

export function AmbientField() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const flyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const fly = flyRef.current
    if (!canvas || !fly) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')

    let w = 0
    let h = 0
    let col = readColumn()
    let theme: Theme = 'current'
    let resident = false
    const look = { ...LOOKS.current, rgb: [...LOOKS.current.rgb] as [number, number, number] }
    const parts: Particle[] = []
    let lastScroll = window.scrollY
    let raf = 0
    let last = 0
    let frame = 0
    const start = performance.now()

    const marginWeight = (x: number) => {
      if (w < 900) return 0
      const d = Math.abs(x - col.cx) - col.half
      if (x < col.left + 6) return 0
      return Math.max(0, Math.min(1, (d - 8) / 110))
    }

    const spawn = (p: Particle, anywhere: boolean) => {
      for (let k = 0; k < 12; k++) {
        p.x = Math.random() * w
        p.y = anywhere ? Math.random() * h : Math.random() < 0.5 ? -10 : Math.random() * h
        if (marginWeight(p.x) > 0.35) break
      }
      p.age = 0
      p.life = 360 + Math.random() * 420
      p.speed = 0.7 + Math.random() * 0.9
      p.hue = Math.floor(Math.random() * GLASS.length)
      p.n = 0
      p.head = 0
    }

    const resize = () => {
      const dpr = 1
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = Math.round(w * dpr)
      canvas.height = Math.round(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      col = readColumn()
      const target = w < 900 ? 0 : Math.round(Math.min(140, (w * h) / 9000))
      while (parts.length < target) {
        const p: Particle = {
          x: 0, y: 0, age: 0, life: 1, speed: 1, hue: 0,
          xs: new Float32Array(TRAIL), ys: new Float32Array(TRAIL), n: 0, head: 0,
        }
        spawn(p, true)
        p.age = Math.random() * p.life
        parts.push(p)
      }
      parts.length = Math.min(parts.length, target)
    }

    const angle = (x: number, y: number, t: number) =>
      0.4 +
      1.35 *
        (Math.sin(x * 0.0052 + t * 0.12) +
          Math.sin(y * 0.0046 - t * 0.08 + Math.cos(x * 0.0031 + t * 0.05) * 1.6) +
          0.7 * Math.sin((x - y) * 0.0034 + t * 0.06))

    const draw = (time: number) => {
      ctx.clearRect(0, 0, w, h)
      if (frame % 8 === 0) {
        theme = readTheme()
        col = readColumn()
        resident = residentButterflyVisible()
      }
      frame++
      const target = LOOKS[theme]
      const k = 0.05
      look.rgb = look.rgb.map((v, i) => v + (target.rgb[i] - v) * k) as [number, number, number]
      look.trail += (target.trail - look.trail) * k
      look.dot += (target.dot - look.dot) * k
      look.pixel += (target.pixel - look.pixel) * k
      look.alpha += (target.alpha - look.alpha) * k
      if (look.alpha < 0.01) return

      // particles ride along with the page a little, so the current feels attached to it
      const sy = window.scrollY
      const dy = (sy - lastScroll) * 0.7
      lastScroll = sy

      const [r, g, b] = look.rgb.map(Math.round)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      for (const p of parts) {
        if (dy) {
          p.y -= dy
          for (let i = 0; i < TRAIL; i++) p.ys[i] -= dy
        }
        const a = angle(p.x, p.y + sy * 0.3, time)
        p.x += Math.cos(a) * p.speed
        p.y += Math.sin(a) * p.speed * 0.85 + 0.2
        p.age++
        p.xs[p.head] = p.x
        p.ys[p.head] = p.y
        p.head = (p.head + 1) % TRAIL
        p.n = Math.min(TRAIL, p.n + 1)
        if (p.age > p.life || p.y > h + 40 || p.y < -60 || p.x < -40 || p.x > w + 40) {
          spawn(p, false)
          continue
        }
        const life = Math.min(1, p.age / 40, (p.life - p.age) / 60)
        const mw = marginWeight(p.x)
        const alpha = look.alpha * life * mw
        if (alpha < 0.01) continue

        if (look.trail > 0.02 && p.n > 2) {
          // a fading tail: faint along its whole length, stronger near the head
          ctx.strokeStyle = `rgb(${r},${g},${b})`
          for (const [from, a, wd] of [
            [0, 0.22, 0.7],
            [0.62, 0.7, 1.1],
          ] as const) {
            const s0 = Math.floor(p.n * from)
            if (p.n - s0 < 2) continue
            ctx.globalAlpha = alpha * look.trail * a
            ctx.lineWidth = wd + p.speed * 0.25
            ctx.beginPath()
            for (let i = s0; i < p.n; i++) {
              const idx = (p.head - p.n + i + TRAIL) % TRAIL
              if (i === s0) ctx.moveTo(p.xs[idx], p.ys[idx])
              else ctx.lineTo(p.xs[idx], p.ys[idx])
            }
            ctx.stroke()
          }
        }
        if (look.dot > 0.02) {
          const tw = 0.55 + 0.45 * Math.sin(time * 2.1 + p.hue * 1.7 + p.life)
          ctx.globalAlpha = alpha * look.dot * tw
          ctx.fillStyle = `rgba(${GLASS[p.hue]},1)`
          ctx.beginPath()
          ctx.arc(p.x, p.y, 1.4 + p.speed * 1.2, 0, Math.PI * 2)
          ctx.fill()
        }
        if (look.pixel > 0.02) {
          ctx.globalAlpha = alpha * look.pixel * 0.8
          ctx.fillStyle = `rgb(${r},${g},${b})`
          const s = 2 + (p.hue % 3)
          ctx.fillRect(Math.round(p.x / 4) * 4, Math.round(p.y / 4) * 4, s, s)
        }
      }
      ctx.globalAlpha = 1
    }

    /* butterflies: one in the air at a time, never alongside a drawn one ------ */
    const flyers = Array.from(fly.children) as HTMLElement[]
    const flight = flyers.map(() => ({ on: false, x: 0, y: 0, a: -Math.PI / 2, t: 0, side: 1 }))
    let nextSpawn = 5 + Math.random() * 6

    const moveFlyers = (time: number, dt: number) => {
      const light = theme === 'current' || theme === 'forest' || theme === 'glass'
      const anyOn = flight.some((f) => f.on)
      // pick which butterfly takes the next flight, alternating colors
      const pick = Math.floor(nextSpawn * 7) % flyers.length
      flight.forEach((f, i) => {
        const el = flyers[i]
        if (!f.on) {
          if (!anyOn && i === pick && light && !resident && w >= 1100 && time > nextSpawn) {
            f.on = true
            f.side = Math.random() < 0.5 ? -1 : 1
            const inner = col.half + 60
            const outerL = col.left + 30
            const lo = f.side < 0 ? Math.max(outerL, col.cx - inner - 200) : col.cx + inner
            const hi = f.side < 0 ? col.cx - inner : Math.min(w - 30, col.cx + inner + 200)
            f.x = lo + Math.random() * Math.max(10, hi - lo)
            f.y = h + 30
            f.a = -Math.PI / 2
            f.t = time
          }
          el.style.opacity = '0'
          return
        }
        // wander upward, steering away from the text column
        const inner = col.half + 50
        const d = (f.x - col.cx) * f.side
        const wobble = Math.sin(time * 1.3 + i * 4) * 0.5 + Math.sin(time * 0.37 + i) * 0.35
        const push = d < inner ? 0.9 * f.side : 0
        const want = -Math.PI / 2 + wobble + push
        f.a += (want - f.a) * 0.06
        const speed = 62 + 20 * Math.sin(time * 3 + i)
        f.x += Math.cos(f.a) * speed * dt
        f.y += Math.sin(f.a) * speed * dt + Math.sin(time * 7 + i) * 0.6
        if (f.y < -60 || !light || resident) {
          f.on = false
          nextSpawn = time + 9 + Math.random() * 12
        }
        el.style.opacity = light && !resident ? '1' : '0'
        el.style.transform = `translate(${f.x - 18}px, ${f.y - 14}px) rotate(${(f.a + Math.PI / 2) * (180 / Math.PI)}deg)`
      })
    }

    const tick = (now: number) => {
      raf = 0
      const dt = Math.min(0.1, (now - last) / 1000)
      if (now - last >= 40) {
        last = now
        const t = (now - start) / 1000
        draw(t)
        moveFlyers(t, dt)
      }
      schedule()
    }
    const schedule = () => {
      if (!raf && !reduce.matches && !document.hidden) raf = requestAnimationFrame(tick)
    }
    const onVisibility = () => (document.hidden ? (cancelAnimationFrame(raf), (raf = 0)) : schedule())

    resize()
    if (reduce.matches) {
      // one still frame of the current, no butterflies
      for (let i = 0; i < 40; i++) draw(7 + i * 0.03)
    }
    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', onVisibility)
    schedule()
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <>
      <canvas ref={canvasRef} className="ambient" aria-hidden="true" />
      <div ref={flyRef} className="flyers" aria-hidden="true">
        <div className="flyer flyer--a">
          <Butterfly />
        </div>
        <div className="flyer flyer--b">
          <Butterfly />
        </div>
      </div>
    </>
  )
}

/* ---------------------------------------------------------------- caustics */

/** Two slowly drifting layers of caustic light, like sun through water onto a pool floor. */
export function Caustics({ tone = 'sea' }: { tone?: 'sea' | 'glass' | 'foam' }) {
  return (
    <div className={`caustics caustics--${tone}`} aria-hidden="true">
      <span />
      <span />
    </div>
  )
}

/* ---------------------------------------------------------------- fireflies */

function rand(seed: number) {
  const x = Math.sin(seed * 91.7 + 13.1) * 43758.5453
  return x - Math.floor(x)
}

/** Glowing fireflies drifting in the margins of a dark section. */
export function Fireflies({ count = 22 }: { count?: number }) {
  return (
    <div className="fireflies" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => {
        const side = i % 2 === 0
        const x = side ? rand(i) * 15 : 85 + rand(i) * 14
        const y = 8 + rand(i + 50) * 84
        return (
          <i
            key={i}
            style={
              {
                left: `${x}%`,
                top: `${y}%`,
                '--dx': `${(rand(i + 7) - 0.5) * 90}px`,
                '--dy': `${(rand(i + 9) - 0.5) * 70}px`,
                '--dur': `${9 + rand(i + 3) * 10}s`,
                '--pulse': `${2.4 + rand(i + 5) * 2.8}s`,
                animationDelay: `${-rand(i + 11) * 12}s, ${-rand(i + 12) * 4}s`,
              } as CSSProperties
            }
          />
        )
      })}
    </div>
  )
}
