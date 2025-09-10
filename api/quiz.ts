import { computeSnackWindows } from '../src/lib/recommendation'
import { saveSession } from './_store'
import { imageFor } from './_images'

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

function demoSnacks(preference: string) {
  const base = [
    { name: 'Greek Yogurt', imageUrl: svgPlaceholder('Yogurt'), calories: 120, protein: 15, carbs: 8, fat: 3, typeTags: ['high-protein', 'balanced'], allergens: ['dairy'] },
    { name: 'Almonds', imageUrl: svgPlaceholder('Almonds'), calories: 160, protein: 6, carbs: 6, fat: 14, typeTags: ['keto', 'low-carb', 'balanced'], allergens: ['nuts'] },
    { name: 'Apple + PB', imageUrl: svgPlaceholder('Apple+PB'), calories: 190, protein: 7, carbs: 22, fat: 8, typeTags: ['balanced'], allergens: ['nuts'] },
    { name: 'Cottage Cheese', imageUrl: svgPlaceholder('Cottage'), calories: 110, protein: 13, carbs: 5, fat: 5, typeTags: ['high-protein', 'low-carb'], allergens: ['dairy'] },
    { name: 'Cheese + Turkey Roll', imageUrl: svgPlaceholder('Roll'), calories: 180, protein: 14, carbs: 2, fat: 12, typeTags: ['keto', 'low-carb', 'high-protein'], allergens: ['dairy'] },
  ]
  return base.filter(x => preference === 'balanced' || x.typeTags?.includes(preference)).slice(0, 5)
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
  const baseItems = demoSnacks(body.preference)
  const restrictions = (body.restrictions || []).map((s: string) => s.toLowerCase())
  const filtered = baseItems.filter((it: any) => {
    const name = it.name.toLowerCase()
    const tags: string[] = Array.isArray(it.allergens) ? it.allergens : []
    return !restrictions.some(r => name.includes(r) || tags.includes(r))
  })
  const chosen = filtered.length ? filtered : baseItems
  const NAME_TO_QUERIES: Record<string, string[]> = {
    'Apple + PB': ['apple with peanut butter', 'apple peanut butter slices'],
    'Cheese + Turkey Roll': [
      'turkey and cheese roll-up',
      'turkey cheese pinwheels',
      'turkey and cheese roll ups'
    ]
  }
  const enriched = await Promise.all(chosen.map(async (it) => {
    const overrides = NAME_TO_QUERIES[it.name]
    let img = null
    if (overrides && overrides.length) {
      for (const q of overrides) {
        img = await imageFor(q)
        if (img) break
      }
    }
    if (!img) {
      img = await imageFor(it.name)
    }
    return { ...it, imageUrl: img?.imageUrl || it.imageUrl, credit: img?.credit }
  }))
  const recommendations = windows.map(w => ({
    time: w.time,
    items: enriched,
    rationale: 'Snack to bridge meal gap with your preference.'
  }))
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
