// Raw byte gzip/gunzip. Kept separate from any serialization format so the
// upcoming mGBA WASM swap (which produces raw Uint8Array save states, no
// JSON step) can reuse these directly.

export async function gzipBytes(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new CompressionStream('gzip')
  const writer = stream.writable.getWriter()
  writer.write(data)
  writer.close()
  const buf = await new Response(stream.readable).arrayBuffer()
  return new Uint8Array(buf)
}

export async function gunzipBytes(data: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new DecompressionStream('gzip')
  const writer = stream.writable.getWriter()
  writer.write(data)
  writer.close()
  const buf = await new Response(stream.readable).arrayBuffer()
  return new Uint8Array(buf)
}
