import { useState, type CSSProperties, type ReactNode } from 'react'
import { asset, fig } from '../data/figures'
import { Caption, Img } from './Figure'

interface Props {
  group: string
  index: string
  name: string
  label?: string
  children?: ReactNode
  compact?: boolean
}

/**
 * Hybrid image with a "step back" control. Moving the slider shrinks the same 512 × 512
 * output toward 64 px; at the far end the saved 64 × 64 downsample replaces it. Print shows
 * the full image and the 64 × 64 file side by side.
 */
export function HybridViewer({ group, index, name, label, children, compact }: Props) {
  const near = fig(`a34-${group}-near`)
  const far = fig(`a34-${group}-far`)
  const [d, setD] = useState(0)
  const [animate, setAnimate] = useState(false)
  const atFar = d >= 0.98

  const jump = (value: number) => {
    setAnimate(true)
    setD(value)
    window.setTimeout(() => setAnimate(false), 650)
  }

  const distanceLabel = d < 0.08 ? 'up close, full 512 × 512' : atFar ? 'far away, the saved 64 × 64 file' : 'stepping back'

  return (
    <article className={`hybrid ${compact ? 'hybrid--compact' : ''}`} aria-labelledby={`hybrid-${group}`}>
      <header className="hybrid__head">
        <span className="hybrid__index">{index}</span>
        <h4 id={`hybrid-${group}`} className="hybrid__name">
          {name}
        </h4>
        <dl className="hybrid__prompts">
          <div>
            <dt>far · low frequencies (prompt a)</dt>
            <dd>“{near.promptFar}”</dd>
          </div>
          <div>
            <dt>near · high frequencies (prompt b)</dt>
            <dd>“{near.promptNear}”</dd>
          </div>
        </dl>
      </header>

      <figure className="hybrid__figure">
        <div className="hybrid__views">
          <div className="hybrid__view hybrid__view--near">
            <div
              className={`hybrid__window ${animate ? 'is-animating' : ''} ${atFar ? 'is-far' : ''}`}
              style={{ '--d': d } as CSSProperties}
            >
              <div className="hybrid__scaler">
                <Img entry={near} eager />
              </div>
              <img
                className="hybrid__far-swap"
                src={asset(far.src)}
                width={64}
                height={64}
                alt=""
                aria-hidden="true"
                loading="lazy"
              />
            </div>
            <span className="hybrid__view-label">
              <span className="screen-only">{distanceLabel}</span>
              <span className="print-only">near: full resolution, 512 × 512</span>
            </span>
          </div>

          <div className="hybrid__view hybrid__view--far">
            <div className="hybrid__farcard">
              <Img entry={far} />
            </div>
            <span className="hybrid__view-label">far: 64 × 64 downsample, shown at its own size</span>
          </div>
        </div>

        <div className="hybrid__controls">
          <label className="hybrid__slider">
            <span className="hybrid__slider-label">viewing distance</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={Math.round(d * 100)}
              onChange={(e) => setD(Number(e.target.value) / 100)}
              aria-valuetext={distanceLabel}
            />
            <span className="hybrid__ticks" aria-hidden="true">
              <span>near</span>
              <span>far</span>
            </span>
          </label>
          <div className="hybrid__jumps">
            <button type="button" onClick={() => jump(0)} aria-pressed={d < 0.02}>
              Up close
            </button>
            <button type="button" onClick={() => jump(1)} aria-pressed={atFar}>
              From far away
            </button>
          </div>
        </div>

        <Caption label={label} meta={`model output · seed ${near.seed} · w = 7 · LP σ = 16, kernel 265 · ${near.source.split('/').pop()}, ${far.source.split('/').pop()}`}>
          The same generated image, near and far.
        </Caption>
      </figure>

      <div className="hybrid__body">{children}</div>
    </article>
  )
}
