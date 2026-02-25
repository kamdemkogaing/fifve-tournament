import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AdminTournament() {
  const { slug } = useParams()
  const [sp] = useSearchParams()
  const key = sp.get('key') || ''

  const [tournament, setTournament] = useState(null)
  const [matches, setMatches] = useState([])
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState(null)

  async function load() {
    setError('')
    const { data: t, error: e1 } = await supabase
      .from('tournaments')
      .select('id, slug, name, option, config')
      .eq('slug', slug)
      .single()

    if (e1) {
      setError(e1.message)
      return
    }
    setTournament(t)

    const { data: ms, error: e2 } = await supabase
      .from('matches')
      .select('*')
      .eq('tournament_id', t.id)
      .order('time_text', { ascending: true })

    if (e2) {
      setError(e2.message)
      return
    }
    setMatches(ms ?? [])
  }

  useEffect(() => {
    load()
  }, [slug])

  async function saveScore(matchId, homeScore, awayScore) {
    setSavingId(matchId)
    setError('')
    try {
      const { error: e } = await supabase.rpc('update_match_score', {
        p_slug: slug,
        p_admin_key: key,
        p_match_id: matchId,
        p_home_score: homeScore,
        p_away_score: awayScore,
      })
      if (e) throw e
      await load()
    } catch (err) {
      setError(err.message ?? 'Save failed')
    } finally {
      setSavingId(null)
    }
  }

  if (!key) {
    return (
      <div className="rounded-2xl bg-white shadow p-5">
        <div className="text-red-600 font-medium">Kein Admin-Key gefunden.</div>
        <div className="text-sm text-gray-600 mt-1">
          Öffne den Admin-Link mit <code>?key=...</code>
        </div>
      </div>
    )
  }

  if (error) return <div className="text-red-600">{error}</div>
  if (!tournament) return <div>Lade...</div>

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow p-5">
        <h1 className="text-xl font-semibold">Admin: {tournament.name}</h1>
        <div className="text-sm text-gray-600">Ergebnisse eintragen • Secret-Key aktiv</div>
      </div>

      <div className="rounded-2xl bg-white shadow p-5">
        <h2 className="font-semibold">Gruppenspiele</h2>
        <div className="mt-3 space-y-2">
          {matches
            .filter(m => m.phase === 'group')
            .map(m => (
              <AdminMatchRow key={m.id} match={m} onSave={saveScore} saving={savingId === m.id} />
            ))}
        </div>
      </div>
    </div>
  )
}

function AdminMatchRow({ match, onSave, saving }) {
  const [hs, setHs] = useState(match.home_score ?? '')
  const [as, setAs] = useState(match.away_score ?? '')

  return (
    <div className="flex flex-col md:flex-row md:items-center gap-2 rounded-xl border px-3 py-2 text-sm">
      <div className="w-44 text-gray-500">
        {match.time_text} • {match.field} • {match.group_code}
      </div>
      <div className="flex-1 font-medium">
        {match.home_team} vs {match.away_team}
      </div>
      <div className="flex items-center gap-2">
        <input
          className="w-14 rounded-lg border px-2 py-1 text-center"
          value={hs}
          onChange={e => setHs(e.target.value)}
          inputMode="numeric"
        />
        <span>:</span>
        <input
          className="w-14 rounded-lg border px-2 py-1 text-center"
          value={as}
          onChange={e => setAs(e.target.value)}
          inputMode="numeric"
        />
        <button
          className="ml-2 rounded-xl bg-black text-white px-3 py-1.5 disabled:opacity-50"
          disabled={saving}
          onClick={() =>
            onSave(match.id, hs === '' ? null : Number(hs), as === '' ? null : Number(as))
          }
        >
          {saving ? '...' : 'Speichern'}
        </button>
      </div>
    </div>
  )
}
