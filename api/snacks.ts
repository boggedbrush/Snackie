function svgPlaceholder(label: string, bg = '#e2e8f0', fg = '#334155') {
  const text = encodeURIComponent(label)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>\n  <rect width='100%' height='100%' rx='8' ry='8' fill='${bg}'/>\n  <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,Segoe UI,Arial' font-size='14' fill='${fg}'>${text}</text>\n</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

import { imageFor } from './_images'

const PREF_TERMS: Record<string, string[]> = {
  'high-protein': ['Greek yogurt', 'cottage cheese', 'turkey roll', 'edamame'],
  keto: ['cheese', 'almonds', 'avocado snack', 'beef jerky'],
  'low-carb': ['nuts mix', 'celery and peanut butter', 'cheese sticks', 'boiled eggs'],
  balanced: ['apple peanut butter', 'granola bar', 'hummus and veggies', 'trail mix']
}

export default async function handler(req: Request): Promise<Response> {
  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') ?? 'balanced'
  const q = searchParams.get('q')?.trim()
  const limit = Math.min(Number(searchParams.get('limit') ?? '4'), 10)

  const terms = q ? [q] : (PREF_TERMS[type] || PREF_TERMS['balanced']).slice(0, limit)

  const results = await Promise.all(
    terms.map(async (term) => {
      const img = await imageFor(term)
      return {
        name: term,
        sourceApiId: '',
        imageUrl: img?.imageUrl || svgPlaceholder(term),
        credit: img?.credit || undefined,
      }
    })
  )

  return new Response(JSON.stringify({ items: results.slice(0, limit) }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}
