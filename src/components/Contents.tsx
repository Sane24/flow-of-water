import { useEffect, useRef, useState } from 'react'

interface Item {
  id: string
  label: string
  num?: string
  children?: Item[]
}

export const TOC: Item[] = [
  { id: 'introduction', label: 'Introduction' },
  {
    id: 'part-a',
    label: 'Part A · Exploring the Power of Flow Models',
    children: [
      { id: 'a-1-1', num: '1.1', label: 'Noisy training inputs' },
      { id: 'a-1-2', num: '1.2', label: 'Classical denoising' },
      { id: 'a-1-3', num: '1.3', label: 'One-step denoising' },
      { id: 'a-1-4', num: '1.4', label: 'Visualizing velocity' },
      { id: 'a-1-5', num: '1.5', label: 'Euler sampling' },
      { id: 'a-1-6', num: '1.6', label: 'Images from noise' },
      { id: 'a-2-1', num: '2.1', label: 'Classifier-free guidance' },
    ],
  },
  {
    id: 'creative',
    label: 'Creative applications',
    children: [
      { id: 'a-3-1', num: '3.1', label: 'Image-to-image editing' },
      { id: 'a-3-2', num: '3.2', label: 'Text-guided editing' },
      { id: 'a-3-3', num: '3.3', label: 'Visual anagrams' },
      { id: 'a-3-4', num: '3.4', label: 'Hybrid images' },
    ],
  },
  {
    id: 'part-b',
    label: 'Part B · Flow Matching from Scratch',
    children: [
      { id: 'b-1-1', num: '1.1', label: 'Implementing the UNet' },
      { id: 'b-1-2', num: '1.2', label: 'Training a denoiser' },
      { id: 'b-2-1', num: '2.1', label: 'Time conditioning' },
      { id: 'b-2-2', num: '2.2', label: 'Training the UNet' },
      { id: 'b-2-3', num: '2.3', label: 'Sampling' },
      { id: 'b-2-4', num: '2.4', label: 'Class conditioning' },
      { id: 'b-2-5', num: '2.5', label: 'Training, class-conditioned' },
      { id: 'b-2-6', num: '2.6', label: 'Sampling and the scheduler' },
    ],
  },
  { id: 'observations', label: 'Experiments and observations' },
]

const ALL_IDS = TOC.flatMap((i) => [i.id, ...(i.children ?? []).map((c) => c.id)])

function useScrollState() {
  const [active, setActive] = useState('')
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const doc = document.documentElement
      const max = doc.scrollHeight - window.innerHeight
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0)
      const line = window.innerHeight * 0.3
      let current = ''
      for (const id of ALL_IDS) {
        const el = document.getElementById(id)
        if (el && el.getBoundingClientRect().top <= line) current = id
      }
      setActive(current)
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])
  return { active, progress }
}

function List({ active, onNavigate }: { active: string; onNavigate?: () => void }) {
  const parentOf = (id: string) => TOC.find((i) => i.id === id || i.children?.some((c) => c.id === id))?.id
  const openPart = parentOf(active)
  return (
    <ol className="toc__list">
      {TOC.map((item) => (
        <li key={item.id} className={`toc__item ${openPart === item.id ? 'is-open' : ''}`}>
          <a
            href={`#${item.id}`}
            className={active === item.id ? 'is-active' : ''}
            aria-current={active === item.id ? 'location' : undefined}
            onClick={onNavigate}
          >
            {item.label}
          </a>
          {item.children && (
            <ol className="toc__sub">
              {item.children.map((c) => (
                <li key={c.id}>
                  <a
                    href={`#${c.id}`}
                    className={active === c.id ? 'is-active' : ''}
                    aria-current={active === c.id ? 'location' : undefined}
                    onClick={onNavigate}
                  >
                    <span className="toc__num">{c.num}</span>
                    {c.label}
                  </a>
                </li>
              ))}
            </ol>
          )}
        </li>
      ))}
    </ol>
  )
}

export function Contents() {
  const { active, progress } = useScrollState()
  const [open, setOpen] = useState(false)
  const sheetRef = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    sheetRef.current?.querySelector('a')?.focus()
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <div className="progress-bar" aria-hidden="true" style={{ transform: `scaleX(${progress})` }} />
      <nav className="rail" aria-label="Contents">
        <div className="rail__inner">
          <a className="rail__title" href="#top">
            Flow <em>of</em> Water
          </a>
          <div className="rail__body">
            <div className="rail__current" aria-hidden="true">
              <span style={{ transform: `scaleY(${progress})` }} />
              <i style={{ top: `${progress * 100}%` }} />
            </div>
            <List active={active} />
          </div>
        </div>
      </nav>

      <div className="mobile-dock">
        <button
          ref={toggleRef}
          type="button"
          className="mobile-dock__toggle"
          aria-expanded={open}
          aria-controls="mobile-contents"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Close' : 'Contents'}
        </button>
      </div>
      <div
        id="mobile-contents"
        ref={sheetRef}
        className={`sheet ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Contents"
        hidden={!open}
      >
        <p className="sheet__title">Contents</p>
        <List active={active} onNavigate={() => setOpen(false)} />
      </div>
    </>
  )
}
