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

/** Falling water for the chapter break between Part A and Part B. */
export function WaterfallCanvas({ className = '' }: { className?: string }) {
  const ref = useCanvasLoop((ctx, w, h, time) => {
    ctx.clearRect(0, 0, w, h)
    const cols = Math.max(24, Math.round(w / 9))
    for (let c = 0; c < cols; c++) {
      const x = (c + 0.5) * (w / cols) + (hash(c) - 0.5) * 6
      // the fall is densest in the middle third
      const center = 1 - Math.abs(x / w - 0.5) * 2
      const strength = Math.pow(Math.max(0, center), 0.8)
      if (strength < 0.06) continue
      const speed = 120 + hash(c + 9) * 160
      const dashes = 3 + Math.round(hash(c + 3) * 3)
      ctx.lineWidth = 0.6 + strength * 1.1
      for (let k = 0; k < dashes; k++) {
        const len = 30 + hash(c * 7 + k) * 90
        const period = h + len + 40
        const y = ((time * speed + hash(c * 13 + k) * period) % period) - len
        const sway = Math.sin((y / h) * 3 + c) * 2
        const grad = ctx.createLinearGradient(0, y, 0, y + len)
        const a = 0.12 + 0.4 * strength
        grad.addColorStop(0, 'rgba(207, 226, 220, 0)')
        grad.addColorStop(1, `rgba(237, 244, 239, ${a})`)
        ctx.strokeStyle = grad
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x + sway, y + len)
        ctx.stroke()
      }
    }
  })
  return <canvas ref={ref} className={className} aria-hidden="true" />
}
