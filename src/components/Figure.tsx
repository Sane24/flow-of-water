import type { CSSProperties, ReactNode } from 'react'
import { asset, type FigureEntry } from '../data/figures'
import { useLightbox } from './Lightbox'

const KIND_LABEL: Record<FigureEntry['kind'], string> = {
  result: 'model output',
  input: 'input',
  plot: 'notebook plot',
  decorative: 'decorative',
}

function shortSource(source: string) {
  const parts = source.split('/')
  return parts[parts.length - 1]
}

interface ImgProps {
  entry: FigureEntry
  className?: string
  zoom?: boolean
  eager?: boolean
  alt?: string
  style?: CSSProperties
}

/** One image from the manifest. Clicking opens the original full figure. */
export function Img({ entry, className, zoom = true, eager, alt, style }: ImgProps) {
  const open = useLightbox()
  const img = (
    <img
      src={asset(entry.src)}
      width={entry.w}
      height={entry.h}
      alt={alt ?? entry.alt ?? entry.title ?? ''}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      className={className}
      style={style}
      data-pixelated={entry.w <= 64 ? '' : undefined}
    />
  )
  if (!zoom) return img
  return (
    <button
      type="button"
      className="zoomable"
      onClick={() =>
        open({
          src: entry.full ?? entry.src,
          alt: entry.alt ?? entry.title ?? '',
          caption: `${entry.full ? 'Original notebook figure' : entry.title ?? ''} · ${shortSource(entry.source)}`,
        })
      }
      aria-label={`Enlarge: ${entry.alt ?? entry.title ?? 'figure'}`}
    >
      {img}
    </button>
  )
}

interface CaptionProps {
  label?: string
  children?: ReactNode
  meta?: ReactNode
}

export function Caption({ label, children, meta }: CaptionProps) {
  return (
    <figcaption className="caption">
      {label && <span className="caption__label">{label}</span>}
      {children && <span className="caption__text">{children}</span>}
      {meta && <span className="caption__meta">{meta}</span>}
    </figcaption>
  )
}

export function Meta({ entry, extra }: { entry: FigureEntry; extra?: string }) {
  const bits = [KIND_LABEL[entry.kind]]
  if (extra) bits.push(extra)
  bits.push(shortSource(entry.source))
  return <>{bits.join(' · ')}</>
}

interface FigureProps {
  entry: FigureEntry
  label?: string
  caption?: ReactNode
  size?: 'text' | 'wide' | 'full' | 'small'
  extra?: string
  className?: string
  pixelated?: boolean
}

export function Figure({ entry, label, caption, size = 'text', extra, className = '', pixelated }: FigureProps) {
  return (
    <figure className={`fig fig--${size} fig--kind-${entry.kind} ${pixelated ? 'fig--pixelated' : ''} ${className}`}>
      <div className="fig__frame">
        <Img entry={entry} />
      </div>
      <Caption label={label} meta={<Meta entry={entry} extra={extra} />}>
        {caption}
      </Caption>
    </figure>
  )
}

interface RowItem {
  entry: FigureEntry
  label?: ReactNode
  note?: ReactNode
}

interface FigureRowProps {
  items: RowItem[]
  label?: string
  caption?: ReactNode
  meta?: ReactNode
  size?: 'text' | 'wide' | 'full'
  columns?: number
  className?: string
  dark?: boolean
}

/** Several images side by side with their own small labels and one shared caption. */
export function FigureRow({ items, label, caption, meta, size = 'wide', columns, className = '' }: FigureRowProps) {
  const cols = columns ?? items.length
  return (
    <figure className={`fig fig--${size} figrow ${className}`} style={{ '--cols': cols } as CSSProperties}>
      <div className="figrow__grid">
        {items.map((item) => (
          <div className="figrow__cell" key={item.entry.id}>
            <div className="fig__frame">
              <Img entry={item.entry} />
            </div>
            {item.label && <div className="figrow__label">{item.label}</div>}
            {item.note && <div className="figrow__note">{item.note}</div>}
          </div>
        ))}
      </div>
      <Caption label={label} meta={meta}>
        {caption}
      </Caption>
    </figure>
  )
}
