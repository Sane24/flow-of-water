/** Load every lazy image and wait for it to decode, so the printed PDF never misses a figure. */
export async function loadAllImages() {
  const imgs = Array.from(document.images)
  imgs.forEach((img) => {
    if (img.loading === 'lazy') img.loading = 'eager'
  })
  await Promise.all(
    imgs.map((img) =>
      img.complete && img.naturalWidth > 0
        ? Promise.resolve()
        : new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve(), { once: true })
            img.addEventListener('error', () => resolve(), { once: true })
          }),
    ),
  )
}

export function PrintButton({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
  const onClick = async () => {
    await loadAllImages()
    window.print()
  }
  return (
    <button type="button" className={`print-button print-button--${tone}`} onClick={onClick}>
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6 9V3h12v6M6 18H4v-7h16v7h-2M7 14h10v7H7z" />
      </svg>
      Print / Save as PDF
    </button>
  )
}
