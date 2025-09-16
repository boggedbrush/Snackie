import { FormEvent, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TimePicker, { isValidTime } from '../components/TimePicker'

export default function Quiz() {
  const [breakfastTime, setBreakfastTime] = useState('07:30')
  const [lunchTime, setLunchTime] = useState('12:30')
  const [dinnerTime, setDinnerTime] = useState('18:30')
  const [preference, setPreference] = useState('balanced')
  const [restrictions, setRestrictions] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const navigate = useNavigate()

  // Prefill from last quiz if present
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('snackie.lastQuiz')
      if (!raw) return
      const q = JSON.parse(raw)
      if (q.breakfastTime) setBreakfastTime(q.breakfastTime)
      if (q.lunchTime) setLunchTime(q.lunchTime)
      if (q.dinnerTime) setDinnerTime(q.dinnerTime)
      if (q.preference) setPreference(q.preference)
      if (Array.isArray(q.restrictions)) setRestrictions(q.restrictions.join(', '))
    } catch {}
  }, [])

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    const payload = {
      breakfastTime,
      lunchTime,
      dinnerTime,
      preference,
      restrictions: restrictions.split(',').map(s => s.trim()).filter(Boolean)
    }
    // Save for edit-prefill
    sessionStorage.setItem('snackie.lastQuiz', JSON.stringify(payload))
    // Submit to API and route to results by id
    let timeoutId: any
    try {
      const ctrl = new AbortController()
      timeoutId = setTimeout(() => ctrl.abort(), 20000)
      const res = await fetch('/api/quiz', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload), signal: ctrl.signal })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      try {
        const key = 'snackie.sessions'
        const list = JSON.parse(localStorage.getItem(key) || '[]')
        list.unshift(data)
        localStorage.setItem(key, JSON.stringify(list.slice(0, 10)))
      } catch {}
      navigate(`/results/${data.sessionId}`)
    } catch (err) {
      // Basic fallback: still navigate to results page which will try to load
      navigate('/results/failed')
    } finally {
      // Navigation will unmount this component; this is a safety reset.
      try { if (timeoutId) clearTimeout(timeoutId) } catch {}
      setSubmitting(false)
    }
  }

  const validTimes = isValidTime(breakfastTime) && isValidTime(lunchTime) && isValidTime(dinnerTime)
  const logicalOrder = useMemo(() => {
    // All times in minutes from midnight
    const toMin = (t: string) => {
      const [h, m] = t.split(':').map(Number); return h * 60 + m
    }
    if (!validTimes) return true
    const b = toMin(breakfastTime), l = toMin(lunchTime), d = toMin(dinnerTime)
    // Allow wrap-around but enforce reasonable order: breakfast <= lunch <= dinner within same day
    return b < l && l < d
  }, [breakfastTime, lunchTime, dinnerTime, validTimes])

  return (
    <section className="flex flex-col items-center py-6 px-4 w-full min-h-[calc(100vh-16rem)] justify-center">
      <form className="w-full max-w-2xl space-y-5 bg-white/70 backdrop-blur-sm rounded-xl border border-white/40 shadow-sm p-6" onSubmit={onSubmit} noValidate aria-busy={submitting}>
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold">Your routine</h1>
          <p className="text-sm text-slate-600">Set your mealtimes and preferences to personalize every snack window.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <TimePicker label="Breakfast" value={breakfastTime} onChange={setBreakfastTime} required />
          <TimePicker label="Lunch" value={lunchTime} onChange={setLunchTime} required />
          <TimePicker label="Dinner" value={dinnerTime} onChange={setDinnerTime} required />
        </div>
        {!logicalOrder && (
          <p className="text-sm text-amber-700">Please ensure breakfast &lt; lunch &lt; dinner times for best results.</p>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="preference" className="block text-sm font-medium mb-1">Preference</label>
            <select id="preference" value={preference} onChange={e => setPreference(e.target.value)} className="w-full border rounded px-3 py-2">
              <option value="balanced">Balanced</option>
              <option value="high-protein">High-protein</option>
              <option value="keto">Keto</option>
              <option value="low-carb">Low-carb</option>
            </select>
          </div>
          <div>
            <label htmlFor="restrictions" className="block text-sm font-medium mb-1">Restrictions (comma-separated)</label>
            <input id="restrictions" value={restrictions} onChange={e => setRestrictions(e.target.value)} placeholder="nuts, dairy" className="w-full border rounded px-3 py-2" />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            disabled={!validTimes || !logicalOrder || submitting}
            className="btn-banana disabled:opacity-50 px-6 py-3 rounded-md min-w-[14rem] text-base font-medium shadow-sm"
          >
            See my snacks
          </button>
        </div>
      </form>

      {submitting && (
        <div className="fixed inset-0 z-50 bg-white/80 backdrop-blur flex flex-col items-center justify-center text-center p-6" role="status" aria-live="polite">
          <div className="mb-3">
            <span className="banana-loader text-6xl" aria-hidden="true">
              <span className="banana-slice">🍌</span>
              <span className="banana-slice">🍌</span>
              <span className="banana-slice">🍌</span>
            </span>
          </div>
          <p className="text-slate-800 font-medium text-lg">Mixing up your snacks…</p>
          <p className="text-slate-600">This should only take a moment.</p>
        </div>
      )}
    </section>
  )
}
