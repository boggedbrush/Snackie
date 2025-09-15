const DEFAULT_CACHE_TTL = 300_000 // 5 minutes
let CACHE_TTL = DEFAULT_CACHE_TTL

export function setCacheTtl(ms: number) {
  const n = Number(ms)
  if (Number.isFinite(n) && n >= 0) CACHE_TTL = n
}

type Credit = {
  source: 'Wikimedia Commons' | 'Open Food Facts'
  title?: string
  pageUrl?: string
  author?: string
  license?: string
}

export type ImageResult = { imageUrl: string; credit: Credit } | null

const cache = new Map<string, { at: number; data: ImageResult }>()

export async function imageFor(term: string): Promise<ImageResult> {
  const key = term.toLowerCase().trim()
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && now - hit.at < CACHE_TTL) return hit.data

  let result = await fromWikimedia(term)
  if (!result) result = await fromOFF(term)

  cache.set(key, { at: now, data: result })
  return result
}

async function fromWikimedia(term: string): Promise<ImageResult> {
  const url = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=1&gsrsearch=${encodeURIComponent(
    term + ' food'
  )}&prop=imageinfo|info&iiprop=url|extmetadata&iiurlwidth=192&format=json&origin=*`
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = (await resp.json()) as any
    const pages = data?.query?.pages
    if (!pages) return null
    const first = Object.values(pages)[0] as any
    const ii = first?.imageinfo?.[0]
    if (!ii) return null
    const thumb = ii.thumburl || ii.url
    return {
      imageUrl: thumb,
      credit: {
        source: 'Wikimedia Commons',
        title: first?.title,
        pageUrl: first?.canonicalurl || ii?.descriptionshorturl,
        author: ii?.extmetadata?.Artist?.value,
        license: ii?.extmetadata?.LicenseShortName?.value,
      },
    }
  } catch {
    return null
  }
}

async function fromOFF(term: string): Promise<ImageResult> {
  const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
    term
  )}&search_simple=1&action=process&json=1&page_size=1`
  try {
    const resp = await fetch(url)
    if (!resp.ok) return null
    const data = (await resp.json()) as any
    const p = data?.products?.[0]
    if (!p) return null
    const img = p.image_front_small_url || p.image_url
    if (!img) return null
    return {
      imageUrl: img,
      credit: {
        source: 'Open Food Facts',
        title: p.product_name,
        pageUrl: p.url,
        author: p.photographers?.[0],
        license: 'ODBL',
      },
    }
  } catch {
    return null
  }
}
