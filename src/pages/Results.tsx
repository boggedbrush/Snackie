import { Link } from 'react-router-dom'
import { useEffect, useMemo, useState } from 'react'
import { to12Hour } from '../lib/format'
import SnackCard from '../components/SnackCard'

export default function Results() {
  const quizRaw = sessionStorage.getItem('snackie.lastQuiz')
  const quiz = useMemo(() => (quizRaw ? JSON.parse(quizRaw) : null), [quizRaw])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any | null>(null)

  useEffect(() => {
    if (!quizRaw || !quiz) return
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(quiz)
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        setData(json)
        try {
          const key = 'snackie.sessions'
          const list = JSON.parse(localStorage.getItem(key) || '[]')
          list.unshift(json)
          localStorage.setItem(key, JSON.stringify(list.slice(0, 10)))
        } catch {}
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [quizRaw])

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Your snack plan</h1>
      {!quiz && (
        <div className="p-4 border rounded bg-white">
          <p className="mb-2">No quiz data found.</p>
          <Link className="text-emerald-700 underline" to="/quiz">Take the quiz</Link>
        </div>
      )}
      {quiz && (
        <div className="space-y-3">
          {loading && <p aria-live="polite">Loading recommendations…</p>}
          {error && <p className="text-red-600">Error: {error}</p>}
          {data && (
            <>
              <p className="text-slate-700">Preference: <span className="font-medium">{quiz.preference}</span></p>
              <div className="space-y-4">
                {data.recommendations.map((rec: any, idx: number) => (
                  <div key={idx} className="p-4 border rounded bg-white">
                    <h2 className="font-medium mb-1">{to12Hour(rec.time)}</h2>
                    <p className="text-sm text-slate-700">{rec.rationale}</p>
                    <div className="mt-2 grid gap-3 sm:grid-cols-2">
                      {rec.items.slice(0, 4).map((it: any, i: number) => (
                        <SnackCard key={i} item={it} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <ShareControls sessionId={data.sessionId} />
            </>
          )}
        </div>
      )}
    </section>
  )
}

// Item card rendered inline with SnackCard

function ShareControls({ sessionId }: { sessionId: string }) {
  const url = `${location.origin}/s/${sessionId}`
  const copy = async () => {
    try { await navigator.clipboard.writeText(url) } catch {}
  }
  return (
    <div className="mt-2">
      <label htmlFor="share-url" className="block text-sm font-medium mb-1">Share link</label>
      <div className="flex items-center gap-2">
        <input id="share-url" className="flex-1 border rounded px-3 py-2" value={url} readOnly />
        <button onClick={copy} className="bg-emerald-600 text-white px-3 py-2 rounded-md">Copy link</button>
      </div>
    </div>
  )}
