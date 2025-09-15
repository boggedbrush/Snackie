import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { to12Hour } from '../lib/format'
import SnackCard from '../components/SnackCard'
import ComboPair from '../components/ComboPair'

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
                className="text-sm text-yellow-700 underline"
              >Edit answers</button>
            </div>
            <div className="space-y-4" aria-live="polite" aria-busy={loading}>
              {windows.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 border rounded bg-white">
                  <div className="flex items-center justify-between">
                    <h2 className="font-medium">{to12Hour(rec.time)}</h2>
                    <button
                      className="text-sm px-2 py-1 rounded border border-slate-300 text-slate-700 hover:bg-yellow-50"
                      onClick={async () => {
                        const allNames = windows.flatMap((w: any) => w.items.map((it: any) => it.name))
                        const exclude = encodeURIComponent(allNames.join(','))
                        const allAddons = windows.flatMap((w: any) => (w.items || []).filter((it: any) => it.isCombo).map((it: any) => (it.addNames?.[0] || '')))
                        const excludeAdds = encodeURIComponent(allAddons.filter(Boolean).join(','))
                        const restrictions = encodeURIComponent((data.quiz?.restrictions || []).join(','))
                        const pref = encodeURIComponent(data.quiz?.preference || 'balanced')
                        // fetch one combo and two singles
                        const [resCombo, resSingles] = await Promise.all([
                          fetch(`/api/snacks?type=${pref}&limit=1&exclude=${exclude}&excludeAdds=${excludeAdds}&restrictions=${restrictions}&combine=combo`),
                          fetch(`/api/snacks?type=${pref}&limit=2&exclude=${exclude}&restrictions=${restrictions}&side=true`)
                        ])
                        if (resCombo.ok && resSingles.ok) {
                          const combo = (await resCombo.json()).items?.[0]
                          const singles = (await resSingles.json()).items || []
                          if (combo) {
                            setWindows(prev => prev.map((r, i) => i === idx ? { ...r, items: [combo, ...singles] } : r))
                          }
                        }
                      }}
                    >Show alternatives</button>
                  </div>
                  <p className="text-sm text-slate-700">{rec.rationale}</p>
                  {(() => {
                    const combo = rec.items.find((x: any) => x.isCombo)
                    const singles = rec.items.filter((x: any) => !x.isCombo).slice(0, 2)
                    const renderCombo = combo ? (
                      <div className="mb-3">
                        <ComboPair
                          item={combo}
                          onSwap={async () => {
                            const allNames = windows.flatMap((w: any) => w.items.map((it: any) => it.name))
                            const exclude = encodeURIComponent(allNames.join(','))
                            const allAddons = windows.flatMap((w: any) => (w.items || []).filter((it: any) => it.isCombo).map((it: any) => (it.addNames?.[0] || '')))
                            const excludeAdds = encodeURIComponent(allAddons.filter(Boolean).join(','))
                            const restrictions = encodeURIComponent((data.quiz?.restrictions || []).join(','))
                            const pref = encodeURIComponent(data.quiz?.preference || 'balanced')
                            const res = await fetch(`/api/snacks?type=${pref}&limit=1&exclude=${exclude}&excludeAdds=${excludeAdds}&restrictions=${restrictions}&combine=combo`)
                            if (res.ok) {
                              const js = await res.json()
                              const next = js.items?.[0]
                              if (next) {
                                setWindows(prev => prev.map((r, wi) => wi === idx ? { ...r, items: [next, ...r.items.filter((x: any) => !x.isCombo)] } : r))
                              }
                            }
                          }}
                          onSwapBase={async () => {
                            const allNames = windows.flatMap((w: any) => w.items.map((it: any) => it.name))
                            const exclude = encodeURIComponent(allNames.join(','))
                            const restrictions = encodeURIComponent((data.quiz?.restrictions || []).join(','))
                            const pref = encodeURIComponent(data.quiz?.preference || 'balanced')
                            const addName = encodeURIComponent((combo.addNames?.[0]) || '')
                            const res = await fetch(`/api/snacks?type=${pref}&limit=1&exclude=${exclude}&restrictions=${restrictions}&combine=combo&addon=${addName}`)
                            if (res.ok) {
                              const js = await res.json()
                              const next = js.items?.[0]
                              if (next) {
                                setWindows(prev => prev.map((r, wi) => wi === idx ? { ...r, items: [next, ...r.items.filter((x: any) => !x.isCombo)] } : r))
                              }
                            }
                          }}
                          onSwapAdd={async () => {
                            const allNames = windows.flatMap((w: any) => w.items.map((it: any) => it.name))
                            const exclude = encodeURIComponent(allNames.join(','))
                            const allAddons = windows.flatMap((w: any) => (w.items || []).filter((it: any) => it.isCombo).map((it: any) => (it.addNames?.[0] || '')))
                            const excludeAdds = encodeURIComponent(allAddons.filter(Boolean).join(','))
                            const restrictions = encodeURIComponent((data.quiz?.restrictions || []).join(','))
                            const pref = encodeURIComponent(data.quiz?.preference || 'balanced')
                            const baseName = encodeURIComponent((combo.baseName) || '')
                            const res = await fetch(`/api/snacks?type=${pref}&limit=1&exclude=${exclude}&excludeAdds=${excludeAdds}&restrictions=${restrictions}&combine=combo&base=${baseName}`)
                            if (res.ok) {
                              const js = await res.json()
                              const next = js.items?.[0]
                              if (next) {
                                setWindows(prev => prev.map((r, wi) => wi === idx ? { ...r, items: [next, ...r.items.filter((x: any) => !x.isCombo)] } : r))
                              }
                            }
                          }}
                        />
                      </div>
                    ) : null

                    const renderSingles = (
                      <div className="grid gap-3 sm:grid-cols-2">
                        {singles.map((it: any, i: number) => (
                          <SnackCard
                            key={i}
                            item={it}
                            onSwap={async () => {
                              const allNames = windows.flatMap((w: any) => w.items.map((it: any) => it.name))
                              const exclude = encodeURIComponent(allNames.join(','))
                              const restrictions = encodeURIComponent((data.quiz?.restrictions || []).join(','))
                              const pref = encodeURIComponent(data.quiz?.preference || 'balanced')
                              const res = await fetch(`/api/snacks?type=${pref}&limit=1&exclude=${exclude}&restrictions=${restrictions}&side=true`)
                              if (res.ok) {
                                const js = await res.json()
                                const next = js.items?.[0]
                                if (next) {
                                  setWindows(prev => prev.map((r, wi) => wi === idx ? { ...r, items: [
                                    ...(r.items.find((x: any) => x.isCombo) ? [r.items.find((x: any) => x.isCombo)!] : []),
                                    ...r.items.filter((x: any) => !x.isCombo).map((x: any, xi: number) => xi === i ? next : x)
                                  ] } : r))
                                }
                              }
                            }}
                          />
                        ))}
                      </div>
                    )

                    return (
                      <div>
                        {renderCombo}
                        {renderSingles}
                      </div>
                    )
                  })()}
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
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500) } catch {}
  }
  return (
    <div className="mt-2">
      <label htmlFor="share-url" className="block text-sm font-medium mb-1">Share link</label>
      <div className="flex items-center gap-2 w-full">
        <input
          id="share-url"
          className="flex-1 min-w-0 border rounded px-3 py-2"
          value={url}
          readOnly
        />
        <button onClick={copy} className="btn-banana px-3 py-2 rounded-md">Copy link</button>
        {copied && <span className="text-sm text-slate-600" role="status" aria-live="polite">Copied!</span>}
      </div>
    </div>
  )}
