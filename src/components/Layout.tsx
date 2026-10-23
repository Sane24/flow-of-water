import type { ReactNode } from 'react'
import { asset } from '../data/figures'

export const LIVE_URL = 'https://sane24.github.io/flow-of-water/'
export const REPO_URL = 'https://github.com/Sane24/flow-of-water'

/** My other CS180 project pages, in order. */
export const PROJECTS = [
  { num: 'P0', name: 'Brand New Zoom', href: 'https://sane24.github.io/Brand-New-Zoom/' },
  { num: 'P1', name: 'Russian Doll Pyramid', href: 'https://sane24.github.io/Russian-Doll-Pyramid/' },
  { num: 'P2', name: 'Twilight Filter', href: 'https://sane24.github.io/Twilight-Filter/' },
  { num: 'P3', name: 'Flow of Water', href: 'https://sane24.github.io/flow-of-water/', current: true },
]

/** A thin strip linking the CS180 project pages, styled like a tide line. */
export function ProjectStrip() {
  return (
    <nav className="projects" aria-label="CS180 projects">
      <span className="projects__label">CS180 projects</span>
      <ol className="projects__list">
        {PROJECTS.map((p) => (
          <li key={p.num}>
            <a href={p.href} aria-current={p.current ? 'page' : undefined}>
              <span className="projects__num">{p.num}</span>
              <span className="projects__name">{p.name}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

interface SectionProps {
  id: string
  num: string
  title: string
  children: ReactNode
  motif?: ReactNode
  className?: string
  ambient?: 'forest' | 'glass' | 'night' | 'lab'
  scene?: ReactNode
}

/** One numbered assignment section with an anchor the contents rail can follow. */
export function Section({ id, num, title, children, motif, className = '', ambient, scene }: SectionProps) {
  return (
    <section id={id} className={`section flow ${className}`} data-toc data-ambient={ambient} aria-labelledby={`${id}-title`}>
      {scene}
      <header className="section__head">
        <span className="section__num">{num}</span>
        <h3 id={`${id}-title`} className="section__title">
          {title}
        </h3>
        {motif && <span className="section__motif">{motif}</span>}
        <a className="section__anchor" href={`#${id}`} aria-label={`Link to section ${num}`}>
          #
        </a>
      </header>
      {children}
    </section>
  )
}

export function SubHead({ id, num, className = '', children }: { id?: string; num?: string; className?: string; children: ReactNode }) {
  return (
    <h4 className={`subhead ${className}`} id={id} data-toc={id ? '' : undefined}>
      {num && <span className="subhead__num">{num}</span>}
      {children}
    </h4>
  )
}

/** A specimen-label strip of experiment parameters. */
export function Params({ items }: { items: Array<[string, ReactNode]> }) {
  return (
    <dl className="params">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Handwritten marginal note. */
export function Note({ children }: { children: ReactNode }) {
  return (
    <p className="hand-note">
      <svg viewBox="0 0 40 24" aria-hidden="true">
        <path d="M2 4c10 2 18 8 22 16M24 20l-6-1M24 20l1-6" />
      </svg>
      {children}
    </p>
  )
}

export function Callout({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <aside className="callout">
      {title && <p className="callout__title">{title}</p>}
      {children}
    </aside>
  )
}

/** A small decorative engraving that sits in the right margin on wide screens. */
export function MarginPlate({ src, w, h, caption }: { src: string; w: number; h: number; caption: string }) {
  return (
    <div className="margin-plate" aria-hidden="true">
      <figure>
        <img src={asset(src)} width={w} height={h} alt="" loading="lazy" decoding="async" />
        <figcaption>{caption}</figcaption>
      </figure>
    </div>
  )
}
