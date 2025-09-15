import { computeSnackWindows } from '../src/lib/recommendation'
import { saveSession } from './_store'
import { imageFor } from './_images'
import { generateSnacks } from './_compose'

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

// no-op: combos generated dynamically

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
  const restrictions = body.restrictions || []
  // Pre-generate pools to ensure we have enough unique items
  const combosPool = await generateSnacks({ preference: body.preference, restrictions, limit: 6, seed: sessionId + ':combo', combine: true, minAdds: 1, maxAdds: 1 })
  const singlesPool = await generateSnacks({ preference: body.preference, restrictions, limit: 10, seed: sessionId + ':single', combine: false, allowBases: false, sideOnly: true })
  async function enrich(list: any[]) {
    return Promise.all(list.map(async (it) => {
      const mainImg = await imageFor(it.imageSearch)
      let baseImageUrl: string | undefined
      let addImageUrl: string | undefined
      if (it.isCombo) {
        if (it.baseName) {
          const bi = await imageFor(it.baseName)
          baseImageUrl = bi?.imageUrl
        }
        const add0 = Array.isArray(it.addNames) ? it.addNames[0] : undefined
        if (add0) {
          const ai = await imageFor(add0)
          addImageUrl = ai?.imageUrl
        }
      }
      return {
        name: it.name,
        calories: it.calories,
        protein: it.protein,
        carbs: it.carbs,
        fat: it.fat,
        imageUrl: mainImg?.imageUrl || svgPlaceholder(it.name),
        credit: mainImg?.credit,
        isCombo: !!it.isCombo,
        baseName: it.baseName,
        baseCategory: it.baseCategory,
        addNames: it.addNames,
        baseImageUrl,
        addImageUrl,
      }
    }))
  }
  const combosEnriched = await enrich(combosPool)
  const singlesEnriched = await enrich(singlesPool)
  // Track uniqueness across all windows
  const used = new Set<string>()

  const recommendations: any[] = []
  // Prevent the same add-on from appearing more than once across the plan
  const usedAddonsGlobal = new Set<string>()
  for (const w of windows) {
    const items: any[] = []
    // two combos with distinct base categories within this window
    const usedBasesWindow = new Set<string>()
    const usedAddonsWindow = new Set<string>()
    for (const it of combosEnriched) {
      const key = it.name.toLowerCase()
      const baseCat = (it as any).baseCategory || ''
      const add0 = Array.isArray((it as any).addNames) ? ((it as any).addNames[0] || '').toLowerCase() : ''
      // Disallow duplicate add-ons globally and within this window
      if (
        used.has(key) ||
        (baseCat && usedBasesWindow.has(baseCat)) ||
        (add0 && (usedAddonsGlobal.has(add0) || usedAddonsWindow.has(add0)))
      ) continue
      items.push(it)
      used.add(key)
      if (baseCat) usedBasesWindow.add(baseCat)
      if (add0) { usedAddonsGlobal.add(add0); usedAddonsWindow.add(add0) }
      if (items.length >= 2) break
    }
    // two singles (non-bases)
    for (const it of singlesEnriched) {
      const key = it.name.toLowerCase()
      if (used.has(key)) continue
      items.push(it)
      used.add(key)
      if (items.length >= 4) break
    }
    // Fallback if not enough
    while (items.length < 4) {
      items.push(singlesEnriched.find(x => !used.has(x.name.toLowerCase())) || combosEnriched.find(x => !used.has(x.name.toLowerCase())) || combosEnriched[0])
      used.add(items[items.length - 1].name.toLowerCase())
    }
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
