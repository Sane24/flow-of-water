import katex from 'katex'
import { useMemo } from 'react'

function render(tex: string, displayMode: boolean) {
  return katex.renderToString(tex, { displayMode, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' })
}

/** Inline math. */
export function M({ children }: { children: string }) {
  const html = useMemo(() => render(children, false), [children])
  return <span className="math-inline" dangerouslySetInnerHTML={{ __html: html }} />
}

/** Display equation with an optional tag in the margin, e.g. "A.1". */
export function Eq({ children, tag, note }: { children: string; tag?: string; note?: string }) {
  const html = useMemo(() => render(children, true), [children])
  return (
    <div className="eq">
      <div className="eq__body" dangerouslySetInnerHTML={{ __html: html }} />
      {tag && <span className="eq__tag">({tag})</span>}
      {note && <p className="eq__note">{note}</p>}
    </div>
  )
}
