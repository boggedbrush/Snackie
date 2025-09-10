import { useState } from 'react'

export type SnackItem = {
  name: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  imageUrl?: string
  credit?: {
    source?: string
    title?: string
    pageUrl?: string
    author?: string
    license?: string
  }
}

export default function SnackCard({ item, onSwap }: { item: SnackItem, onSwap?: () => Promise<void> | void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="border rounded p-3 bg-white">
      <div className="flex items-start gap-3">
        <button
          type="button"
          aria-label={`View details for ${item.name}`}
          onClick={() => setOpen(true)}
          className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 rounded"
        >
          <div className="w-16 h-16 rounded overflow-hidden ring-1 ring-slate-200 bg-slate-100">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full" />
            )}
          </div>
        </button>
        <div className="flex-1">
          <div className="font-medium leading-tight">{prettyName(item.name)}</div>
          <div className="text-xs text-slate-600 leading-snug">
            {nutrString(item)}
          </div>
        </div>
        <div className="flex items-center gap-3">
          {onSwap && (
            <button
              onClick={() => onSwap()}
              className="text-sm px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
            >Swap</button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="text-sm px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
          >Details</button>
        </div>
      </div>
      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 bg-black/40 flex items-center justify-center p-4" onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}>
          <div className="bg-white rounded p-4 max-w-sm w-full">
            <h3 className="font-semibold mb-2">{item.name}</h3>
            {item.imageUrl && (
              <img src={item.imageUrl} alt="" className="w-full h-48 object-cover rounded mb-3 ring-1 ring-slate-200" />
            )}
            <p className="text-sm text-slate-700">{nutrString(item)}</p>
            {item.credit && (
              <p className="mt-2 text-[11px] text-slate-500">
                Image: {item.credit.source}
                {item.credit.author ? ` · ${stripHtml(item.credit.author)}` : ''}
                {item.credit.license ? ` · ${item.credit.license}` : ''}
                {item.credit.pageUrl ? (
                  <> · <a className="underline" href={item.credit.pageUrl} target="_blank" rel="noreferrer">source</a></>
                ) : null}
              </p>
            )}
            <div className="mt-4 text-right">
              <button onClick={() => setOpen(false)} className="px-3 py-1 rounded bg-slate-900 text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function nutrString(i: SnackItem) {
  const parts = [] as string[]
  if (typeof i.calories === 'number') parts.push(`${i.calories} kcal`)
  if (typeof i.protein === 'number') parts.push(`${i.protein} g protein`)
  if (typeof i.carbs === 'number') parts.push(`${i.carbs} g carbs`)
  if (typeof i.fat === 'number') parts.push(`${i.fat} g fat`)
  return parts.join(' · ') || 'Nutrition details pending'
}

function stripHtml(input?: string) {
  if (!input) return ''
  return input.replace(/<[^>]*>/g, '')
}

function prettyName(name: string) {
  if (name.toLowerCase() === 'apple + pb' || name.toLowerCase() === 'apple peanut butter') return 'Apple Peanut Butter'
  return name
}
