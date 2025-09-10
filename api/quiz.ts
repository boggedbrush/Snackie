import { computeSnackWindows } from '../src/lib/recommendation'
import { saveSession } from './_store'
import { imageFor } from './_images'
import { byPreference, CatalogSnack } from './_catalog'

type QuizBody = {
  breakfastTime: string
  lunchTime: string
  dinnerTime: string
  preference: string
  restrictions?: string[]
}

function svgPlaceholder(label: string, bg = '#e2e8f0', fg = '#334155') {
  const text = encodeURIComponent(label)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>\n  <rect width='100%' height='100%' rx='8' ry='8' fill='${bg}'/>\n  <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,Segoe UI,Arial' font-size='14' fill='${fg}'>${text}</text>\n</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

function catalogForPref(pref: string): CatalogSnack[] {
  return byPreference(pref)
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { 'content-type': 'application/json' } })
  }
  const body = await req.json().catch(() => null) as QuizBody | null
  if (!body) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'content-type': 'application/json' } })
  }
  // Compute snack windows (Issue 3) and return demo items per window (Issue 4 placeholder)
  const sessionId = crypto.randomUUID()
  const createdAt = new Date().toISOString()
  const windows = computeSnackWindows(body.breakfastTime, body.lunchTime, body.dinnerTime)
  const baseItems = catalogForPref(body.preference)
  const restrictions = (body.restrictions || []).map((s: string) => s.toLowerCase())
  const filtered = baseItems.filter((it: any) => {
    const name = it.name.toLowerCase()
    const tags: string[] = Array.isArray(it.allergens) ? it.allergens : []
    return !restrictions.some(r => name.includes(r) || tags.includes(r))
  })
  const chosen = filtered.length ? filtered : baseItems
  const enriched = await Promise.all(chosen.map(async (it) => {
    const term = (it as any).imageSearch?.[0] || it.name
    const img = await imageFor(term)
    return { ...it, imageUrl: img?.imageUrl || svgPlaceholder(it.name), credit: img?.credit }
  }))
  // Build windows sequentially with uniqueness across windows and supplements
  const used = new Set<string>()
  async function buildItems(count: number): Promise<any[]> {
    const out: any[] = []
    for (const it of enriched) {
      const key = it.name.toLowerCase()
      if (used.has(key)) continue
      out.push(it)
      used.add(key)
      if (out.length >= count) break
    }
    if (out.length < count) {
      const pool = catalogForPref(body.preference)
      for (const s of pool) {
        const term = s.imageSearch?.[0] || s.name
        const key = s.name.toLowerCase()
        if (used.has(key)) continue
        if (body.restrictions?.some(r => key.includes(String(r).toLowerCase()) || (s.allergens||[]).map(a=>a.toLowerCase()).includes(String(r).toLowerCase()))) continue
        const img = await imageFor(term)
        out.push({ name: s.name, imageUrl: img?.imageUrl || svgPlaceholder(s.name), credit: img?.credit, calories: s.calories, protein: s.protein, carbs: s.carbs, fat: s.fat })
        used.add(key)
        if (out.length >= count) break
      }
    }
    return out
  }

  const recommendations: any[] = []
  for (const w of windows) {
    const items = await buildItems(4)
    recommendations.push({ time: w.time, items, rationale: 'Snack to bridge meal gap with your preference.' })
  }
  const payload = {
    sessionId,
    createdAt,
    quiz: body,
    recommendations
  }
  saveSession(payload)
  return new Response(JSON.stringify(payload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
