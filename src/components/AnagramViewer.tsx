import { useState, type ReactNode } from 'react'
import { fig } from '../data/figures'
import { Caption, Img } from './Figure'

interface Props {
  group: string
  index: string
  name: string
  label?: string
  reverse?: boolean
  children?: ReactNode
}

/**
 * A visual anagram as one artwork that turns 180 degrees on request, plus both actual
 * saved orientations side by side. Print always shows the two saved orientations.
 */
export function AnagramViewer({ group, index, name, label, reverse, children }: Props) {
  const upright = fig(`a33-${group}-upright`)
  const rotated = fig(`a33-${group}-rotated`)
  const [turned, setTurned] = useState(false)
  const reading = turned ? rotated.prompt : upright.prompt

  return (
    <article className={`anagram ${reverse ? 'anagram--reverse' : ''}`} aria-labelledby={`anagram-${group}`}>
      <div className="anagram__art">
        <div className="anagram__stage">
          <div className={`anagram__disc ${turned ? 'is-turned' : ''}`}>
            <Img entry={upright} alt={`Visual anagram, shown ${turned ? 'rotated 180 degrees' : 'upright'}: ${reading}`} eager />
          </div>
          <svg className="anagram__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="49" />
            {Array.from({ length: 60 }, (_, i) => {
              const a = (i / 60) * Math.PI * 2
              const r1 = i % 5 === 0 ? 46.2 : 47.4
              return (
                <line
                  key={i}
                  x1={50 + Math.cos(a) * r1}
                  y1={50 + Math.sin(a) * r1}
                  x2={50 + Math.cos(a) * 49}
                  y2={50 + Math.sin(a) * 49}
                />
              )
            })}
          </svg>
        </div>
        <div className="anagram__controls">
          <button
            type="button"
            className="turn-button"
            onClick={() => setTurned((v) => !v)}
            aria-pressed={turned}
            aria-describedby={`anagram-${group}-reading`}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true" className={turned ? 'is-turned' : ''}>
              <path d="M20 12a8 8 0 1 1-2.6-5.9" />
              <path d="M20 4v4.5h-4.5" />
            </svg>
            {turned ? 'Turn back upright' : 'Turn it 180°'}
          </button>
          <p className="anagram__reading" id={`anagram-${group}-reading`} aria-live="polite">
            <span className="anagram__orient">{turned ? 'rotated 180°' : 'upright'}</span>
            <span>“{reading}”</span>
          </p>
        </div>
      </div>

      <div className="anagram__text">
        <span className="anagram__index">{index}</span>
        <h4 id={`anagram-${group}`} className="anagram__name">
          {name}
        </h4>
        <dl className="anagram__prompts">
          <div>
            <dt>upright prompt</dt>
            <dd>“{upright.promptA}”</dd>
          </div>
          <div>
            <dt>rotated prompt</dt>
            <dd>“{upright.promptB}”</dd>
          </div>
        </dl>
        <div className="anagram__body">{children}</div>
        <figure className="anagram__pair">
          <div className="anagram__pair-grid">
            <div>
              <div className="fig__frame">
                <Img entry={upright} />
              </div>
              <span>upright · “{upright.promptA}”</span>
            </div>
            <div>
              <div className="fig__frame">
                <Img entry={rotated} />
              </div>
              <span>rotated 180° · “{upright.promptB}”</span>
            </div>
          </div>
          <Caption label={label} meta={`model output · seed ${upright.seed} · w = 7 · 50 Euler steps · ${upright.source.split('/').pop()}, ${rotated.source.split('/').pop()}`}>
            Both saved orientations of the same 512 × 512 sample.
          </Caption>
        </figure>
      </div>
    </article>
  )
}
