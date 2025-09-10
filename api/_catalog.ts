import fs from 'fs'
import path from 'path'

export type CatalogSnack = {
  name: string
  typeTags: string[]
  allergens?: string[]
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  imageSearch?: string[]
}

let cache: CatalogSnack[] | null = null

export function loadCatalog(): CatalogSnack[] {
  if (cache) return cache
  const p = path.join(process.cwd(), 'data', 'snacks.json')
  const raw = fs.readFileSync(p, 'utf-8')
  cache = JSON.parse(raw)
  return cache!
}

export function byPreference(pref: string): CatalogSnack[] {
  const list = loadCatalog()
  if (pref === 'balanced') return list.filter(s => s.typeTags.includes('balanced'))
  return list.filter(s => s.typeTags.includes(pref))
}

export function search(term: string): CatalogSnack[] {
  const list = loadCatalog()
  const t = term.toLowerCase()
  return list.filter(s => s.name.toLowerCase().includes(t) || s.imageSearch?.some(q => q.toLowerCase().includes(t)))
}

