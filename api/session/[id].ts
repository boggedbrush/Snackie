import { getSession } from '../_store'

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const id = url.pathname.split('/').pop() || ''
  const session = getSession(id)
  if (!session) {
    return new Response(JSON.stringify({ error: `Session ${id} not found` }), {
      status: 404,
      headers: { 'content-type': 'application/json' },
    })
  }
  return new Response(JSON.stringify(session), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
