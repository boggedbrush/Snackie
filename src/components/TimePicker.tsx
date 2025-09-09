import { useId } from 'react'

export type TimePickerProps = {
  label: string
  value: string
  onChange: (v: string) => void
  required?: boolean
}

export function isValidTime(hhmm: string): boolean {
  return /^\d{2}:\d{2}$/.test(hhmm) && (() => {
    const [h, m] = hhmm.split(':').map(Number)
    return h >= 0 && h < 24 && m >= 0 && m < 60
  })()
}

export default function TimePicker({ label, value, onChange, required }: TimePickerProps) {
  const id = useId()
  const ok = isValidTime(value)
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium mb-1">{label} time</label>
      <input
        id={id}
        type="time"
        className={`w-full border rounded px-3 py-2 ${ok ? '' : 'border-red-500'}`}
        value={value}
        onChange={e => onChange(e.target.value)}
        required={required}
        aria-invalid={!ok}
        aria-describedby={!ok ? id + '-err' : undefined}
      />
      {!ok && (
        <p id={id + '-err'} className="text-xs text-red-600 mt-1">Enter time as HH:mm (00:00–23:59).</p>
      )}
    </div>
  )
}

