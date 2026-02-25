import { useCallback, useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { computeStandings } from '../lib/standings'
import { supabase } from '../lib/supabase'

export default function PublicTournament() {
  const { slug } = useParams()
  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    if (!slug) return

    // cancel flag so old requests can't update state after slug change/unmount
    let cancelled = false

    // NOTE: we return a cleanup function that sets cancelled = true
    // (we'll use it in the effect below)
    const run = async () => {
      setError('')

      const { data: t, error: e1 } = await supabase
        .from('tournaments')
        .select('id, slug, name, option, config, created_at')
        .eq('slug', slug)
        .single()

      if (cancelled) return

      if (e1) {
        setError(e1.message)
        setTournament(null)
        setMatches([])
        return
      }

      setTournament(t)

      const { data: ms, error: e2 } = await supabase
        .from('matches')
        .select('*')
        .eq('tournament_id', t.id)
        .order('time_text', { ascending: true })

      if (cancelled) return

      if (e2) {
        setError(e2.message)
        setMatches([])
        return
      }

      setMatches(ms ?? [])
    }

    await run()

    // provide cleanup setter for callers that want it
    return () => {
      cancelled = true
    }
  }, [slug])

  // initial load + when slug changes
  useEffect(() => {
    let cleanup
    ;(async () => {
      cleanup = await load()
    })()

    return () => {
      if (typeof cleanup === 'function') cleanup()
    }
  }, [load])

  // simple polling for live-ish updates
  useEffect(() => {
    const id = setInterval(() => {
      load()
    }, 15000)

    return () => clearInterval(id)
  }, [load])

  const standings = useMemo(() => computeStandings(matches), [matches])

  if (error) return <div className="text-red-600">{error}</div>
  if (!tournament) return <div>Lade...</div>

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow p-5">
        <h1 className="text-xl font-semibold">{tournament.name}</h1>
        <div className="text-sm text-gray-600">
          Option {tournament.option} • Start 10:00 • 5 Stadien bis 12:00, danach 4
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white shadow p-5">
          <h2 className="font-semibold">Spielplan (Gruppen)</h2>
          <div className="mt-3 space-y-2">
            {matches
              .filter(m => m.phase === 'group')
              .map(m => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
                >
                  <div className="w-24 text-gray-500">
                    {m.time_text} • {m.field}
                  </div>
                  <div className="flex-1 px-3">
                    <div className="font-medium">
                      {m.home_team} vs {m.away_team}
                    </div>
                    <div className="text-xs text-gray-500">
                      {m.group_code} • Runde {m.round}
                    </div>
                  </div>
                  <div className="w-20 text-right tabular-nums">
                    {m.home_score ?? '-'} : {m.away_score ?? '-'}
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white shadow p-5">
          <h2 className="font-semibold">Tabelle</h2>
          <div className="mt-3 space-y-6">
            {Object.entries(standings)
              .sort()
              .map(([group, rows]) => (
                <div key={group}>
                  <div className="font-medium">{group}</div>
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="text-left text-gray-500">
                        <tr>
                          <th className="py-1 pr-3">Team</th>
                          <th className="py-1 pr-2">Sp</th>
                          <th className="py-1 pr-2">P</th>
                          <th className="py-1 pr-2">TD</th>
                          <th className="py-1 pr-2">Tore</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((r, idx) => (
                          <tr key={r.team} className="border-t">
                            <td className="py-1 pr-3 font-medium">
                              {idx + 1}. {r.team}
                            </td>
                            <td className="py-1 pr-2 tabular-nums">{r.mp}</td>
                            <td className="py-1 pr-2 tabular-nums">{r.pts}</td>
                            <td className="py-1 pr-2 tabular-nums">{r.gd}</td>
                            <td className="py-1 pr-2 tabular-nums">
                              {r.gf}:{r.ga}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            <div className="text-xs text-gray-500">Auto-Update alle 15 Sekunden.</div>
          </div>
        </div>
      </div>
    </div>
  )
}
