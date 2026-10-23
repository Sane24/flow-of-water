import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { asset, type FigureEntry } from '../data/figures'
import { Caption, Img } from './Figure'

function usePrefersReducedMotion() {
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

/* ------------------------------------------------------------------ formula playground */

function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Evaluates x_t = (1 - t) ε + t x_1 live on the preprocessed input, with Gaussian noise drawn in
 * the browser. It illustrates the formula only; the notebook's own noisy images are in Fig. A1.
 */
export function InterpolationPlayground({ entry }: { entry: FigureEntry }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const data = useRef<{ img: Float32Array; eps: Float32Array; w: number; h: number } | null>(null)
  const [t, setT] = useState(0.5)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const img = new Image()
    img.decoding = 'async'
    img.src = asset(entry.src)
    img.onload = () => {
      const w = img.naturalWidth
      const h = img.naturalHeight
      const off = document.createElement('canvas')
      off.width = w
      off.height = h
      const ctx = off.getContext('2d')
      if (!ctx) return
      ctx.drawImage(img, 0, 0)
      const px = ctx.getImageData(0, 0, w, h).data
      const n = w * h * 3
      const x1 = new Float32Array(n)
      const eps = new Float32Array(n)
      const rand = mulberry32(180)
      for (let i = 0, j = 0; i < px.length; i += 4) {
        for (let c = 0; c < 3; c++, j++) {
          x1[j] = px[i + c] / 127.5 - 1
          // Box-Muller
          const u = Math.max(1e-7, rand())
          const v = rand()
          eps[j] = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
        }
      }
      data.current = { img: x1, eps, w, h }
      setReady(true)
    }
  }, [entry.src])

  useEffect(() => {
    const d = data.current
    const el = canvas.current
    if (!d || !el) return
    el.width = d.w
    el.height = d.h
    const ctx = el.getContext('2d')
    if (!ctx) return
    const out = ctx.createImageData(d.w, d.h)
    for (let i = 0, j = 0; i < out.data.length; i += 4) {
      for (let c = 0; c < 3; c++, j++) {
        const x = (1 - t) * d.eps[j] + t * d.img[j]
        out.data[i + c] = Math.max(0, Math.min(255, (x + 1) * 127.5))
      }
      out.data[i + 3] = 255
    }
    ctx.putImageData(out, 0, 0)
  }, [t, ready])

  const share = Math.round(t * 100)
  return (
    <figure className="playground fig fig--wide screen-only" aria-label="Interactive interpolation demo">
      <div className="playground__grid">
        <div className="playground__canvas">
          <canvas ref={canvas} role="img" aria-label={`The house photo interpolated with browser noise at t = ${t.toFixed(2)}`} />
          {!ready && <span className="playground__loading">loading…</span>}
        </div>
        <div className="playground__controls">
          <p className="playground__kicker">try the formula</p>
          <p className="playground__t">
            t = <strong>{t.toFixed(2)}</strong>
          </p>
          <label className="playground__slider">
            <span className="visually-hidden">Interpolation time t</span>
            <input type="range" min={0} max={1} step={0.01} value={t} onChange={(e) => setT(Number(e.target.value))} />
          </label>
          <div className="playground__ticks" aria-hidden="true">
            <span>0 · noise</span>
            <span>1 · image</span>
          </div>
          <div className="playground__mix" aria-hidden="true">
            <span style={{ flexBasis: `${100 - share}%` }}>ε {100 - share}%</span>
            <span style={{ flexBasis: `${share}%` }}>x₁ {share}%</span>
          </div>
          <div className="playground__jumps">
            {[0.25, 0.5, 0.75].map((v) => (
              <button key={v} type="button" onClick={() => setT(v)} aria-pressed={Math.abs(t - v) < 0.001}>
                t = {v.toFixed(2)}
              </button>
            ))}
          </div>
          <p className="playground__note">
            Computed live in your browser from the same preprocessed photo, with noise drawn here. It shows the
            formula, not a notebook output; the notebook's version is Fig. A1.
          </p>
        </div>
      </div>
    </figure>
  )
}

/* ------------------------------------------------------------------ frame scrubber */

interface Frame {
  entry: FigureEntry
  label: string
}

interface ScrubberProps {
  frames: Frame[]
  label?: string
  caption?: ReactNode
  meta?: ReactNode
  /** 'thumbs' shows a strip of thumbnails; 'tabs' uses text tabs for wide grids. */
  mode?: 'thumbs' | 'tabs'
  title?: string
  stageWidth?: string
  interval?: number
}

/**
 * Steps through saved frames (a trajectory, or checkpoints over training). Screen: a stage, a
 * selector and a play button. Print: every frame laid out in order.
 */
export function FrameScrubber({ frames, label, caption, meta, mode = 'thumbs', title, stageWidth, interval = 900 }: ScrubberProps) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const reduce = usePrefersReducedMotion()

  useEffect(() => {
    if (!playing) return
    const id = window.setInterval(() => {
      setIndex((i) => {
        if (i >= frames.length - 1) {
          setPlaying(false)
          return i
        }
        return i + 1
      })
    }, reduce ? interval * 2 : interval)
    return () => window.clearInterval(id)
  }, [playing, frames.length, interval, reduce])

  const play = () => {
    if (index >= frames.length - 1) setIndex(0)
    setPlaying((p) => !p)
  }

  return (
    <figure className={`scrubber scrubber--${mode} fig fig--wide`}>
      {title && <p className="scrubber__title">{title}</p>}
      <div className="scrubber__screen">
        <div className="scrubber__stage" style={{ maxWidth: stageWidth } as CSSProperties}>
          {frames.map((f, i) => (
            <div key={f.entry.id} className={`scrubber__frame ${i === index ? 'is-current' : ''}`} aria-hidden={i !== index}>
              <Img entry={f.entry} eager={i < 2} />
            </div>
          ))}
          <span className="scrubber__badge" aria-live="polite">
            {frames[index].label}
          </span>
        </div>
        <div className="scrubber__bar">
          <button type="button" className="scrubber__play" onClick={play} aria-pressed={playing}>
            <svg viewBox="0 0 16 16" aria-hidden="true">
              {playing ? <path d="M4 3h3v10H4zM9 3h3v10H9z" /> : <path d="M4 2.5l9 5.5-9 5.5z" />}
            </svg>
            {playing ? 'Pause' : 'Play'}
          </button>
          <div className="scrubber__choices" role="group" aria-label="Choose a frame">
            {frames.map((f, i) => (
              <button
                key={f.entry.id}
                type="button"
                className="scrubber__choice"
                aria-pressed={i === index}
                onClick={() => {
                  setPlaying(false)
                  setIndex(i)
                }}
              >
                {mode === 'thumbs' && <img src={asset(f.entry.src)} alt="" width={f.entry.w} height={f.entry.h} loading="lazy" />}
                <span>{f.label}</span>
              </button>
            ))}
          </div>
          <div className="scrubber__track" aria-hidden="true">
            <span style={{ transform: `scaleX(${frames.length > 1 ? index / (frames.length - 1) : 1})` }} />
          </div>
        </div>
      </div>
      <div className={`scrubber__print scrubber__print--${mode}`}>
        {frames.map((f) => (
          <div key={f.entry.id}>
            <div className="fig__frame">
              <img src={asset(f.entry.src)} alt={f.entry.alt ?? f.label} width={f.entry.w} height={f.entry.h} loading="lazy" />
            </div>
            <span>{f.label}</span>
          </div>
        ))}
      </div>
      <Caption label={label} meta={meta}>
        {caption}
      </Caption>
    </figure>
  )
}

/* ------------------------------------------------------------------ before / after wipe */

interface WipePair {
  key: string
  before: FigureEntry
  after: FigureEntry
}

interface WipeProps {
  pairs: WipePair[]
  beforeLabel: string
  afterLabel: string
  pickLabel?: string
  label?: string
  caption?: ReactNode
  meta?: ReactNode
  aspect?: string
  maxWidth?: string
}

/** Drag a divider across two aligned saved images. Screen only; the static figures stay in print. */
export function WipeCompare({ pairs, beforeLabel, afterLabel, pickLabel = 'seed', label, caption, meta, aspect = '1 / 1', maxWidth = '30rem' }: WipeProps) {
  const [pick, setPick] = useState(0)
  const [pos, setPos] = useState(50)
  const box = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)
  const pair = pairs[pick]

  const moveTo = (clientX: number) => {
    const r = box.current?.getBoundingClientRect()
    if (!r) return
    setPos(Math.max(0, Math.min(100, ((clientX - r.left) / r.width) * 100)))
  }

  return (
    <figure className="wipe fig fig--wide screen-only" style={{ '--wipe-max': maxWidth } as CSSProperties}>
      <div
        ref={box}
        className="wipe__box"
        style={{ aspectRatio: aspect, '--pos': `${pos}%` } as CSSProperties}
        onPointerDown={(e) => {
          dragging.current = true
          ;(e.target as Element).setPointerCapture?.(e.pointerId)
          moveTo(e.clientX)
        }}
        onPointerMove={(e) => dragging.current && moveTo(e.clientX)}
        onPointerUp={() => (dragging.current = false)}
        onPointerCancel={() => (dragging.current = false)}
      >
        <img className="wipe__img" src={asset(pair.after.src)} alt={pair.after.alt} draggable={false} />
        <img className="wipe__img wipe__img--before" src={asset(pair.before.src)} alt={pair.before.alt} draggable={false} />
        <span className="wipe__tag wipe__tag--before">{beforeLabel}</span>
        <span className="wipe__tag wipe__tag--after">{afterLabel}</span>
        <span className="wipe__handle" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M9 6l-5 6 5 6M15 6l5 6-5 6" />
          </svg>
        </span>
      </div>
      <div className="wipe__controls">
        <label className="wipe__range">
          <span className="visually-hidden">Divider position</span>
          <input type="range" min={0} max={100} value={Math.round(pos)} onChange={(e) => setPos(Number(e.target.value))} />
        </label>
        {pairs.length > 1 && (
          <div className="wipe__picks" role="group" aria-label={`Choose a ${pickLabel}`}>
            {pairs.map((p, i) => (
              <button key={p.key} type="button" aria-pressed={i === pick} onClick={() => setPick(i)}>
                {pickLabel} {p.key}
              </button>
            ))}
          </div>
        )}
      </div>
      <Caption label={label} meta={meta}>
        {caption}
      </Caption>
    </figure>
  )
}
