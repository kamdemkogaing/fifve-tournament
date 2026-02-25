import { useState } from 'react'
import { buildGroupMatches, scheduleMatches } from '../lib/schedule'
import { supabase } from '../lib/supabase'

function randomKey(len = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let s = ''
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

export default function Home() {
  const [name, setName] = useState('FIFVE 2026')
  const [slug, setSlug] = useState('fifve-2026')
  const [option, setOption] = useState('A')
  const [playMinutes, setPlayMinutes] = useState(18)
  const [breakMinutes, setBreakMinutes] = useState(5)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function createTournament() {
    setError('')
    setLoading(true)
    try {
      const adminKey = randomKey(12)

      const numGroups = option === 'A' ? 6 : 5

      const startISO = '2026-02-28T10:00:00.000Z'
      const cutoffISO = '2026-02-28T12:00:00.000Z'

      const group = buildGroupMatches(numGroups, 'G')
      const { scheduled } = scheduleMatches(group, {
        startTimeISO: startISO,
        cutoffISO,
        playMinutes,
        breakMinutes,
        fieldsBefore: 5,
        fieldsAfter: 4,
      })

      // 1) Tournament insert
      const { data: t, error: e1 } = await supabase
        .from('tournaments')
        .insert([
          {
            slug,
            name,
            option,
            admin_key: adminKey,
            config: {
              startISO,
              cutoffISO,
              playMinutes,
              breakMinutes,
              note: '5 stadiums until 12:00, then 4',
            },
          },
        ])
        .select()
        .single()

      if (e1) throw e1

      // 2) Matches insert (group)
      const payload = scheduled.map(m => ({
        tournament_id: t.id,
        phase: m.phase,
        group_code: m.group_code,
        round: m.round,
        time_text: m.time_text,
        field: m.field,
        home_team: m.home_team,
        away_team: m.away_team,
      }))

      const { error: e2 } = await supabase.from('matches').insert(payload)
      if (e2) throw e2

      setResult({
        slug,
        adminKey,
        publicUrl: `${window.location.origin}/t/${slug}`,
        adminUrl: `${window.location.origin}/admin/${slug}?key=${adminKey}`,
      })
    } catch (err) {
      setError(err.message ?? 'Error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl bg-white shadow p-5">
        <h1 className="text-xl font-semibold">Turnier erstellen</h1>
        <p className="text-sm text-gray-600 mt-1">
          Start 10:00, 5 Stadien bis 12:00, danach 4. Public-Link zum Teilen + Admin-Link für
          Ergebnisse.
        </p>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="text-sm">
            Name
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Slug (URL)
            <input
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={slug}
              onChange={e => setSlug(e.target.value)}
            />
          </label>

          <label className="text-sm">
            Option
            <select
              className="mt-1 w-full rounded-xl border px-3 py-2"
              value={option}
              onChange={e => setOption(e.target.value)}
            >
              <option value="A">A (24 Teams, 6 Gruppen)</option>
              <option value="B">B (20 Teams, 5 Gruppen)</option>
            </select>
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="text-sm">
              Spielzeit
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={playMinutes}
                onChange={e => setPlayMinutes(Number(e.target.value))}
              >
                <option value={18}>18 min</option>
                <option value={20}>20 min</option>
              </select>
            </label>
            <label className="text-sm">
              Pause
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                type="number"
                min={0}
                value={breakMinutes}
                onChange={e => setBreakMinutes(Number(e.target.value))}
              />
            </label>
          </div>
        </div>

        <button
          onClick={createTournament}
          disabled={loading}
          className="mt-4 rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? 'Erstelle...' : 'Erstellen'}
        </button>

        {error && <div className="mt-3 text-sm text-red-600">{error}</div>}
      </div>

      {result && (
        <div className="rounded-2xl bg-white shadow p-5 space-y-2">
          <h2 className="font-semibold">Links</h2>
          <div className="text-sm">
            <div>
              <span className="text-gray-500">Public:</span>{' '}
              <a className="underline" href={result.publicUrl}>
                {result.publicUrl}
              </a>
            </div>
            <div>
              <span className="text-gray-500">Admin:</span>{' '}
              <a className="underline" href={result.adminUrl}>
                {result.adminUrl}
              </a>
            </div>
            <div className="mt-2 text-xs text-gray-500">
              Admin-Link geheim halten (damit nur du Ergebnisse ändern kannst).
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
