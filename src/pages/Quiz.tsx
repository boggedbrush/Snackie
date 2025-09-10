import { FormEvent, useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TimePicker, { isValidTime } from '../components/TimePicker'

export default function Quiz() {
  const [breakfastTime, setBreakfastTime] = useState('07:30')
  const [lunchTime, setLunchTime] = useState('12:30')
  const [dinnerTime, setDinnerTime] = useState('18:30')
  const [preference, setPreference] = useState('balanced')
  const [restrictions, setRestrictions] = useState('')
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
    try {
      const res = await fetch('/api/quiz', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) })
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
    <form className="space-y-4" onSubmit={onSubmit} noValidate>
      <h1 className="text-2xl font-semibold">Your routine</h1>
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
      <button type="submit" disabled={!validTimes || !logicalOrder} className="bg-slate-900 disabled:opacity-50 text-white px-4 py-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">See my snacks</button>
    </form>
  )
}
