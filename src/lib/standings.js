function ensureTeam(map, name) {
  if (!map.has(name)) {
    map.set(name, { team: name, mp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 })
  }
  return map.get(name)
}

export function computeStandings(matches) {
  // group_code -> Map(team -> row)
  const groups = new Map()

  for (const m of matches) {
    if (m.phase !== 'group') continue
    if (!m.group_code) continue

    if (!groups.has(m.group_code)) groups.set(m.group_code, new Map())
    const gmap = groups.get(m.group_code)

    const a = ensureTeam(gmap, m.home_team)
    const b = ensureTeam(gmap, m.away_team)

    // only count played games
    if (m.home_score == null || m.away_score == null) continue

    a.mp++
    b.mp++
    a.gf += m.home_score
    a.ga += m.away_score
    b.gf += m.away_score
    b.ga += m.home_score

    if (m.home_score > m.away_score) {
      a.w++
      b.l++
      a.pts += 3
    } else if (m.home_score < m.away_score) {
      b.w++
      a.l++
      b.pts += 3
    } else {
      a.d++
      b.d++
      a.pts += 1
      b.pts += 1
    }
  }

  const out = {}
  for (const [group, gmap] of groups.entries()) {
    const rows = Array.from(gmap.values()).map(r => ({ ...r, gd: r.gf - r.ga }))
    rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.team.localeCompare(y.team))
    out[group] = rows
  }
  return out
}
