function svgPlaceholder(label: string, bg = '#e2e8f0', fg = '#334155') {
  const text = encodeURIComponent(label)
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='96' height='96'>\n  <rect width='100%' height='100%' rx='8' ry='8' fill='${bg}'/>\n  <text x='50%' y='52%' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,Segoe UI,Arial' font-size='14' fill='${fg}'>${text}</text>\n</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

import { imageFor } from './_images'
import { generateSnacks } from './_compose'

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

  const combineParam = (searchParams.get('combine') || '').toLowerCase()
  const wantCombos = combineParam === 'true' || combineParam === 'combo'
  const lockBaseName = searchParams.get('base') || undefined
  const lockAddName = searchParams.get('addon') || searchParams.get('add') || undefined
  const sideOnly = (searchParams.get('side') || '').toLowerCase() === 'true'
  const gen = await generateSnacks({
    preference: type,
    restrictions,
    limit: limit * 2,
    seed: String(Date.now()),
    exclude: excludes,
    combine: wantCombos,
    minAdds: 1,
    maxAdds: 1,
    allowBases: !wantCombos && true,
    lockBaseName,
    lockAddName,
    sideOnly: !wantCombos && sideOnly,
  })

  const results = await Promise.all(
    gen.slice(0, limit).map(async (s) => {
      const main = await imageFor(s.imageSearch)
      let baseImageUrl: string | undefined
      let addImageUrl: string | undefined
      if (s.isCombo) {
        if (s.baseName) baseImageUrl = (await imageFor(s.baseName))?.imageUrl
        const add0 = Array.isArray((s as any).addNames) ? (s as any).addNames[0] : undefined
        if (add0) addImageUrl = (await imageFor(add0))?.imageUrl
      }
      return {
        name: s.name,
        sourceApiId: '',
        imageUrl: main?.imageUrl || svgPlaceholder(s.name),
        calories: s.calories,
        protein: s.protein,
        carbs: s.carbs,
        fat: s.fat,
        credit: main?.credit || undefined,
        isCombo: s.isCombo,
        baseName: (s as any).baseName,
        addNames: (s as any).addNames,
        baseImageUrl,
        addImageUrl,
      }
    })
  )

  return new Response(JSON.stringify({ items: results.slice(0, limit) }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

 
