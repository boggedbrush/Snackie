type ComboItem = {
  baseName?: string
  addNames?: string[]
  baseImageUrl?: string
  addImageUrl?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
}

export default function ComboPair({ item, onSwap, onDetails, onSwapBase, onSwapAdd }: { item: ComboItem, onSwap?: () => void, onDetails?: () => void, onSwapBase?: () => void, onSwapAdd?: () => void }) {
  const base = item.baseName || 'Base'
  const add = (item.addNames && item.addNames[0]) || 'Add-on'
  return (
    <div className="border rounded p-3 bg-yellow-50 border-yellow-300">
      <div className="grid grid-cols-3 gap-3 items-center">
        <div className="space-y-2">
          <MiniCard name={base} imageUrl={item.baseImageUrl} />
          {onSwapBase && (
            <button onClick={onSwapBase} className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-yellow-50">Swap base</button>
          )}
        </div>
        <div className="flex items-center justify-center text-yellow-700 font-bold select-none" aria-hidden>+</div>
        <div className="space-y-2">
          <MiniCard name={add} imageUrl={item.addImageUrl} />
          {onSwapAdd && (
            <button onClick={onSwapAdd} className="text-xs px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-yellow-50">Swap add-on</button>
          )}
        </div>
      </div>
      <p className="mt-2 text-sm text-slate-700">{nutrString(item)}</p>
      <div className="flex items-center gap-2 justify-end mt-3">
        {onSwap && (
          <button onClick={onSwap} className="text-sm px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-yellow-50">Swap combo</button>
        )}
        {onDetails && (
          <button onClick={onDetails} className="text-sm px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-yellow-50">Details</button>
        )}
      </div>
    </div>
  )
}

function MiniCard({ name, imageUrl }: { name: string, imageUrl?: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-16 h-16 rounded overflow-hidden ring-1 ring-slate-200 bg-slate-100 ring-banana-soft">
        {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
      </div>
      <div className="font-medium leading-tight text-slate-900">{name}</div>
    </div>
  )
}

function nutrString(i: { calories?: number; protein?: number; carbs?: number; fat?: number }) {
  const parts: string[] = []
  if (typeof i.calories === 'number') parts.push(`${i.calories} kcal`)
  if (typeof i.protein === 'number') parts.push(`${i.protein} g protein`)
  if (typeof i.carbs === 'number') parts.push(`${i.carbs} g carbs`)
  if (typeof i.fat === 'number') parts.push(`${i.fat} g fat`)
  return parts.join(' · ') || ''
}
