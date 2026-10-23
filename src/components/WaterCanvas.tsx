import { useEffect, useRef } from 'react'

/**
 * Shared animation loop: ~30 fps, paused when off screen or in a background tab, a single
 * static frame when the reader prefers reduced motion. Never runs in print.
 */
function useCanvasLoop(draw: (ctx: CanvasRenderingContext2D, w: number, h: number, time: number) => void) {
  const ref = useRef<HTMLCanvasElement>(null)
  const drawRef = useRef(draw)
  drawRef.current = draw

  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let w = 0
    let h = 0
    let raf = 0
    let last = 0
    let onScreen = true
    const start = performance.now()

    const frame = (now: number) => {
      raf = 0
      if (now - last >= 32) {
        last = now
        drawRef.current(ctx, w, h, (now - start) / 1000)
      }
      schedule()
    }
    const schedule = () => {
      if (raf || reduce.matches || !onScreen || document.hidden) return
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawRef.current(ctx, w, h, reduce.matches ? 7 : (performance.now() - start) / 1000)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      onScreen = entry.isIntersecting
      if (onScreen) schedule()
      else stop()
    })
    io.observe(canvas)
    const onVisibility = () => (document.hidden ? stop() : schedule())
    const onMotion = () => (reduce.matches ? stop() : schedule())
    document.addEventListener('visibilitychange', onVisibility)
    reduce.addEventListener('change', onMotion)
    resize()
    schedule()
    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
      reduce.removeEventListener('change', onMotion)
    }
  }, [])

  return ref
}

function hash(n: number) {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}

const LINES = 40

/**
 * The hero sea: engraved current lines receding toward a horizon, with swells rolling toward
 * the viewer and moonlight glints gathering under the porthole plate.
 */
export function WaterCanvas({ className = '' }: { className?: string }) {
  const ref = useCanvasLoop((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h)
    const narrow = w < 760
    const moonX = narrow ? w * 0.5 : w * 0.74
    const step = narrow ? 8 : 6
    for (let i = 0; i < LINES; i++) {
      const d = i / (LINES - 1)
      const depth = Math.pow(d, 1.75)
      const yb = 6 + (h - 10) * depth
      const swell = 0.82 + 0.18 * Math.sin(time * 0.42 - d * 7.5)
      const amp = (0.7 + 15 * Math.pow(d, 2.1)) * swell
      const k = 0.021 - 0.014 * d
      const speed = 0.22 + 0.5 * d
      const p1 = hash(i + 1) * 6.28
      const p2 = hash(i + 41) * 6.28
      const p3 = hash(i + 83) * 6.28
      const s = 0.85 + hash(i + 7) * 0.3
      const yAt = (x: number) => {
        const ph = x * k
        return (
          yb +
          amp *
            (0.6 * Math.sin(ph * s + time * speed + p1) +
              0.28 * Math.sin(ph * 2.3 - time * speed * 1.35 + p2) +
              0.12 * Math.sin(ph * 5.2 + time * speed * 0.6 + p3))
        )
      }

      ctx.beginPath()
      for (let x = -step; x <= w + step; x += step) {
        const y = yAt(x)
        if (x === -step) ctx.moveTo(x, y)
        else ctx.lineTo(x, y)
      }
      ctx.lineWidth = 0.5 + 1.15 * d
      ctx.strokeStyle = `rgba(207, 226, 220, ${0.05 + 0.3 * Math.pow(d, 1.15)})`
      ctx.stroke()

      // moonlight glints, concentrated in a column under the plate
      const spread = 24 + 150 * d
      ctx.fillStyle = 'rgb(237, 244, 239)'
      for (let x = moonX - spread * 2; x < moonX + spread * 2; x += step) {
        const g = Math.exp(-((x - moonX) ** 2) / (2 * spread * spread))
        const flicker = Math.max(0, Math.sin(x * 0.09 + time * (1.1 + d) + i * 1.7))
        const a = g * Math.pow(flicker, 7) * (0.25 + 0.6 * d)
        if (a < 0.03) continue
        ctx.globalAlpha = a
        ctx.fillRect(x, yAt(x) - 0.7, 3 + 9 * d * flicker, 1.1 + 0.6 * d)
      }
      ctx.globalAlpha = 1
    }
  })
  return <canvas ref={ref} className={className} aria-hidden="true" />
}

/**
 * Falling water for the chapter break between Part A and Part B: a ledge of dark rock, a
 * curtain of water that arcs over the lip and drops, and a pool of ripples at the bottom.
 */
export function WaterfallCanvas({ className = '' }: { className?: string }) {
  const ref = useCanvasLoop((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h)
    const lip = h * 0.17
    const pool = h * 0.8
    const bandL = w * 0.26
    const bandR = w * 0.74
    const mid = (bandL + bandR) / 2

    // cliff walls on either side of the fall
    const rock = (side: 1 | -1) => {
      ctx.beginPath()
      const edge = side === -1 ? bandL - 6 : bandR + 6
      const outer = side === -1 ? 0 : w
      ctx.moveTo(outer, 0)
      for (let i = 0; i <= 14; i++) {
        const y = (i / 14) * pool
        // jagged edge that recedes slightly away from the water toward the bottom
        const jag = (hash(i * 3 + (side === -1 ? 0 : 50)) - 0.5) * 16
        ctx.lineTo(edge + jag + side * (y / pool) * 22, y)
      }
      ctx.lineTo(outer, pool)
      ctx.closePath()
      ctx.fillStyle = 'rgba(6, 20, 26, 0.85)'
      ctx.fill()
    }
    rock(-1)
    rock(1)

    // the ledge the water pours over
    ctx.beginPath()
    ctx.moveTo(bandL - 30, 0)
    ctx.lineTo(bandR + 30, 0)
    for (let i = 12; i >= 0; i--) {
      const x = bandL - 30 + ((bandR - bandL + 60) * i) / 12
      ctx.lineTo(x, lip - 10 + (hash(i + 200) - 0.5) * 8)
    }
    ctx.closePath()
    ctx.fillStyle = 'rgba(6, 20, 26, 0.9)'
    ctx.fill()

    // water curtain
    const cols = Math.max(26, Math.round((bandR - bandL) / 4.5))
    for (let c = 0; c < cols; c++) {
      const u = c / (cols - 1)
      const x0 = bandL + (bandR - bandL) * u + (hash(c) - 0.5) * 3
      const strength = 0.45 + 0.55 * Math.sin(Math.PI * u)
      const push = (x0 - mid) * 0.06
      const speed = 150 + hash(c + 9) * 140
      const dashes = 4 + Math.round(hash(c + 3) * 3)
      ctx.lineWidth = 0.6 + strength
      for (let k = 0; k < dashes; k++) {
        const len = 26 + hash(c * 7 + k) * 80
        const span = pool - lip
        const period = span + len
        const y = lip + ((time * speed + hash(c * 13 + k) * period) % period) - len * 0.5
        const y1 = Math.max(lip - 4, y)
        const y2 = Math.min(pool, y + len)
        if (y2 <= y1) continue
        // water leaves the lip with a little forward arc, then drops straight
        const xAt = (yy: number) => x0 + push * (1 - Math.exp(-(yy - lip) / 26)) + Math.sin(yy * 0.02 + c) * 0.8
        const grad = ctx.createLinearGradient(0, y1, 0, y2)
        const a = 0.14 + 0.5 * strength
        grad.addColorStop(0, 'rgba(207, 226, 220, 0)')
        grad.addColorStop(1, `rgba(237, 244, 239, ${a})`)
        ctx.strokeStyle = grad
        ctx.beginPath()
        ctx.moveTo(xAt(y1), y1)
        ctx.lineTo(xAt(y2), y2)
        ctx.stroke()
      }
    }

    // foam along the lip
    ctx.strokeStyle = 'rgba(237, 244, 239, 0.55)'
    ctx.lineWidth = 1.4
    ctx.beginPath()
    for (let x = bandL; x <= bandR; x += 4) {
      const y = lip - 3 + Math.sin(x * 0.15 + time * 3) * 1.2
      if (x === bandL) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()

    // pool: ripples spreading out from where the water lands
    for (let r = 0; r < 7; r++) {
      const d = r / 6
      const y = pool + 6 + d * (h - pool - 10)
      const spread = (bandR - bandL) * (0.6 + d * 1.1)
      ctx.beginPath()
      for (let x = mid - spread; x <= mid + spread; x += 5) {
        const fade = 1 - Math.abs(x - mid) / spread
        const yy = y + Math.sin(x * (0.05 - d * 0.02) - time * (1.6 - d * 0.6) + r) * (1 + d * 2.5) * fade
        if (x === mid - spread) ctx.moveTo(x, yy)
        else ctx.lineTo(x, yy)
      }
      ctx.strokeStyle = `rgba(207, 226, 220, ${0.32 - d * 0.2})`
      ctx.lineWidth = 0.8
      ctx.stroke()
    }
  })
  return <canvas ref={ref} className={className} aria-hidden="true" />
}
