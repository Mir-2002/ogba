import { useEffect, useState, type RefObject } from 'react'

const NATIVE_W = 240
const NATIVE_H = 160
const DESKTOP_BP = 1024

// Measures the actual box the screen is allotted (via ResizeObserver, not a
// guess at viewport/chrome sizes) and fits the 3:2 GBA screen inside it.
// Desktop prefers a crisp integer multiple; mobile allows fractional scale
// (rounded to a fine step to avoid float jitter) so the screen can fill the
// shell instead of sitting tiny at 1x. `image-rendering: pixelated` keeps
// even fractional scales looking clean.
export function useGbaScale(containerRef: RefObject<HTMLElement | null>): number {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const compute = () => {
      const { width, height } = el.getBoundingClientRect()
      if (width <= 0 || height <= 0) return

      const raw = Math.min(width / NATIVE_W, height / NATIVE_H)
      // Integer scaling only pays off from 2x up; below that (small laptops)
      // flooring to 1x would leave the screen tiny, so go fractional too.
      const isDesktop = window.innerWidth >= DESKTOP_BP
      const next = isDesktop && raw >= 2
        ? Math.floor(raw)
        : Math.max(0.5, Math.floor(raw * 20) / 20) // nearest 0.05

      setScale((prev) => (prev === next ? prev : next))
    }

    compute()
    const observer = new ResizeObserver(compute)
    observer.observe(el)
    // Catches breakpoint crossings (integer vs fractional) that don't
    // necessarily change this element's own size.
    window.addEventListener('resize', compute)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', compute)
    }
  }, [containerRef])

  return scale
}
