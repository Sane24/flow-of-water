import { useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { asset, editSeries, STARTS } from '../data/figures'
import { Caption, Img } from './Figure'

interface Props {
  section: '3.1' | '3.2'
  group: string
  title: string
  kicker?: string
  prompt?: string
  initial?: (typeof STARTS)[number]
  label?: string
  children?: ReactNode
  extra?: boolean
}

/**
 * Seven-step editing sweep. On screen: the input beside a large "stage" image, with a
 * scrubber of all seven starting times. In print: one compact row of eight tiles.
 */
export function EditTimeline({ section, group, title, kicker, prompt, initial = '0.14', label, children, extra }: Props) {
  const { input, steps } = editSeries(section, group)
  const [index, setIndex] = useState<number>(Math.max(0, STARTS.indexOf(initial)))
  const tiles = useRef<Array<HTMLButtonElement | null>>([])
  const current = steps[index]

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft' && e.key !== 'Home' && e.key !== 'End') return
    e.preventDefault()
    let next = index
    if (e.key === 'ArrowRight') next = Math.min(steps.length - 1, index + 1)
    if (e.key === 'ArrowLeft') next = Math.max(0, index - 1)
    if (e.key === 'Home') next = 0
    if (e.key === 'End') next = steps.length - 1
    setIndex(next)
    tiles.current[next]?.focus()
  }

  return (
    <figure className={`timeline fig fig--wide ${extra ? 'timeline--extra' : ''}`} id={`${section === '3.1' ? 'edit' : 'text-edit'}-${group}`}>
      <header className="timeline__head">
        {kicker && <span className="timeline__kicker">{kicker}</span>}
        <h4 className="timeline__title">{title}</h4>
        {prompt && (
          <p className="prompt">
            <span className="prompt__label">prompt</span>“{prompt}”
          </p>
        )}
      </header>

      <div className="timeline__stage">
        <div className="timeline__panel timeline__panel--input">
          <div className="fig__frame">
            <Img entry={input} />
          </div>
          <span className="timeline__tag">input</span>
        </div>
        <svg className="timeline__flow" viewBox="0 0 80 24" aria-hidden="true">
          <path d="M2 12c10-8 18 8 28 0s18-8 28 0 12 6 18 0" />
          <path d="M68 6l8 6-8 6" />
        </svg>
        <div className="timeline__panel timeline__panel--current" aria-live="polite">
          <div className="fig__frame">
            <Img entry={current} key={current.id} eager />
          </div>
          <span className="timeline__tag">
            edited from <strong>t = {STARTS[index]}</strong>
          </span>
        </div>
      </div>

      <div className="timeline__strip" role="group" aria-label={`${title}: choose a starting time`} onKeyDown={onKey}>
        <div className="timeline__tile timeline__tile--input">
          <img src={asset(input.src)} width={input.w} height={input.h} alt={input.alt} loading="lazy" decoding="async" />
          <span>input</span>
        </div>
        {steps.map((s, i) => (
          <button
            type="button"
            key={s.id}
            ref={(el) => {
              tiles.current[i] = el
            }}
            className="timeline__tile"
            aria-pressed={i === index}
            tabIndex={i === index ? 0 : -1}
            onClick={() => setIndex(i)}
            onMouseEnter={() => setIndex(i)}
            onFocus={() => setIndex(i)}
          >
            <img src={asset(s.src)} width={s.w} height={s.h} alt={s.alt} loading="lazy" decoding="async" />
            <span>t = {STARTS[i]}</span>
          </button>
        ))}
      </div>
      <div className="timeline__scale" aria-hidden="true">
        <span>more noise, more freedom</span>
        <span>less noise, closer to the input</span>
      </div>

      <Caption
        label={label}
        meta={`model output · seed 180 · w = 7 · h = 0.02 · source: ${input.source.split('/').pop()}${
          input.inputSource ? ` · input: ${input.inputSource}` : ''
        }`}
      >
        {children}
      </Caption>
    </figure>
  )
}
