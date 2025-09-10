export type QuizPayload = {
  breakfastTime: string
  lunchTime: string
  dinnerTime: string
  preference: string
  restrictions?: string[]
}

export type SnackWindow = { time: string }

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return (h * 60 + m) % (24 * 60)
}

function fromMinutes(min: number): string {
  const m = ((min % (24 * 60)) + (24 * 60)) % (24 * 60)
  const h = Math.floor(m / 60)
  const mm = m % 60
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
}

export function minutesBetween(a: string, b: string): number {
  const am = toMinutes(a)
  const bm = toMinutes(b)
  const diff = bm - am
  return diff >= 0 ? diff : diff + 24 * 60
}

export function midpoint(a: string, b: string): string {
  const am = toMinutes(a)
  const gap = minutesBetween(a, b)
  const mid = am + Math.floor(gap / 2)
  return fromMinutes(mid)
}

export function computeSnackWindows(breakfast: string, lunch: string, dinner: string): SnackWindow[] {
  const pairs: [string, string][] = [
    [breakfast, lunch],
    [lunch, dinner],
  ]
  const windows: SnackWindow[] = []
  for (const [a, b] of pairs) {
    const gap = minutesBetween(a, b)
    if (gap >= 180) {
      windows.push({ time: midpoint(a, b) })
    }
  }
  return windows
}

export type SnackItem = {
  name: string
  sourceApiId?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  typeTags?: string[]
}

export function scoreItem(item: SnackItem, preference: string): number {
  let score = 0
  if (item.typeTags?.includes(preference)) score += 3
  if (preference === 'high-protein' && item.protein && item.calories) {
    score += 2 * (item.protein / Math.max(100, item.calories)) * 100 // approx per 100 kcal
  }
  if ((preference === 'keto' || preference === 'low-carb') && typeof item.carbs === 'number') {
    score += Math.max(0, 20 - item.carbs) / 10
  }
  return score
}
