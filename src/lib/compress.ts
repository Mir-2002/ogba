export async function compressToBase64(obj: unknown): Promise<string> {
  const json    = JSON.stringify(obj)
  const encoded = new TextEncoder().encode(json)
  const stream  = new CompressionStream('gzip')
  const writer  = stream.writable.getWriter()
  writer.write(encoded)
  writer.close()
  const buf  = await new Response(stream.readable).arrayBuffer()
  const arr  = new Uint8Array(buf)
  let binary = ''
  arr.forEach(b => (binary += String.fromCharCode(b)))
  return btoa(binary)
}

export async function decompressFromBase64(b64: string): Promise<unknown> {
  const binary = atob(b64)
  const arr    = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i)
  const stream = new DecompressionStream('gzip')
  const writer = stream.writable.getWriter()
  writer.write(arr)
  writer.close()
  const json = await new Response(stream.readable).text()
  return JSON.parse(json)
}
