import { useEffect } from 'react'

const REVEAL = '.fig, .timeline, .anagram, .hybrid, .obs, .keyidea, .callout, .playground, .scrubber, .wipe, .diagram'

/**
 * Figures rise gently into place as they scroll into view. Anything above the fold line is
 * revealed, so jumping through the contents never leaves a figure hidden. Only active when the
 * reader allows motion; printing shows everything at once.
 */
export function useReveal() {
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const root = document.documentElement
    let pending = Array.from(document.querySelectorAll<HTMLElement>(REVEAL))
    let raf = 0

    const check = () => {
      raf = 0
      const line = window.innerHeight * 0.94
      pending = pending.filter((el) => {
        if (el.getBoundingClientRect().top < line) {
          el.classList.add('is-in')
          return false
        }
        return true
      })
      if (!pending.length) stop()
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(check)
    }
    const showAll = () => {
      pending.forEach((el) => el.classList.add('is-in'))
      pending = []
    }
    const stop = () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }

    // figures already on screen at load appear without animating
    check()
    root.classList.add('motion')
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    window.addEventListener('beforeprint', showAll)
    return () => {
      stop()
      if (raf) cancelAnimationFrame(raf)
      window.removeEventListener('beforeprint', showAll)
      root.classList.remove('motion')
    }
  }, [])
}

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
