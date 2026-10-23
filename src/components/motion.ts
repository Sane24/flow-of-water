import { useEffect } from 'react'

/** Writes the scroll offset into a CSS variable while the hero is on screen. */
export function useHeroParallax(id: string) {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const el = document.getElementById(id)
    if (!el) return
    let raf = 0
    const update = () => {
      raf = 0
      const y = window.scrollY
      if (y < el.offsetHeight * 1.2) el.style.setProperty('--py', String(y))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [id])
}
