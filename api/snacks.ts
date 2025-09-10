function svgPlaceholder(label: string, bg = '#e2e8f0', fg = '#334155') {
  const text = encodeURIComponent(label)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>\n  <rect width='100%' height='100%' rx='8' ry='8' fill='${bg}'/>\n  <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,Segoe UI,Arial' font-size='14' fill='${fg}'>${text}</text>\n</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

import { imageFor } from './_images'
import { byPreference, search, CatalogSnack } from './_catalog'

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const type = (searchParams.get('type') ?? 'balanced').toLowerCase()
  const q = searchParams.get('q')?.trim()
  const limit = Math.min(Math.max(Number(searchParams.get('limit') ?? '4'), 1), 10)
  const excludes = (searchParams.get('exclude') || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  const restrictions = (searchParams.get('restrictions') || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)

  const base: CatalogSnack[] = q ? search(q) : byPreference(type)
  const items = base
    .filter(s => {
      const n = s.name.toLowerCase()
      if (excludes.some(x => n.includes(x))) return false
      const allergens = (s.allergens || []).map(a => a.toLowerCase())
      if (restrictions.some(r => n.includes(r) || allergens.includes(r))) return false
      return true
    })
    .slice(0, Math.max(limit * 3, limit))

  const results = await Promise.all(
    items.map(async (s) => {
      const term = s.imageSearch?.[0] || s.name
      const img = await imageFor(term)
      return {
        name: s.name,
        sourceApiId: '',
        imageUrl: img?.imageUrl || svgPlaceholder(s.name),
        calories: s.calories,
        protein: s.protein,
        carbs: s.carbs,
        fat: s.fat,
        credit: img?.credit || undefined,
      }
    })
  )

  return new Response(JSON.stringify({ items: results.slice(0, limit) }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

 
