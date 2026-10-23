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
