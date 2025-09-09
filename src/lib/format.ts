export function to12Hour(hhmm: string): string {
  const [hStr, mStr] = hhmm.split(':')
  let h = Number(hStr)
  const m = Number(mStr)
  const am = h < 12
  h = h % 12
  if (h === 0) h = 12
  const mm = String(m).padStart(2, '0')
  return `${h}:${mm} ${am ? 'AM' : 'PM'}`
}

