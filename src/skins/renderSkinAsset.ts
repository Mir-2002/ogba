import type { DeltaSkin, SkinRepresentation } from './deltaSkin'

const cache = new Map<string, Promise<string>>()

// Rasterizing a vector skin PDF takes seconds on a phone, so finished renders
// are also kept in Cache Storage and reused on later visits. Best effort:
// any failure just means rendering again.
const RENDER_CACHE = 'ogba-skin-renders'

async function cachedRender(key: string, render: () => Promise<Blob>): Promise<Blob> {
  const url = `/__skin-render/${encodeURIComponent(key)}`
  try {
    const hit = await (await caches.open(RENDER_CACHE)).match(url)
    if (hit) return await hit.blob()
  } catch { /* Cache Storage unavailable */ }

  const blob = await render()
  try {
    await (await caches.open(RENDER_CACHE)).put(url, new Response(blob, { headers: { 'Content-Type': 'image/png' } }))
  } catch { /* quota or unavailable — fine */ }
  return blob
}

function pickAssetFile(rep: SkinRepresentation): string | null {
  const { resizable, small, medium, large } = rep.assets
  if (resizable) return resizable
  const dpr = window.devicePixelRatio || 1
  return (dpr >= 3 ? large ?? medium : dpr >= 2 ? medium ?? large : small ?? medium) ?? small ?? medium ?? large ?? null
}

// pdf.js is ~1 MB, so it's only fetched for skins that ship PDF artwork
// (most Delta skins do — PDFs stay crisp at any device resolution).
async function renderPdf(bytes: Uint8Array, pixelWidth: number): Promise<Blob> {
  const [pdfjs, { default: workerSrc }] = await Promise.all([
    import('pdfjs-dist'),
    import('pdfjs-dist/build/pdf.worker.min.mjs?url'),
  ])
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc

  // pdf.js takes ownership of (detaches) the buffer it's handed, so copy.
  const task = pdfjs.getDocument({ data: bytes.slice() })
  const pdf  = await task.promise
  const page = await pdf.getPage(1)
  const viewport = page.getViewport({ scale: pixelWidth / page.getViewport({ scale: 1 }).width })

  const canvas = document.createElement('canvas')
  canvas.width  = Math.round(viewport.width)
  canvas.height = Math.round(viewport.height)
  // Translucent (overlay) skins need real transparency, but pdf.js defaults
  // to an opaque { alpha: false } context and paints a white page, either of
  // which would hide the game screen underneath. Supply our own context.
  const canvasContext = canvas.getContext('2d', { alpha: true })
  if (!canvasContext) throw new Error('Canvas 2D is unavailable')
  await page.render({ canvas, canvasContext, viewport, background: 'rgba(0, 0, 0, 0)' }).promise
  await task.destroy()

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Failed to rasterize skin'))), 'image/png')
  })
}

// Returns an object URL for the representation's artwork, rasterized at
// `pixelWidth` device pixels for PDFs. Results are memoized per size.
export function renderSkinAsset(skin: DeltaSkin, rep: SkinRepresentation, pixelWidth: number): Promise<string> {
  const file = pickAssetFile(rep)
  if (!file) return Promise.reject(new Error('Skin has no artwork for this layout'))

  const isPdf = file.toLowerCase().endsWith('.pdf')
  const bytes = skin.files[file]
  if (!bytes) return Promise.reject(new Error(`Skin is missing ${file}`))

  // Byte length stands in for a version, so a re-imported skin with the same
  // identifier but new artwork doesn't reuse a stale render.
  const key = `${skin.identifier}|${file}|${bytes.byteLength}|${isPdf ? Math.round(pixelWidth) : ''}`
  let url = cache.get(key)
  if (!url) {
    url = (isPdf
      ? cachedRender(key, () => renderPdf(bytes, pixelWidth))
      : Promise.resolve(new Blob([bytes.slice()], { type: 'image/png' })))
      .then((blob) => URL.createObjectURL(blob))
    url.catch(() => cache.delete(key))
    cache.set(key, url)
  }
  return url
}
