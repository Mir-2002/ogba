import { useState, useEffect } from 'react'

const DESKTOP_BP = 1024
const SIDEBAR_USED = 288 + 32  // lg:w-72 + gap/padding

function computeScale(hasRom: boolean): number {
  if (!hasRom) return 2
  const isDesktop = window.innerWidth >= DESKTOP_BP
  const usedW = isDesktop ? 88 + SIDEBAR_USED : 88
  const maxByH = Math.floor((window.innerHeight - 136) / 160)
  const maxByW = Math.floor((window.innerWidth - usedW) / 240)
  return Math.max(2, Math.min(8, maxByH, maxByW))
}

export function useGbaScale(hasRom: boolean): number {
  const [scale, setScale] = useState(() => computeScale(hasRom))

  useEffect(() => {
    const update = () => setScale(computeScale(hasRom))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [hasRom])

  return scale
}
