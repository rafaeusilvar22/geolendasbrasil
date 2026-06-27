import { put, del } from '@vercel/blob'
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts'

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

async function generateAudio(text: string): Promise<Buffer> {
  const tts = new MsEdgeTTS()
  await tts.setMetadata('pt-BR-FranciscaNeural', OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3)

  return new Promise((resolve, reject) => {
    const { audioStream } = tts.toStream(text)
    const chunks: Buffer[] = []
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk))
    audioStream.on('end', () => resolve(Buffer.concat(chunks)))
    audioStream.on('error', reject)
  })
}

export default async (req: Request) => {
  console.log(`[generate-audio] method=${req.method}`)

  if (req.method === 'DELETE') {
    let body: { audioUrl?: string }
    try { body = await req.json() } catch { body = {} }

    if (!body.audioUrl) {
      return new Response(JSON.stringify({ error: 'Missing audioUrl' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.VERCEL_BLOB_READ_WRITE_TOKEN
    if (!blobToken) throw new Error('BLOB_READ_WRITE_TOKEN não configurado')

    await del(body.audioUrl, { token: blobToken })
    console.log(`[Blob delete OK] ${body.audioUrl}`)
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  let body: { conteudo?: string; id?: string; tipo?: string }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const { conteudo, id, tipo } = body

  if (!conteudo || !id || !tipo) {
    return new Response(JSON.stringify({ error: 'Missing fields: conteudo, id, tipo' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const texto = stripHtml(conteudo)
  console.log(`[generate-audio] tipo=${tipo} id=${id} chars=${texto.length}`)

  try {
    const audioBuffer = await generateAudio(texto)
    console.log(`[MP3 gerado] ${audioBuffer.byteLength} bytes`)

    const blobToken = process.env.BLOB_READ_WRITE_TOKEN ?? process.env.VERCEL_BLOB_READ_WRITE_TOKEN
    if (!blobToken) throw new Error('BLOB_READ_WRITE_TOKEN não configurado no .env')

    const blob = await put(
      `geolegendas/${tipo}/${id}.mp3`,
      audioBuffer,
      { access: 'public', contentType: 'audio/mpeg', token: blobToken }
    )

    console.log(`[Blob upload OK] ${blob.url}`)

    return new Response(
      JSON.stringify({ success: true, audioUrl: blob.url, size: audioBuffer.byteLength }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[Erro na geração]', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
