import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { to12Hour } from '../lib/format'
import SnackCard from '../components/SnackCard'

export default function Results() {
  const { sessionId = '' } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<any | null>(null)
  const [windows, setWindows] = useState<any[]>([])

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/session/${sessionId}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
          setWindows(json.recommendations || [])
          return
        }
        const list = JSON.parse(localStorage.getItem('snackie.sessions') || '[]')
        const s = list.find((x: any) => x.sessionId === sessionId)
        if (s) { setData(s); setWindows(s.recommendations || []) }
        else setError('Session not found')
      } catch (e: any) {
        setError(e.message)
      } finally {
        setLoading(false)
      }
    }
    if (sessionId) run()
  }, [sessionId])

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Your snack plan</h1>
      <div className="space-y-3">
        {loading && <p aria-live="polite">Loading recommendations…</p>}
        {error && <p className="text-red-600">Error: {error}</p>}
        {data && (
          <>
            <div className="flex items-center justify-between">
              <p className="text-slate-700">Preference: <span className="font-medium">{data.quiz?.preference}</span></p>
              <button
                onClick={() => {
                  try { sessionStorage.setItem('snackie.lastQuiz', JSON.stringify(data.quiz)) } catch {}
                  navigate('/quiz')
                }}
                className="text-sm text-emerald-700 underline"
              >Edit answers</button>
            </div>
            <div className="space-y-4" aria-live="polite" aria-busy={loading}>
              {windows.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 border rounded bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">{to12Hour(rec.time)}</h2>
                    <button
                      className="text-sm px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600"
                      onClick={async () => {
                        const allNames = windows.flatMap((w: any) => w.items.map((it: any) => it.name))
                        const exclude = encodeURIComponent(allNames.join(','))
                        const restrictions = encodeURIComponent((data.quiz?.restrictions || []).join(','))
                        const pref = encodeURIComponent(data.quiz?.preference || 'balanced')
                        const res = await fetch(`/api/snacks?type=${pref}&limit=4&exclude=${exclude}&restrictions=${restrictions}`)
                        if (res.ok) {
                          const js = await res.json()
                          setWindows(prev => prev.map((r, i) => i === idx ? { ...r, items: js.items } : r))
                        }
                      }}
                    >Show alternatives</button>
                  </div>
                  <p className="text-sm text-slate-700">{rec.rationale}</p>
                  <div className="mt-2 grid gap-3 sm:grid-cols-2">
                    {rec.items.slice(0, 4).map((it: any, i: number) => (
                      <SnackCard
                        key={i}
                        item={it}
                        onSwap={async () => {
                          const allNames = windows.flatMap((w: any) => w.items.map((it: any) => it.name))
                          const exclude = encodeURIComponent(allNames.join(','))
                          const restrictions = encodeURIComponent((data.quiz?.restrictions || []).join(','))
                          const pref = encodeURIComponent(data.quiz?.preference || 'balanced')
                          const res = await fetch(`/api/snacks?type=${pref}&limit=1&exclude=${exclude}&restrictions=${restrictions}`)
                          if (res.ok) {
                            const js = await res.json()
                            const next = js.items?.[0]
                            if (next) {
                              setWindows(prev => prev.map((r, wi) => wi === idx ? { ...r, items: r.items.map((x: any, xi: number) => xi === i ? next : x) } : r))
                            }
                          }
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <ShareControls sessionId={data.sessionId} />
          </>
        )}
      </div>
    </section>
  )
}

// Item card rendered inline with SnackCard

function ShareControls({ sessionId }: { sessionId: string }) {
  const url = `${location.origin}/results/${sessionId}`
  const shortId = sessionId?.slice(0, 8) || sessionId
  const displayUrl = `${location.origin}/results/${shortId}…`
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  return (
    <div className="mt-2">
      <label htmlFor="share-url" className="block text-sm font-medium mb-1">Share link</label>
      <div className="flex items-center gap-2">
        <input id="share-url" className="flex-1 border rounded px-3 py-2" value={displayUrl} readOnly />
        <button onClick={copy} className="bg-emerald-600 text-white px-3 py-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700">Copy link</button>
        {copied && <span className="text-sm text-slate-600" role="status" aria-live="polite">Copied!</span>}
      </div>
    </div>
  )}
