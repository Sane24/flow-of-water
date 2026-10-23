import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { asset } from '../data/figures'

interface LightboxItem {
  src: string
  alt: string
  caption?: string
}

const Ctx = createContext<(item: LightboxItem) => void>(() => {})

export function useLightbox() {
  return useContext(Ctx)
}

export function LightboxProvider({ children }: { children: ReactNode }) {
  const [item, setItem] = useState<LightboxItem | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocus = useRef<Element | null>(null)

  const open = useCallback((next: LightboxItem) => {
    returnFocus.current = document.activeElement
    setItem(next)
  }, [])

  const close = useCallback(() => {
    setItem(null)
    const el = returnFocus.current as HTMLElement | null
    el?.focus?.()
  }, [])

  useEffect(() => {
    if (!item) return
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
      if (e.key === 'Tab') {
        e.preventDefault()
        closeRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [item, close])

  return (
    <Ctx.Provider value={open}>
      {children}
      {item && (
        <div className="lightbox" role="dialog" aria-modal="true" aria-label="Full resolution figure" onClick={close}>
          <figure className="lightbox__figure" onClick={(e) => e.stopPropagation()}>
            <img src={asset(item.src)} alt={item.alt} />
            {item.caption && <figcaption>{item.caption}</figcaption>}
          </figure>
          <button ref={closeRef} type="button" className="lightbox__close" onClick={close}>
            Close <span aria-hidden="true">×</span>
          </button>
        </div>
      )}
    </Ctx.Provider>
  )
}
