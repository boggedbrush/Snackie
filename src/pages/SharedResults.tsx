import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import SnackCard from '../components/SnackCard'
import { to12Hour } from '../lib/format'

export default function SharedResults() {
  const { sessionId = '' } = useParams()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch(`/api/session/${sessionId}`)
        if (res.ok) {
          setData(await res.json())
        } else {
          // Fallback to localStorage
          const list = JSON.parse(localStorage.getItem('snackie.sessions') || '[]')
          const found = list.find((s: any) => s.sessionId === sessionId)
          if (found) setData(found)
          else setError('Session not found')
        }
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [sessionId])

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Shared results</h1>
      {loading && <p aria-live="polite">Loading…</p>}
      {error && <p className="text-red-600">Error: {error}</p>}
      {data && (
        <div className="space-y-3">
          <p className="text-slate-700">Preference: <span className="font-medium">{data.quiz?.preference}</span></p>
          <div className="space-y-4">
            {data.recommendations?.map((rec: any, idx: number) => (
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
        </div>
      )}
    </section>
  )
}
