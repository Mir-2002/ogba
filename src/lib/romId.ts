export function getRomMeta(buffer: Uint8Array): { romId: string; romTitle: string } {
  const dec = new TextDecoder('ascii')
  const title = dec.decode(buffer.slice(0xA0, 0xAC)).replace(/\0/g, '').trim()
  const code  = dec.decode(buffer.slice(0xAC, 0xB0)).replace(/\0/g, '').trim()
  return { romId: `${title}-${code}`, romTitle: title }
}
