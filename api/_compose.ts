import componentsData from '../data/components.json'
import rulesData from '../data/combo_rules.json'

export type Component = {
  name: string
  category: string
  isBase?: boolean
  typeTags?: string[]
  allergens?: string[]
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  imageSearch?: string[]
}

let componentsCache: Component[] | null = null
let rulesCache: Record<string, string[]> | null = null

function loadComponents(): Component[] {
  if (!componentsCache) {
    componentsCache = (componentsData as any as Component[])
  }
  return componentsCache!
}

function loadRules(): Record<string, string[]> {
  if (!rulesCache) {
    rulesCache = (rulesData as any as Record<string, string[]>)
  }
  return rulesCache!
}

function mulberry32(seed: number) {
  let t = seed >>> 0
  return function () {
    t += 0x6D2B79F5
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r)
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

function hashSeed(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export type GeneratedSnack = {
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  allergens: string[]
  imageSearch: string
  isCombo: boolean
  baseName?: string
  baseCategory?: string
  addNames?: string[]
}

export async function generateSnacks({
  preference = 'balanced',
  restrictions = [],
  limit = 4,
  seed = Date.now().toString(),
  exclude = [],
  combine = true,
  minAdds = 1,
  maxAdds = 2,
  allowBases = true,
  lockBaseName,
  lockAddName,
  sideOnly,
  excludeAddNames = [],
}: {
  preference?: string
  restrictions?: string[]
  limit?: number
  seed?: string
  exclude?: string[]
  combine?: boolean
  minAdds?: number
  maxAdds?: number
  allowBases?: boolean
  lockBaseName?: string
  lockAddName?: string
  sideOnly?: boolean
  excludeAddNames?: string[]
}): Promise<GeneratedSnack[]> {
  const comps = loadComponents()
  const rules = loadRules()
  const rng = mulberry32(hashSeed(seed))
  const lowerRestr = restrictions.map(s => s.toLowerCase())
  const excludeSet = new Set(exclude.map(s => s.toLowerCase()))

  const eligible = comps.filter(c => preference === 'balanced' || c.typeTags?.includes(preference))
  const bases = eligible.filter(c => c.isBase)
  // Add-ons must be explicit add.* categories — exclude sides from being used as add-ons
  const adds = eligible.filter(c => !c.isBase && (c.category || '').startsWith('add.'))

  const out: GeneratedSnack[] = []
  const used = new Set<string>()
  const usedAddNames = new Set<string>()
  const excludeAddSet = new Set(excludeAddNames.map(s => s.toLowerCase()))

  function pick<T>(arr: T[]): T | null {
    if (arr.length === 0) return null
    const idx = Math.floor(rng() * arr.length)
    return arr[idx]
  }

  if (!combine) {
    // Atomic items only; pick from eligible components
    let pool = eligible.filter(c => {
      const name = (c.name || '').toLowerCase()
      const allergens = (c.allergens || []).map(x => x.toLowerCase())
      return !lowerRestr.some(r => name.includes(r) || allergens.includes(r))
    })
    if (!allowBases) pool = pool.filter(c => !c.isBase)
    if (sideOnly) pool = pool.filter(c => (c.category || '').startsWith('side.'))
    const shuffled = pool.slice().sort(() => rng() - 0.5)
    for (const c of shuffled) {
      const key = c.name.toLowerCase()
      if (used.has(key) || excludeSet.has(key)) continue
      out.push({
        name: c.name,
        calories: c.calories || 0,
        protein: c.protein || 0,
        carbs: c.carbs || 0,
        fat: c.fat || 0,
        allergens: (c.allergens || []).slice(),
        imageSearch: c.imageSearch?.[0] || c.name,
        isCombo: false,
        baseName: undefined,
        baseCategory: undefined,
        addNames: undefined,
      })
      used.add(key)
      if (out.length >= limit) break
    }
    return out
  }

  while (out.length < limit && bases.length) {
    const base = pick(bases)!
    const allowedCats = rules[base.category] || []
    const candidates = adds.filter(a => allowedCats.includes(a.category))
      .filter(a => {
        const name = (a.name || '').toLowerCase()
        const allergens = (a.allergens || []).map(x => x.toLowerCase())
        return !lowerRestr.some(r => name.includes(r) || allergens.includes(r))
      })
      .filter(a => !excludeAddSet.has((a.name || '').toLowerCase()))
    const addCount = Math.max(minAdds, Math.min(maxAdds, 1 + Math.floor(rng() * (maxAdds - minAdds + 1))))
    const picks: Component[] = []
    const pool = candidates.slice()
    while (picks.length < addCount && pool.length) {
      const p = pool.splice(Math.floor(rng() * pool.length), 1)[0]
      // Avoid duplicate add-ons within a single generation call
      if (!usedAddNames.has((p.name || '').toLowerCase())) {
        picks.push(p)
      }
    }
    const name = buildName(base, picks)
    const key = name.toLowerCase()
    const allAllergens = [...new Set([...(base.allergens || []), ...picks.flatMap(p => p.allergens || [])])]
    if (used.has(key) || excludeSet.has(key) || lowerRestr.some(r => key.includes(r) || allAllergens.map(a=>a.toLowerCase()).includes(r))) {
      continue
    }
    const macros = sumMacros([base, ...picks])
    const imgTerm = [base.imageSearch?.[0] || base.name, picks[0]?.name].filter(Boolean).join(' ')
    out.push({ name, ...macros, allergens: allAllergens, imageSearch: imgTerm, isCombo: true, baseName: base.name, baseCategory: base.category, addNames: picks.map(p => p.name) })
    used.add(key)
    for (const p of picks) usedAddNames.add((p.name || '').toLowerCase())
  }

  // If combine with locks requested but loop above returned empty (e.g., due to pick randomness),
  // try again honoring locks deterministically.
  if (combine && (lockBaseName || lockAddName) && out.length < limit) {
    const rulesMap = rules
    const allBases = bases
    const allAdds = adds
    const lockedBase = lockBaseName ? allBases.find(b => b.name.toLowerCase() === lockBaseName!.toLowerCase()) : undefined
    const lockedAdd = lockAddName ? allAdds.find(a => a.name.toLowerCase() === lockAddName!.toLowerCase()) : undefined

    let baseCandidates: Component[] = []
    let addCandidates: Component[] = []

    if (lockedBase) {
      baseCandidates = [lockedBase]
      const allowedCats = rulesMap[lockedBase.category] || []
      addCandidates = allAdds.filter(a => allowedCats.includes(a.category))
    } else if (lockedAdd) {
      // find bases that allow the add's category
      const addCat = lockedAdd.category
      baseCandidates = allBases.filter(b => (rulesMap[b.category] || []).includes(addCat))
      addCandidates = [lockedAdd]
    }

    // fallback to eligible if not found
    if (baseCandidates.length === 0) baseCandidates = allBases
    if (addCandidates.length === 0) addCandidates = allAdds

    const shuffledBases = baseCandidates.slice().sort(() => rng() - 0.5)
    const shuffledAdds = addCandidates.slice().sort(() => rng() - 0.5)

    for (const b of shuffledBases) {
      const allowedCats = rulesMap[b.category] || []
      for (const a of shuffledAdds) {
        if (!allowedCats.includes(a.category)) continue
        if (excludeAddSet.has((a.name || '').toLowerCase()) || usedAddNames.has((a.name || '').toLowerCase())) continue
        const keyName = buildName(b, [a])
        const key = keyName.toLowerCase()
        const allAllergens = [...new Set([...(b.allergens || []), ...(a.allergens || [])])]
        const blocked = lowerRestr.some(r => key.includes(r) || allAllergens.map(x => x.toLowerCase()).includes(r))
        if (blocked || used.has(key) || excludeSet.has(key)) continue
        const macros = sumMacros([b, a])
        const imgTerm = [b.imageSearch?.[0] || b.name, a.name].join(' ')
        out.push({ name: keyName, ...macros, allergens: allAllergens, imageSearch: imgTerm, isCombo: true, baseName: b.name, baseCategory: b.category, addNames: [a.name] })
        used.add(key)
        usedAddNames.add((a.name || '').toLowerCase())
        if (out.length >= limit) break
      }
      if (out.length >= limit) break
    }
  }

  return out
}

function sumMacros(items: Component[]) {
  const total = { calories: 0, protein: 0, carbs: 0, fat: 0 }
  for (const it of items) {
    total.calories += it.calories || 0
    total.protein += it.protein || 0
    total.carbs += it.carbs || 0
    total.fat += it.fat || 0
  }
  return total
}

function buildName(base: Component, adds: Component[]): string {
  if (adds.length === 0) return base.name
  const addNames = adds.map(a => a.name)
  if (addNames.length === 1) return `${base.name} with ${addNames[0]}`
  return `${base.name} with ${addNames.slice(0, -1).join(', ')} and ${addNames[addNames.length - 1]}`
}
